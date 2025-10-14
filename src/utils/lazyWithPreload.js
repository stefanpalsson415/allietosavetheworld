// Utility for lazy loading with preload capability
import { lazy } from 'react';

export function lazyWithPreload(importFunc) {
  const Component = lazy(importFunc);
  Component.preload = importFunc;
  return Component;
}

// Preload components when idle
export function preloadComponents(components) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      components.forEach(component => {
        if (component.preload) {
          component.preload();
        }
      });
    });
  }
}