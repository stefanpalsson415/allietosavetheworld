# Debug Modal Overlay Issue

## Problem
The User Settings modal is showing a completely white/gray background instead of a semi-transparent overlay that shows the dashboard content behind it.

## Debug Steps

1. Open Chrome DevTools (F12)
2. When the Settings modal is open, inspect the elements
3. Look for:
   - Multiple overlays stacked on top of each other
   - Any element with `background: white` or `background-color: rgb(255,255,255)`
   - Elements with high z-index values that might be blocking the view

## Quick Test
In the browser console, run this to temporarily make all backgrounds transparent:
```javascript
// This will help identify which element is causing the white background
document.querySelectorAll('*').forEach(el => {
  const styles = window.getComputedStyle(el);
  if (styles.backgroundColor === 'rgb(255, 255, 255)' || 
      styles.backgroundColor === 'rgba(255, 255, 255, 1)') {
    console.log('White background found on:', el);
    el.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  }
});
```

## Current Structure
The modal should have:
1. A semi-transparent black overlay (rgba(0, 0, 0, 0.4))
2. The modal content box with white background
3. The dashboard content should be visible behind the overlay

## Possible Causes
1. Another modal/overlay is being rendered
2. CSS is being overridden by global styles
3. The parent component has a white background
4. Z-index stacking issues