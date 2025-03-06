# Styling Structure for Relocate.io

This directory contains all the CSS files for the Relocate.io application. The styling is organized in a modular way to make it maintainable and scalable.

## Structure

- `global.css`: Contains global variables, reset styles, and utility classes used throughout the application.
- `App.css`: Contains styles for the main layout and common components.
- `components/`: Contains component-specific styles.
- `pages/`: Contains page-specific styles.

## Styling Approach

1. **Component-Based Styling**: Each component has its own CSS file with the same name as the component.
2. **CSS Variables**: Global variables are defined in `global.css` for consistent colors, spacing, and other design tokens.
3. **BEM-like Naming**: Class names follow a BEM-like approach (Block, Element, Modifier) for clarity and to avoid conflicts.
4. **Responsive Design**: Media queries are used to ensure the application looks good on all device sizes.

## Adding New Styles

When adding a new component:

1. Create a new CSS file in the appropriate directory (`components/` or `pages/`).
2. Import the CSS file in the component file.
3. Use the existing CSS variables for consistency.
4. Add responsive styles as needed.

## Color Palette

The application uses the following color palette:

- Primary: `#4a6fa5` (Blue)
- Secondary: `#166088` (Dark Blue)
- Accent: `#4cb963` (Green)
- Background: `#f8f9fa` (Light Gray)
- Text: `#333333` (Dark Gray)

These colors are defined as CSS variables in `global.css` and can be used throughout the application. 