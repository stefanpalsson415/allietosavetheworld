// Check email display and Allie actions
console.log('📧 Checking email display in UnifiedInbox...\n');

// Wait for inbox to load
setTimeout(() => {
  // Look for the school email
  const emailItems = document.querySelectorAll('[class*="border-b cursor-pointer"]');
  console.log(`Found ${emailItems.length} inbox items`);
  
  // Find the school email
  let schoolEmail = null;
  emailItems.forEach((item, index) => {
    const subject = item.querySelector('[class*="text-base font-medium"]')?.textContent;
    if (subject && subject.includes('Medtag') || subject.includes('backpack')) {
      schoolEmail = item;
      console.log(`\n✅ Found school email at position ${index + 1}:`);
      console.log(`   Subject: "${subject}"`);
      
      // Check status icon
      const checkIcon = item.querySelector('[class*="CheckCircle"]');
      const clockIcon = item.querySelector('[class*="Clock"]');
      const spinnerIcon = item.querySelector('[class*="animate-spin"]');
      
      if (checkIcon) {
        console.log('   Status: ✅ Processed');
      } else if (spinnerIcon) {
        console.log('   Status: ⏳ Processing...');
      } else if (clockIcon) {
        console.log('   Status: ⏰ Pending');
      }
      
      // Check content preview
      const contentPreview = item.querySelector('[class*="text-sm text-gray-600 line-clamp-2"]')?.textContent;
      console.log(`   Preview: "${contentPreview?.substring(0, 50)}..."`);
      
      // Check date
      const dateText = item.querySelector('[class*="text-xs text-gray-500"]')?.textContent;
      console.log(`   Date: ${dateText}`);
      
      // Click to select it
      item.click();
      console.log('   📱 Clicked to view details');
    }
  });
  
  if (!schoolEmail) {
    console.log('\n❌ School email not found in the list');
    return;
  }
  
  // Check detail view after a short delay
  setTimeout(() => {
    console.log('\n📋 Checking email detail view...');
    
    // Check AI Analysis section
    const aiAnalysis = document.querySelector('[class*="AI Analysis"]');
    if (aiAnalysis) {
      console.log('✅ AI Analysis section found');
      
      // Check summary
      const summary = Array.from(document.querySelectorAll('span')).find(el => 
        el.textContent === 'Summary'
      )?.nextElementSibling?.textContent;
      if (summary) {
        console.log(`   Summary: "${summary}"`);
      }
      
      // Check category
      const categoryBadge = document.querySelector('[class*="bg-blue-50 text-blue-700 rounded-full"]');
      if (categoryBadge) {
        console.log(`   Category: ${categoryBadge.textContent}`);
      }
    }
    
    // Check Allie Actions section
    const allieActionsHeader = Array.from(document.querySelectorAll('h4')).find(el => 
      el.textContent.includes('What Allie Did')
    );
    
    if (allieActionsHeader) {
      console.log('\n✅ "What Allie Did" section found');
      
      // Count actions
      const actionItems = allieActionsHeader.parentElement.querySelectorAll('[class*="flex items-start gap-4 p-4"]');
      console.log(`   ${actionItems.length} actions taken`);
      
      // Check each action
      actionItems.forEach((action, index) => {
        const title = action.querySelector('[class*="font-medium text-gray-900"]')?.textContent;
        const details = action.querySelector('[class*="text-sm text-gray-600"]')?.textContent;
        const viewButton = action.querySelector('button');
        
        console.log(`\n   Action ${index + 1}:`);
        console.log(`   - Title: "${title}"`);
        if (details) console.log(`   - Details: "${details}"`);
        if (viewButton) console.log(`   - Has "View" button ✓`);
      });
    } else {
      console.log('\n❌ "What Allie Did" section not found');
    }
    
    // Check original content
    const originalContent = Array.from(document.querySelectorAll('h4')).find(el => 
      el.textContent === 'Original Content'
    );
    if (originalContent) {
      const content = originalContent.parentElement.querySelector('[class*="bg-gray-50"]')?.textContent;
      console.log(`\n✅ Original content displayed (${content?.length || 0} characters)`);
    }
    
  }, 500);
  
}, 1500);