# Project Summary: CSS shape() Generator

## Project Intent
An interactive browser-based graphical utility to edit and generate standard level 2 `clip-path: shape(...)`
declarations. It replaces manual coordinate calculations and constant browser refreshes with graphical anchors to
draw, edit, and animate complex silhouettes in real time.

## Specifications and Constraints
- **Zero Dependencies**: Built exclusively with pure vanilla TypeScript and SCSS styles, completely avoiding CSS
  resets and external JS/CSS frameworks to ensure a lightweight footprint and zero side-effects.
- **Stable Input Focus**: Designed so that typing values directly in sidebar inputs edits the shape dynamically,
  while pointer dragging on the interactive canvas updates values in input fields without stealing keyboard focus.
- **Expanded Variable Naming**: Complete rejection of abbreviations in the codebase to improve readability and
  long-term maintainability (e.g., using `xCoordinate` instead of `x`, `syntaxModifier` instead of `subType`,
  `firstControlCircle` instead of `ctrlRef`).
- **OKLCH Color Space**: Styled using native CSS `oklch(L C H)` color functions for modern dark and light palettes,
  featuring dark panel layers (`#0F1115`, `#161B22`, `#0D1117`) and high-contrast active handle layouts.
- **Responsive Mode & Support**: Automatic fallback layout accommodating light themes (`body.theme-light` &
  `(prefers-color-scheme: light)`) and tailored print layouts (`@media print`) that strip interactive controls to
  optimize physical print outputs.
- **Accessibility (RGAA/WCAG)**: Form labels are strictly linked with inputs, high-contrast outlines are present on
  active elements, and focus states have standard visible outline offsets.

## Features Implemented
1. **Interactive SVG Painting Canvas**: Overlaid on a responsive 400x400 vector coordinate grid. Highlights active
   selection steps, supports mouse/touch pointer drag operations, and displays cursor coordinates in real time.
2. **Context-Aware Point Insertion**: Canvas double-clicks place a new `line to` anchor. If an anchor is currently
   selected, the new point is inserted immediately *after* the selected command instead of at the end of the array.
3. **Preset Library**: Contains 36 shape presets (including speech bubble, sacred heart, 5-point star, national
   shield, wave banner, octagonal badge, teardrop, crescent moon, infinity, classic hourglass, solar eclipse arc,
   polygons from triangle to decagon, bevel, rabbet, left/right arrows, left/right points, left/right chevrons,
   cross, message, close, frame, inset, circle, and ellipse). Each preset renders dynamically as a visual micro-icon
   using inline CSS `shape()` masks and gradients.
4. **Transition Animation Player (Keyframe Workbench)**: Lets developers save a "State A" shape configuration,
   modify the path on screen, save it to "State B", and play a genuine CSS transition loop on a preview element
   with customized durations using a range slider.
5. **Universal Unit Converter Suite**: Allows changing all coordinates across the entire shape between pixels
   (`px`), percentages (`%`), and root elements (`rem`) in a single click, instantly transforming calculations based
   on physical grid projection.
6. **Live Parent Font-Size Baseline**: Integrates a toolbar-mounted input field allowing real-time adjustment of the
   baseline parent font-size (in pixels), immediately re-scaling active relative `rem` unit math and drawing states.
7. **Code Terminal Block**: Provides real-time formatted CSS output with a single-click copy action and visual success
   toast indicators.
8. **Internationalization & Language Switcher**: Configured with a default English-first system supporting complete
   English and French translations for static content, SVG pointer descriptions, coordinates, transition players,
   and dynamic presets.
9. **Interactive Theme Switcher**: Added a toolbar toggle allowing real-time transition between deep cosmic dark
   canvas aesthetics and crisp paper light themes, with system default preference sniffing and localStorage state
   persistence.
10. **Site Footer & Project Promotion**: Minimalist footer providing direct links to secondary technical projects
    (OTRA, EcoComposer, technical blog) and professional LinkedIn profile to foster community connections.

## Current Project State & Technical Implementation
- **Code Quality**: Completely framework-free. TypeScript typing is fully resolved, and both compilation and lint
  checks pass successfully.
- **Layout & Toast Notification**: Solved overlap issues with the bottom-right toast banner when inactive by
  implementing explicit CSS opacity transitions and hidden visibility overrides.
- **Touch and Pointer Interactions**: Drag movements are bound to global `window` events and paired with
  `touch-action: none` rules to ensure continuous, reliable drag sequences.
- **Coordinate Projection Alignment**: Mismatches between absolute clip-path coordinates and SVG handles were
  resolved by wrapping the `#clippedElement` in a fixed 400x400px box, scaled dynamically using CSS
  `transform: scale(factor)` upon updates and window resize events.
- **WCAG/RGAA Contrast compliance**: Achieved high color contrast ratios exceeding 7:1 for all captions, labels,
  guidelines, and corner overlays (e.g., `0,0` and `100%,0`) in both light and dark modes.
- **Asset Performance**: All non-dynamic variables (fonts, border-radii, grid styling parameters) are refactored
  into compile-time SASS variables, stripping them from browser custom property lookup scopes.
- **Keyboard Navigation Controls**: Fully supports keyboard interactions on both anchors and curve controls. Users
  can focus SVG points via keyboard, select with Enter or Space, translate them in 1px steps using Arrow keys (or
  10px holding Shift), and retain keyboard focus during DOM redraw events.
- **Screen Reader Announcements**: Integrates a polite ARIA live announcer (`aria-live="polite"`) that verbally
  announces actions (such as loading presets, creating, reordering, or deleting commands) for non-visual users.
- **Dependency Cleanup**: Fully stripped unused framework-specific dependencies (such as React, Tailwind, and Lucide)
  from the project files and package manifests.
- **SVG Handle Cross-Browser Rendering**: Prevented layout jitter and centering issues on Firefox, Safari, and
  Chrome by replacing inconsistent CSS `transform: scale()` on absolute SVG coordinate positions with modern native
  CSS transitions on the SVG `r` (radius) property during hover/drag interactions.
- **Focus Outline Overrides**: Excluded browser-default rectangular focus outlines from active SVG handle structures
  on click and active drag sequences using fallback `outline: none` rules, preserving custom circular focus states.
- **System Preference Fallbacks**: Resolved SASS custom property lookup bugs on browsers with default system light
  themes by declaring explicit variable states under `body.theme-dark` in the stylesheet.
- **Animation Module Synchronization**: The animated preview is defined to be exactly 400x400px and scaled down via
  CSS `transform: scale(0.25)`. This aligns its coordinate grid 1-to-1 with the editor, guaranteeing absolute and
  relative units clip the preview element with accuracy. It features immediate visual feedback when saving states (A and
  B) and initiates a smooth CSS clip-path transition loop.
- **Integrated Code Tabs**: Toggles between static `clip-path` output and real-time transition blocks (including SASS
  transitions and keyframe loops), auto-focusing the animation block when states are saved or tested.
- **Details-Based Collapsible Layout**: All collapsible blocks are refactored into native, semantic `<details>` and
  `<summary>` components. Focus and disclosure are browser-native, chevron indicators animate cleanly via `:not([open])`
  visual states, card states persist in `localStorage` via native toggle event listeners, and programmatic expansions
  trigger automatically when action elements are clicked.
- **SEO Parameters**: Configured title tags (55 characters: *CSS shape() Visual Editor & Generator - Clip Path Maker*),
  description (152 characters), canonical URL (`https://shape.lionel-peramo.com/`), structured JSON-LD WebApplication
  schema, automated sitemaps, and strict crawl instructions in robots.txt.