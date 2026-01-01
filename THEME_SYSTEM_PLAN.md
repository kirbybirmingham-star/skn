# SKN Dark/Light Theme System Implementation Plan

## Current State Analysis
- **Existing Theme Setup**: The project uses Tailwind CSS with CSS variables defined in `index.css` for light and dark themes using `.dark` class
- **Component Styling**: Components use hardcoded Tailwind classes with some semantic classes like `bg-background`, `text-foreground`
- **Architecture**: React app with context providers (SupabaseAuth, Cart)

## Implementation Architecture

### 1. Theme Context & Provider
- Create `ThemeContext.jsx` with:
  - Theme state management (light/dark)
  - localStorage persistence
  - Theme toggle function
  - System preference detection
  - Smooth transition handling

### 2. Theme Toggle Component
- Create `ThemeToggle.jsx` component with:
  - Sun/Moon icons
  - Smooth animation transitions
  - Accessibility features (aria-label, keyboard navigation)

### 3. Integration Points
- **App.jsx**: Wrap with ThemeProvider
- **Header.jsx**: Add theme toggle button to user dropdown or separate area
- **Components**: Update hardcoded classes to theme-aware classes
- **Pages**: Ensure consistent theming

### 4. CSS Enhancements
- Update `index.css` with additional semantic color variables
- Add smooth transition classes for theme switching
- Ensure proper contrast ratios for accessibility

### 5. Component Updates Required
- Header: Convert hardcoded `bg-white/80` to theme-aware
- Footer: Update styling
- UI Components: Button, Card, Dropdown, etc.
- Pages: All page components for consistency

## Theme Color Scheme

### Light Theme (Existing)
- Background: slate-50
- Cards: white
- Text: slate-700/slate-900
- Primary: blue-600/indigo-600 gradient

### Dark Theme (Existing)
- Background: slate-900
- Cards: slate-800
- Text: slate-100
- Primary: blue-400/indigo-400 gradient

## Implementation Steps
1. Create ThemeProvider with localStorage
2. Add theme toggle component
3. Update App.jsx wrapper
4. Convert Header to theme-aware
5. Update Footer
6. Audit and update UI components
7. Test across all pages
8. Verify accessibility compliance

## Accessibility Requirements
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Focus indicators visible in both themes
- ARIA labels for theme toggle

## Transition Strategy
- Smooth 300ms transitions for all color changes
- No flash of incorrect theme on load
- Respect user's system preference as default