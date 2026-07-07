# Contributing Guidelines

Thank you for your interest in contributing to this project! This is a framework-free,
zero-dependency vanilla TypeScript and SASS visual tool.

## Local Development Setup

1. Ensure you have SASS and TypeScript installed globally:
   ```bash
   npm install -g sass typescript
   ```
2. Compile the assets:
  - SASS: `sass src/scss/pages/editor/editor.scss src/css/editor.css`
  - TypeScript: `tsc`
3. Serve the folder using a local HTTP server:
   ```bash
   python3 -m http.server 3000
   ```

## Development Rules & Constraints

- **No Frameworks**: Do not introduce any external npm, JS, or CSS runtime dependencies.
- **Code Clarity**: Do not use abbreviations for variables or properties (e.g., use `xCoordinate`
  instead of `x`).
- **Styling**: Always use fluid CSS with OKLCH color spaces. Sort CSS properties alphabetically.
- **Accessibility**: Ensure keyboard navigation, focus outlines, and the ARIA live announcer
  system remain fully functional.

## Submitting Changes

1. Fork the repository and create your branch from `main`.
2. Commit your changes with a clean, descriptive message.
3. Open a Pull Request detailing your fix or feature.