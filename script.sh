#!/bin/sh

# Ensure build target directories exist inside dist and src/js
mkdir -p dist/css dist/js src/js

# Clean up any leftover stale files in dist/js to keep it pristine
rm -f dist/js/*.js

# Gracefully terminate all background processes without signal recursion loops
trap 'trap - INT TERM EXIT; kill 0' INT TERM EXIT

# Resolve the path to Google Closure Compiler
if [ -f '.env' ]; then
  . ./.env
fi

CLOSURE_JAR="${CLOSURE_COMPILER_PATH}"

if [ -z "$CLOSURE_JAR" ] || [ ! -f "$CLOSURE_JAR" ]; then
  if [ -f '/var/www/html/lib/compiler.jar' ]; then
    CLOSURE_JAR='/var/www/html/lib/compiler.jar'
  elif [ -f 'closure-compiler.jar' ]; then
    CLOSURE_JAR='closure-compiler.jar'
  else
    echo 'Error: Google Closure Compiler .jar file not found.'
    echo 'Please define CLOSURE_COMPILER_PATH in a local .env file.'
    exit 1
  fi
fi

echo "Using Google Closure Compiler located at: $CLOSURE_JAR"

echo "Starting Sass compiler with native minification..."
sass --watch --style=compressed src/scss/pages/editor/editor.scss:dist/css/editor.css &

echo "Starting TypeScript compiler (tsc)..."
tsc -w &

# Wait briefly for tsc to finish its initial compilation
echo "Waiting for TypeScript compiler to generate initial files..."
sleep 2

# Native function to trigger Google Closure Compiler with dynamic logging
compile_bundle() {
  echo "Rebuilding minified JavaScript bundle..."
  start_time=$(date +%s)

  java -jar "$CLOSURE_JAR" \
    --js="src/js/*.js" \
    --entry_point=src/js/main.js \
    --module_resolution=BROWSER \
    --dependency_mode=PRUNE \
    --compilation_level=SIMPLE \
    --js_output_file=dist/js/main.js

  exit_status=$?
  end_time=$(date +%s)
  elapsed_time=$((end_time - start_time))

  if [ $exit_status -eq 0 ]; then
    echo "✓ Minified bundle rebuilt successfully in ${elapsed_time}s (dist/js/main.js)."
  else
    echo "✕ Google Closure Compiler failed with exit code $exit_status."
  fi
}

# Run an initial compilation immediately on startup
compile_bundle

echo "Starting Google Closure Compiler file watchdog..."
last_modification_time=$(find src/js -name "*.js" -exec stat -c "%Y" {} + 2>/dev/null | sort -n | tail -1)

while true; do
  # Retrieve the latest modification timestamp among the compiled JS files
  current_modification_time=$(find src/js -name "*.js" -exec stat -c "%Y" {} + 2>/dev/null | sort -n | tail -1)

  if [ "$current_modification_time" != "$last_modification_time" ] && [ -n "$current_modification_time" ]; then
    last_modification_time="$current_modification_time"
    compile_bundle
  fi
  sleep 1
done