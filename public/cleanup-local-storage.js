// Cleanup localStorage items that cause event loops
(function() {
  try {
    // Clear problematic localStorage items
    const problematicKeys = [
      'cachedEvents',
      'eventCache',
      'lastEventSync',
      'pendingEvents',
      'eventLoopDetected'
    ];
    
    for (const key of problematicKeys) {
      if (localStorage.getItem(key)) {
        console.log(`Removing problematic localStorage item: ${key}`);
        localStorage.removeItem(key);
      }
    }
    
    console.log('Cache cleanup completed successfully');
  } catch (e) {
    console.error('Error cleaning up cache:', e);
  }
})();
