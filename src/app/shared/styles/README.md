# SCSS Architecture Documentation

## Overview
The Gig Logger application styles have been refactored from a single large `styles.scss` file (1590+ lines) into a modular, maintainable SCSS architecture organized by functionality.

## File Structure

```
src/
├── styles.scss                           # Main entry point (imports index.scss)
└── app/shared/styles/
    ├── index.scss                        # Master import file
    ├── color-vars.scss                   # Color variables (existing)
    ├── _reset.scss                       # Reset & base styles
    ├── _typography.scss                  # Typography system
    ├── _layout.scss                      # Layout utilities & grid
    ├── _components.scss                  # Reusable component styles
    ├── _forms.scss                       # Form utilities & styling  
    ├── _buttons.scss                     # Button styles & variants
    ├── _material-overrides.scss          # Material Design customizations
    ├── _utilities.scss                   # Utility classes
    └── _accessibility.scss               # Accessibility & responsive features
```

## Import Order
The import order in `index.scss` is crucial for proper CSS cascade:

1. **Variables** - `color-vars.scss`
2. **Reset** - `_reset.scss` 
3. **Typography** - `_typography.scss`
4. **Layout** - `_layout.scss`
5. **Components** - `_components.scss`
6. **Forms** - `_forms.scss`
7. **Buttons** - `_buttons.scss`
8. **Material Overrides** - `_material-overrides.scss`
9. **Utilities** - `_utilities.scss`
10. **Accessibility** - `_accessibility.scss`

## Module Descriptions

### `_reset.scss`
- CSS reset and normalize styles
- Base HTML/body styling
- Material Icons font declarations
- Loading spinner animations
- Basic link styles

### `_typography.scss`
- Mobile-first typography scale
- Heading styles (h1-h6)
- Text utility classes
- Color text variants
- Font weight and size utilities

### `_layout.scss`
- Container system
- Flexbox utilities
- Grid layout utilities
- Spacing utilities (margin/padding)
- Width/height utilities
- Responsive visibility classes

### `_components.scss`
- Card system with variants
- Badge system
- Stats display components
- Interactive element styles
- Component-specific styling

### `_forms.scss`
- Form containers and sections
- Form rows and field layouts
- Field size variants (full, half, third, quarter)
- Mobile form optimizations
- Form validation styling

### `_buttons.scss`
- Button base styles
- Material button enhancements
- Button variants (primary, secondary, success, warning, danger)
- Button sizes (small, large, full-width)
- Button groups and states
- Loading and toggle states

### `_material-overrides.scss`
- Material Design component customizations
- Form field styling
- Select, checkbox, radio customizations
- Dialog, snackbar, toolbar styling
- Navigation and menu styling

### `_utilities.scss`
- Display utilities (flex, grid, block, etc.)
- Flexbox utilities
- Spacing utilities
- Position utilities
- Text alignment and decoration
- Border and shadow utilities

### `_accessibility.scss`
- Screen reader utilities
- Focus management
- High contrast mode support
- Reduced motion preferences
- Responsive breakpoints
- Touch target optimizations
- Print styles

## Key Features

### Mobile-First Design
All styles are written with mobile-first approach using `min-width` media queries.

### CSS Custom Properties
The architecture uses CSS custom properties (`var(--variable)`) for better browser compatibility and dynamic theming.

### Touch-Friendly
Minimum 44px touch targets for better mobile accessibility.

### Performance Optimized
- Modular imports reduce unused CSS
- Efficient selector organization
- Optimized for production builds

### Accessibility
- WCAG 2.1 compliant color contrasts
- Screen reader support
- Keyboard navigation
- Reduced motion support

## Usage

### Adding New Styles
1. Identify the appropriate module for your styles
2. Add styles to the relevant `_module.scss` file
3. Use consistent naming conventions (BEM-like)
4. Follow mobile-first responsive patterns

### Creating New Modules
1. Create new `_module.scss` file in `src/app/shared/styles/`
2. Add import to `index.scss` in appropriate order
3. Document the module purpose and contents

### Variable Usage
Use CSS custom properties for dynamic values:
```scss
.my-component {
  color: var(--text-primary);
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
}
```

## Benefits

1. **Maintainability** - Logical organization makes code easier to find and modify
2. **Scalability** - New styles can be added to appropriate modules
3. **Performance** - Better tree-shaking and smaller bundle sizes
4. **Collaboration** - Multiple developers can work on different modules
5. **Debugging** - Easier to locate and fix style issues
6. **Consistency** - Standardized patterns and conventions

## Migration Notes

- Original `styles.scss` backed up to `styles-backup.scss`
- All existing functionality preserved
- Build process unchanged
- No breaking changes to component styles
