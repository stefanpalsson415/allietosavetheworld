/**
 * Script to modify the tabs layout:
 * 1. Remove the horizontal tabs bar
 * 2. Add Strong Relationship and Task Sequences to the left sidebar navigation
 */
(function() {
  // Wait for the DOM to be fully loaded
  function waitForElements() {
    // Look for the horizontal tabs bar
    const horizontalTabs = document.querySelector('.flex.justify-between.mb-2') || 
                           document.querySelector('.border-b.border-gray-200') ||
                           Array.from(document.querySelectorAll('div')).find(div => 
                             div.textContent && div.textContent.includes('My Tasks') && 
                             div.textContent.includes('Family Dashboard') && 
                             div.textContent.includes('Strong Relationship')
                           );
    
    // Look for the left sidebar navigation
    const leftNav = document.querySelector('.py-2') || 
                    document.querySelector('nav ul') ||
                    document.querySelector('.flex-1 > div:first-child');
    
    // If we've found both elements we can proceed
    if (horizontalTabs && leftNav) {
      console.log('Found horizontal tabs and left navigation, modifying layout...');
      
      // 1. Hide the horizontal tabs container
      horizontalTabs.style.display = 'none';
      
      // 2. Add Strong Relationship and Task Sequences to the left sidebar
      // Check if the items don't exist already in the sidebar
      const sidebarItems = leftNav.innerHTML.toLowerCase();
      if (!sidebarItems.includes('strong relationship')) {
        // Create Strong Relationship navigation item
        const relationshipItem = document.createElement('button');
        relationshipItem.className = 'w-full flex items-center px-3 py-2 text-sm hover:bg-[#EBEBEB]';
        relationshipItem.innerHTML = `
          <span class="mr-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </span>
          <span>Strong Relationship</span>
        `;
        relationshipItem.onclick = function() {
          window.location.href = '/dashboard?tab=relationship';
        };
        leftNav.appendChild(relationshipItem);
      }
      
      if (!sidebarItems.includes('task sequences')) {
        // Create Task Sequences navigation item
        const taskSequencesItem = document.createElement('button');
        taskSequencesItem.className = 'w-full flex items-center px-3 py-2 text-sm hover:bg-[#EBEBEB]';
        taskSequencesItem.innerHTML = `
          <span class="mr-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </span>
          <span>Task Sequences</span>
        `;
        taskSequencesItem.onclick = function() {
          window.location.href = '/dashboard?tab=sequences';
        };
        leftNav.appendChild(taskSequencesItem);
      }
      
      console.log('Layout modification complete');
    } else {
      // Elements not found yet, wait and try again
      setTimeout(waitForElements, 1000);
    }
  }
  
  // Start waiting for elements when the page loads
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    waitForElements();
  } else {
    document.addEventListener('DOMContentLoaded', waitForElements);
  }
  
  // Also try after window load (for single page apps)
  window.addEventListener('load', waitForElements);
  
  // For SPAs, try to intercept route changes and reapply
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(waitForElements, 500);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(waitForElements, 500);
  };
  
  // Also listen for route changes via popstate
  window.addEventListener('popstate', function() {
    setTimeout(waitForElements, 500);
  });
})();