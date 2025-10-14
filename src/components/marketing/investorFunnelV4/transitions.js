/**
 * Transitions for slide animations
 * These manage the animation effects when navigating between slides
 */

// Default fade transition
export const fadeTransition = {
  enter: {
    opacity: 0,
    transform: 'translateY(10px)'
  },
  enterActive: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: 'opacity 300ms, transform 300ms'
  },
  exit: {
    opacity: 0,
    transform: 'translateY(-10px)',
    transition: 'opacity 300ms, transform 300ms'
  }
};

// Slide from right transition
export const slideRightTransition = {
  enter: {
    opacity: 0,
    transform: 'translateX(50px)'
  },
  enterActive: {
    opacity: 1,
    transform: 'translateX(0px)',
    transition: 'opacity 400ms, transform 400ms'
  },
  exit: {
    opacity: 0,
    transform: 'translateX(-50px)',
    transition: 'opacity 400ms, transform 400ms'
  }
};

// Zoom transition
export const zoomTransition = {
  enter: {
    opacity: 0,
    transform: 'scale(0.95)'
  },
  enterActive: {
    opacity: 1,
    transform: 'scale(1)',
    transition: 'opacity 300ms, transform 300ms'
  },
  exit: {
    opacity: 0,
    transform: 'scale(1.05)',
    transition: 'opacity 300ms, transform 300ms'
  }
};

// Slide to section transition (used when moving between sections)
export const sectionTransition = {
  enter: {
    opacity: 0,
    transform: 'translateY(20px)'
  },
  enterActive: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: 'opacity 500ms, transform 500ms'
  },
  exit: {
    opacity: 0,
    transform: 'translateY(-20px)',
    transition: 'opacity 500ms, transform 500ms'
  }
};

// Get transition based on slide type or position
export const getTransition = (currentIndex, nextIndex, currentSection, nextSection) => {
  // If changing sections, use section transition
  if (currentSection !== nextSection) {
    return sectionTransition;
  }
  
  // Moving forward in same section
  if (nextIndex > currentIndex) {
    return slideRightTransition;
  }
  
  // Moving backward in same section
  return {
    ...slideRightTransition,
    enter: {
      opacity: 0,
      transform: 'translateX(-50px)'
    },
    exit: {
      opacity: 0,
      transform: 'translateX(50px)',
      transition: 'opacity 400ms, transform 400ms'
    }
  };
};