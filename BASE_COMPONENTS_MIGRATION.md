# Base Components Migration Plan

## Overview
This document outlines how to migrate existing components to use the new reusable base components (`BaseButtonComponent`, `BaseCardComponent`, `BaseInputComponent`).

## Benefits
- **Consistency**: All buttons, cards, and inputs look and behave the same across the app
- **Dark mode**: Built-in theme support—no more manual styling needed
- **Maintainability**: Update theming once in base components, not in 20 different places
- **Accessibility**: Proper focus states, ARIA labels, and semantic HTML
- **Mobile-first**: Touch-friendly sizing (44px minimum touch targets)

---

## Component APIs

### BaseButtonComponent
```typescript
<app-base-button 
  [variant]="'primary' | 'secondary' | 'outlined' | 'danger' | 'icon'"
  [size]="'sm' | 'md' | 'lg'"
  [icon]="'icon_name'"
  [iconPosition]="'left' | 'right'"
  [disabled]="false"
  [loading]="false"
  [fullWidth]="false"
  (clicked)="onButtonClick()"
>
  Button Text
</app-base-button>
```

**Variants:**
- `primary` - Solid blue button (use for main actions)
- `secondary` - Surface-colored button (use for alternative actions)
- `outlined` - Bordered button (use for less important actions)
- `danger` - Red button (use for destructive actions)
- `icon` - Circle icon button (use for toolbar/header icons)

**Sizes:**
- `sm` - 32px height, 14px font (for compact layouts)
- `md` - 40px height, 16px font (default, most common)
- `lg` - 48px height, 18px font (for prominent CTAs)

---

### BaseCardComponent
```typescript
<app-base-card 
  [title]="'Card Title'"
  [titleIcon]="'check_circle'"
  [subtitle]="'Optional subtitle text'"
  [variant]="'default' | 'elevated' | 'outlined'"
  [padding]="'sm' | 'md' | 'lg'"
>
  Card content goes here
</app-base-card>
```

**Variants:**
- `default` - Light border (standard cards)
- `elevated` - Subtle shadow (for elevated content)
- `outlined` - Thicker border (for important sections)

**Padding:**
- `sm` - 0.75rem (12px)
- `md` - 1rem (16px, default)
- `lg` - 1.5rem (24px)

---

### BaseInputComponent
```typescript
<app-base-input 
  [(ngModel)]="value"
  [label]="'Email Address'"
  [type]="'email'"
  [placeholder]="'Enter your email'"
  [hint]="'We'll never share your email'"
  [error]="'Invalid email format'"
  [icon]="'email'"
  [iconPosition]="'right'"
  [required]="true"
  [disabled]="false"
/>
```

**Features:**
- ControlValueAccessor support (works with `ngModel` and `FormControl`)
- Material form field integration
- Automatic error message display
- Helper/hint text
- Optional icon with left/right positioning

---

## Migration Strategy

### Phase 1: Test Components in Staging
- [ ] Add base components to mock-location (test in light & dark modes)
- [ ] Verify dark mode switching works correctly
- [ ] Test mobile and desktop responsiveness
- [ ] Run unit tests for accessibility

### Phase 2: Audit Existing Components
Identify all locations using:
- `mat-button`, `mat-stroked-button`, `mat-icon-button`
- `mat-card`
- `mat-form-field` + `matInput`

**Quick scan:**
```bash
# Count button usages
grep -r "mat-button\|mat-stroked-button" src/app --include="*.html" | wc -l

# Count card usages
grep -r "mat-card" src/app --include="*.html" | wc -l

# Count input usages
grep -r "mat-form-field" src/app --include="*.html" | wc -l
```

### Phase 3: Prioritize Components for Migration
Start with components that have **dark mode issues** or **repeated custom styling**:

**High Priority** (have dark mode/styling issues):
- `mock-location.component` ✓ (refactor as example)
- `app.component` (header/nav buttons)
- Settings/preferences pages
- Form pages (shifts, trips, expenses)

**Medium Priority** (moderate custom styling):
- Diagnostics page
- Stats/metrics pages
- Trip details views

**Low Priority** (minimal custom styling):
- Utility components
- Simple helper components

### Phase 4: Migration Process

For each component:

1. **Import base components**
   ```typescript
   import { BaseButtonComponent, BaseCardComponent, BaseInputComponent } from '@components/base';
   ```

2. **Replace Material components in template**
   - Change `<mat-button>` → `<app-base-button>`
   - Change `<mat-card>` → `<app-base-card>`
   - Change `<mat-form-field>` → `<app-base-input>`

3. **Remove component-specific button/card SCSS**
   - Delete custom button styling (`.my-button`, `.btn-primary`, etc.)
   - Delete custom card styling (`.my-card`, `.card-header`, etc.)
   - Keep only layout-specific SCSS

4. **Test in both light and dark modes**
   - Verify colors are correct
   - Check button hover/active states
   - Verify input focus states

5. **Update unit tests**
   - No need to test Material internals anymore
   - Focus on component logic only

---

## Example: Migrating mock-location Component

### Before:
```html
<mat-card class="mock-location-card">
  <mat-card-header>
    <mat-card-title>Mock Location (Testing)</mat-card-title>
  </mat-card-header>
  
  <button mat-stroked-button class="reset-button">
    <mat-icon>restart_alt</mat-icon>
    Reset to Defaults
  </button>
</mat-card>
```

```scss
.mock-location-card {
  background-color: var(--color-surface);
  // ... custom styling
}
.reset-button {
  color: var(--color-text-primary);
  border-color: var(--color-border);
  // ... custom styling
}
```

### After:
```html
<app-base-card 
  id="mock-location-card"
  title="Mock Location (Testing)"
  categoryIcon="location_on"
>
  <app-base-button 
    variant="outlined"
    [icon]="'restart_alt'"
    (clicked)="resetToDefaults()"
  >
    Reset to Defaults
  </app-base-button>
</app-base-card>
```

No SCSS needed—the base component handles all theming!

---

## Testing Checklist

For each migrated component:
- [ ] Light mode: all text readable, buttons respond correctly
- [ ] Dark mode: all text readable, colors contrast properly
- [ ] Buttons: hover, active, disabled states work
- [ ] Inputs: focus state shows clearly, error messages visible
- [ ] Cards: proper spacing, title/subtitle alignment
- [ ] Mobile: touch targets at least 44x44px
- [ ] Accessibility: keyboard navigation, focus indicators

---

## Quick Wins to Start With

1. **Settings buttons** - Many standalone buttons with custom styling
2. **Trip/Shift modals** - Heavy use of mat-cards with dark mode issues
3. **Form pages** - Lots of mat-form-field inputs
4. **Header/Nav** - Icon buttons that could use base-button icon variant

---

## Notes

- **Breaking change?** No—components can be migrated incrementally
- **Backwards compatible?** Don't remove Material imports until all components migrated
- **Performance?** Base components are lightweight, no performance degradation
- **Customization?** Use CSS custom properties to override colors if needed

---

## Success Metrics

- [ ] 80%+ of buttons use BaseButtonComponent
- [ ] 80%+ of cards use BaseCardComponent
- [ ] 80%+ of form inputs use BaseInputComponent
- [ ] Zero manual `::ng-deep` overrides for theming
- [ ] Dark mode works without component-specific styling
- [ ] Code coverage for base components: >80%
