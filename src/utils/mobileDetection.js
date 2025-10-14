// Mobile device detection utility
export const isMobileDevice = () => {
  // Check screen width
  const isMobileWidth = window.innerWidth <= 768;

  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

  // Return true if either condition is met
  return isMobileWidth || isMobileUserAgent;
};

// Check if device is specifically a phone (not tablet)
export const isPhone = () => {
  const width = window.innerWidth;
  return width <= 480 || /iphone|android.*mobile/i.test(navigator.userAgent.toLowerCase());
};

// Check if device is tablet
export const isTablet = () => {
  const width = window.innerWidth;
  return (width > 480 && width <= 1024) || /ipad|android(?!.*mobile)/i.test(navigator.userAgent.toLowerCase());
};

export default {
  isMobileDevice,
  isPhone,
  isTablet
};
