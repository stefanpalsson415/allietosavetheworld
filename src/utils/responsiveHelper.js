// src/utils/responsiveHelper.js
// Helper utilities for responsive layout handling

export const responsiveHelper = {
  // Check if mobile
  isMobile: () => window.innerWidth < 768,
  
  // Check if tablet
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  
  // Check if desktop
  isDesktop: () => window.innerWidth >= 1024,
  
  // Get appropriate chat drawer width
  getChatDrawerWidth: () => {
    if (responsiveHelper.isMobile()) {
      return '100vw';
    } else if (responsiveHelper.isTablet()) {
      return Math.min(window.innerWidth * 0.8, 500) + 'px';
    } else {
      return '475px';
    }
  },
  
  // Check if chat drawer should overlay content
  shouldOverlayChat: () => !responsiveHelper.isDesktop(),
  
  // Get appropriate font size multiplier
  getFontSizeMultiplier: () => {
    const width = window.innerWidth;
    if (width < 400) return 0.85;
    if (width < 768) return 0.9;
    if (width < 1024) return 0.95;
    return 1;
  },
  
  // Add responsive classes to body
  updateBodyClasses: () => {
    const body = document.body;
    
    // Remove all responsive classes
    body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
    
    // Add appropriate class
    if (responsiveHelper.isMobile()) {
      body.classList.add('is-mobile');
    } else if (responsiveHelper.isTablet()) {
      body.classList.add('is-tablet');
    } else {
      body.classList.add('is-desktop');
    }
  },
  
  // Initialize responsive behavior
  init: () => {
    // Set initial classes
    responsiveHelper.updateBodyClasses();
    
    // Update on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        responsiveHelper.updateBodyClasses();
      }, 250);
    });
  }
};

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  responsiveHelper.init();
}