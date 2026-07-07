# CSS shape() Visual Editor & Generator

An interactive, zero-dependency graphical utility to design, edit, and animate CSS Level 2 `clip-path: shape(...)` declarations. 

This project runs entirely on native browser ES Modules and has **no local Node.js or npm dependencies**.

## Prerequisites

Ensure you have the SASS and TypeScript compilers installed globally on your system:

```bash
# Install globally on your system
npm install -g sass typescript
```

## Compilation

Before running the application, you need to compile the stylesheet and TypeScript files.

### One-time Build

```bash
# Compile the Sass stylesheet
sass src/scss/pages/editor/editor.scss src/css/editor.css

# Compile the TypeScript files
tsc
```

### Live Development Watchers

To automatically compile your files as you edit them, run these commands in your terminal:

```bash
# Watch Sass files
sass --watch src/scss/pages/editor/editor.scss:src/css/editor.css

# Watch TypeScript files
tsc -w
```

## Local Development Server

Because the application uses native browser ES Modules, it must be served over HTTP rather than opened directly as a local file. You can spin up a lightweight server using Python:

```bash
# Start a local server on Debian
python3 -m http.server 3000
```

Once started, open your browser and navigate to `http://localhost:3000`.

## Author

Created and maintained by Lionel Péramo.

I'm a French full-stack developer focused on performance, web standards and sustainable web development.

- Website: https://lionel-peramo.com
- LinkedIn: https://www.linkedin.com/in/lionel-p%C3%A9ramo-web-development/
- Bluesky: https://bsky.app/profile/lionelperamo.bsky.social