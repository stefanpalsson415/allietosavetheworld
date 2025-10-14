// Force reload all events bypassing circuit breakers
console.log('🔄 Force reloading events...');

// First reset all circuit breakers
async function forceReloadEvents() {
  try {
    // Import and use the reset functions
    const { resetCalendarCircuitBreaker, setCalendarBypass } = await import('../src/event-loop-guard-enhanced.js');
    
    // Reset circuit breaker
    resetCalendarCircuitBreaker();
    console.log('✅ Circuit breaker reset');
    
    // Set bypass for next check
    setCalendarBypass();
    console.log('✅ Bypass set for next check');
    
    // Force refresh events
    window.dispatchEvent(new CustomEvent('force-calendar-refresh', {
      detail: { 
        source: 'manual-force-reload',
        bypassGuard: true 
      }
    }));
    
    console.log('✅ Force refresh dispatched');
    
    // If in NewEventContext, try to refresh directly
    if (window._refreshEvents) {
      setTimeout(() => {
        window._refreshEvents();
        console.log('✅ Direct refresh called');
      }, 100);
    }
    
  } catch (error) {
    console.error('Error during force reload:', error);
    
    // Fallback approach
    console.log('Using fallback approach...');
    
    // Reset states manually
    if (window._calendarLoopGuardState) {
      window._calendarLoopGuardState.circuitBreakerActive = false;
      window._calendarLoopGuardState.bypassNextCheck = true;
    }
    
    // Force page reload as last resort
    console.log('Reloading page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}

// Run the force reload
forceReloadEvents();
EOF < /dev/null