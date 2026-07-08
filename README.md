# CSS shape() Visual Editor & Generator

An interactive, zero-dependency graphical utility to design, edit, and animate CSS Level 2 `clip-path: shape(...)` declarations. 

This project runs entirely on native browser ES Modules and has **no local Node.js or npm dependencies**.

## Prerequisites

Ensure you have the SASS and TypeScript compilers installed globally on your system:

```bash
# Install globally on your system
npm install -g sass typescript
```

## Environment Configuration

The build system supports optional optimization using Google Closure Compiler. To enable JavaScript minification, create a `.env` file in the project root:

```env
# Path to your local Google Closure Compiler jar file
CLOSURE_COMPILER_PATH="/var/www/html/lib/compiler.jar"
```

If this variable is defined and points to a valid `.jar` file, the compilation script will automatically optimize the output JavaScript.

## Compilation & Asset Generation

An automated compilation script is provided to compile both stylesheets and TypeScript files.

### Using the Build Script

Run the POSIX-compliant script from your terminal to compile all assets:

```bash
# Make the script executable
chmod +x script.sh

# Run the compilation
./script.sh
```

## Local Development Server

Because the application uses native browser ES Modules, it must be served over HTTP rather than opened directly as a local file. You can spin up a lightweight server using Python:

```bash
# Start a local server on Debian
python3 -m http.server 3000
```

Once started, open your browser and navigate to `http://localhost:3000`.

## Specifications & Architecture
To learn more about the design decisions, accessibility constraints (RGAA/WCAG),
the presets catalog, or specific display bug-fixes, please refer to the
[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) document.

## Author

Created and maintained by Lionel Péramo.

I'm a French full-stack developer focused on performance, web standards and sustainable web development.

- Website: https://lionel-peramo.com
- LinkedIn: https://www.linkedin.com/in/lionel-p%C3%A9ramo-web-development/
- Bluesky: https://bsky.app/profile/lionelperamo.bsky.social