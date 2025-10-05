# Theme Functionality Guide

## Overview
The Obsidian File Core application now supports full theme switching functionality with three theme modes:
- **System**: Follows the user's operating system theme preference
- **Light**: Always uses light theme colors
- **Dark**: Always uses dark theme colors

## Implementation Details

### Theme Context (`src/contexts/ThemeContext.js`)
- Creates a React context for managing theme state across the application
- Automatically syncs theme preferences with the user's profile in the database
- Listens for system theme changes when using "system" mode
- Persists theme preference in localStorage for quick loading

### Theme Toggle Component (`src/components/ThemeToggle.jsx`)
- Provides a button to cycle through theme options (System → Light → Dark)
- Shows appropriate icons (Monitor, Sun, Moon) for each theme mode
- Can be placed anywhere in the application

### CSS Implementation
- Uses Tailwind CSS's built-in dark mode support with class strategy
- Dark mode classes are applied to the `<html>` element when dark theme is active
- Updated `tailwind.config.js` to enable class-based dark mode
- Added dark mode styles in `index.css`

### Backend Integration
- Theme preference is stored in user profile under `preferences.theme`
- Automatically syncs changes between frontend and backend
- Theme changes are persisted in the database

## Usage

### For Users
1. **Dashboard Header**: Click the theme toggle button (sun/moon/monitor icon) in the top right
2. **Profile Settings**: Use the theme dropdown in the profile drawer
3. **System Integration**: When "System" is selected, the theme automatically follows your OS preference

### For Developers
```javascript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, isDark, isLight, resolvedTheme } = useTheme();
  
  return (
    <div className={`p-4 ${isDark ? 'dark-specific-class' : 'light-specific-class'}`}>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
    </div>
  );
}
```

## Troubleshooting

### Theme not changing in the background
**Problem**: Theme changes are saved to profile and database but background doesn't update

**Solution**: This has been fixed with the new implementation. The theme context:
1. Applies theme classes to the document root
2. Updates CSS variables for immediate visual changes
3. Syncs with backend without requiring page refresh

### Theme not persisting after page reload
**Problem**: Theme resets to default after browser refresh

**Solution**: The theme context automatically:
1. Loads from localStorage on app startup
2. Syncs with user profile from database
3. Falls back to system preference if no saved theme

## Technical Notes

### CSS Classes Used
- `dark:bg-gray-900` - Dark background for main containers
- `dark:bg-gray-800` - Dark background for secondary containers  
- `dark:bg-gray-700` - Dark background for form inputs
- `dark:text-white` - White text in dark mode
- `dark:border-gray-600` - Dark mode border colors

### Browser Compatibility
- Supports all modern browsers with CSS custom properties
- Uses `window.matchMedia` for system theme detection
- Graceful fallback to light theme on older browsers

## Files Modified
- `src/App.js` - Added ThemeProvider wrapper
- `src/components/Dashboard/Dashboard.jsx` - Added dark mode classes and theme toggle
- `src/components/Dashboard/ProfileDrawer.jsx` - Connected theme selector to context
- `src/index.css` - Added dark mode base styles
- `tailwind.config.js` - Enabled class-based dark mode

## Future Enhancements
- [ ] Custom color schemes beyond light/dark
- [ ] High contrast mode for accessibility
- [ ] Theme transition animations
- [ ] Per-component theme overrides