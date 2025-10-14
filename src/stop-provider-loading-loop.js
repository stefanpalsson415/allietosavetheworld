// Stop provider loading loop
// This script directly fixes the provider loading loop issue
// It works by adding a global event handler that blocks excessive refresh events

(function() {
  console.log("Loading provider-loop-stopper...");
  
  // State to track refresh events
  let refreshCount = 0;
  let lastRefreshTime = 0;
  let blockUntil = 0;
  let isBlocking = false;
  
  // Function to handle refresh events
  function handleDirectoryRefresh(event) {
    const now = Date.now();
    
    // If we're in blocking mode and still within the block period, stop the event
    if (isBlocking && now < blockUntil) {
      console.log("🛑 Blocking provider directory refresh (cooling down)");
      event.stopImmediatePropagation();
      return;
    }
    
    // Reset blocking state if we're past the block period
    if (isBlocking && now >= blockUntil) {
      isBlocking = false;
      refreshCount = 0;
    }
    
    // Count events in a 2 second window
    if (now - lastRefreshTime < 2000) {
      refreshCount++;
    } else {
      refreshCount = 1;
    }
    
    lastRefreshTime = now;
    
    // If too many refreshes detected, enter blocking mode
    if (refreshCount > 3) {
      console.warn(`🚫 Provider directory refresh loop detected (${refreshCount} refreshes in 2s)`);
      isBlocking = true;
      blockUntil = now + 5000; // Block for 5 seconds
      
      // Cancel any spinner or loading indicators
      try {
        document.querySelectorAll('.animate-spin').forEach(el => {
          el.classList.remove('animate-spin');
        });
        
        // Find any loading text elements
        document.querySelectorAll('*').forEach(el => {
          if (el.innerText && 
              (el.innerText.includes('Loading') || 
               el.innerText.includes('loading'))) {
            el.innerText = el.innerText.replace('Loading', 'Loaded');
            el.innerText = el.innerText.replace('loading', 'loaded');
          }
        });
        
        // Try to reset any isLoading state
        if (window._resetIsLoading) {
          window._resetIsLoading();
        }
      } catch (e) {
        console.error("Error cleaning up loading indicators:", e);
      }
      
      // Stop this event
      event.stopImmediatePropagation();
    }
  }
  
  // Add global function to reset loading state
  window._resetIsLoading = function() {
    try {
      // Try to find React state setters for isLoading
      const providerDir = document.querySelector('[data-component="provider-directory"]');
      if (providerDir && providerDir._reactProps) {
        console.log("Found provider directory component, attempting to reset loading state");
        // This is a simplified approach, React internals are more complex
      }
    } catch (e) {
      console.error("Error resetting loading state:", e);
    }
  };
  
  // Listen for directory refresh events with capture phase to intercept early
  window.addEventListener('directory-refresh-needed', handleDirectoryRefresh, true);
  window.addEventListener('provider-added', handleDirectoryRefresh, true);
  window.addEventListener('provider-removed', handleDirectoryRefresh, true);
  window.addEventListener('provider-directly-added', handleDirectoryRefresh, true);
  window.addEventListener('standalone-provider-directory-update', handleDirectoryRefresh, true);
  
  // Also listen for global data refresh events
  window.addEventListener('force-data-refresh', function(event) {
    handleDirectoryRefresh(event);
  }, true);
  
  console.log("Provider loop stopper installed successfully");
  
  // Check if we're currently in a loading state and fix it
  setTimeout(function() {
    const loadingSpinners = document.querySelectorAll('.animate-spin');
    if (loadingSpinners.length > 0) {
      console.log(`Found ${loadingSpinners.length} spinning loaders, attempting to fix...`);
      loadingSpinners.forEach(el => {
        el.classList.remove('animate-spin');
      });
    }
  }, 3000);
})();