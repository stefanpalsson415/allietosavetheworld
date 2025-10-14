// src/apply-event-loop-fix.js
/**
 * This script applies the enhanced event loop guard protection
 * to the EventStore and NewEventContext components.
 * 
 * Run with: node src/apply-event-loop-fix.js
 */
const fs = require('fs');
const path = require('path');

// Paths to modify
const paths = [
  path.join(__dirname, 'services/EventStore.js'),
  path.join(__dirname, 'contexts/NewEventContext.js'),
  path.join(__dirname, 'components/calendar/EnhancedEventManager.jsx')
];

// Import statement to add at the top of each file
const importStatement = `import { 
  checkCalendarEventGuard, 
  processEmptyCalendarResult, 
  clearEmptyResultCounter 
} from '../event-loop-guard-enhanced';
`;

// Process each file
paths.forEach(filePath => {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.bak-loop-fix`;
    fs.writeFileSync(backupPath, content);
    console.log(`  Created backup at ${backupPath}`);
    
    // Add import
    const fileExt = path.extname(filePath);
    let relativePath = '../event-loop-guard-enhanced';
    
    if (filePath.includes('components/calendar')) {
      relativePath = '../../event-loop-guard-enhanced';
    }
    
    // Update import statement for the specific file
    const fileImport = importStatement.replace("'../event-loop-guard-enhanced'", `'${relativePath}'`);
    
    // Add import at appropriate position
    if (content.includes('import React')) {
      // For React components, add after React imports
      content = content.replace(
        /(import React.*?;)/,
        `$1\n\n${fileImport}`
      );
    } else {
      // For non-React files, add after first import
      content = content.replace(
        /(import .*?;)/,
        `$1\n\n${fileImport}`
      );
    }
    
    // Apply specific changes based on the file
    if (filePath.includes('EventStore.js')) {
      // Add circuit breaker check in getEventsForUser method
      content = content.replace(
        /async getEventsForUser\(userId, startDate = null, endDate = null\) {/,
        `async getEventsForUser(userId, startDate = null, endDate = null) {
    // Check calendar event guard to prevent loops
    if (checkCalendarEventGuard('getEventsForUser', { source: 'EventStore' })) {
      console.log("⚠️ Calendar event guard blocked getEventsForUser call");
      return [];
    }`
      );
      
      // Add empty result tracking
      content = content.replace(
        /if \(sortedEvents\.length === 0\) {/,
        `if (sortedEvents.length === 0) {
        // Track empty results with the enhanced guard
        processEmptyCalendarResult();`
      );
      
      // Add reset counter when we get results
      content = content.replace(
        /\/\/ Reset the counter if we got results/,
        `// Reset the counter if we got results
        clearEmptyResultCounter();`
      );
    }
    
    if (filePath.includes('NewEventContext.js')) {
      // Add circuit breaker check in loadEvents method
      content = content.replace(
        /const loadEvents = useCallback\(async \(\) => {/,
        `const loadEvents = useCallback(async () => {
    // Enhanced check for loop prevention
    if (checkCalendarEventGuard('loadEvents', { source: 'NewEventContext' })) {
      console.log("⚠️ Calendar event guard blocked loadEvents call");
      return;
    }`
      );
      
      // Add circuit breaker check in refreshEvents method
      content = content.replace(
        /const refreshEvents = useCallback\(async \(\) => {/,
        `const refreshEvents = useCallback(async () => {
    // Enhanced check for refresh loop prevention
    if (checkCalendarEventGuard('refreshEvents', { source: 'NewEventContext' })) {
      console.log("⚠️ Calendar event guard blocked refreshEvents call");
      return events;
    }`
      );
      
      // Add empty result tracking
      content = content.replace(
        /if \(eventsData\.length === 0\) {/,
        `if (eventsData.length === 0) {
        // Use enhanced guard to track empty results
        processEmptyCalendarResult();`
      );
      
      // Add reset counter when we get results
      content = content.replace(
        /console\.log\(\`🔍 DEBUG: Got \$\{eventsData\.length\} events, resetting empty counter\`\);/,
        `console.log(\`🔍 DEBUG: Got \${eventsData.length} events, resetting empty counter\`);
        clearEmptyResultCounter();`
      );
    }
    
    if (filePath.includes('EnhancedEventManager.jsx')) {
      // Add circuit breaker check before event operations
      content = content.replace(
        /const handleSave = async \(\) => {/,
        `const handleSave = async () => {
    // Check event loop guard to prevent infinite loops
    if (checkCalendarEventGuard('saveEvent', { source: 'EnhancedEventManager' })) {
      console.log("⚠️ Calendar event guard blocked event save");
      setError("Operation blocked to prevent infinite loop. Please refresh the page.");
      return;
    }`
      );
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`  Updated ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
});

// Create or update index.js file to export the event loop guard
const indexPath = path.join(__dirname, 'event-loop-guard-index.js');
try {
  fs.writeFileSync(indexPath, `// Event Loop Guard index
export * from './event-loop-guard-enhanced';
export { default } from './event-loop-guard-enhanced';
`);
  console.log(`Created guard index at ${indexPath}`);
} catch (err) {
  console.error(`Error creating index:`, err);
}

console.log('\nEvent loop fix applied successfully!');
console.log('To activate the fix, you need to:');
console.log('1. Import the event-loop-guard in your main App.js or index.js file:');
console.log('   import "./event-loop-guard-index.js";');
console.log('2. Restart your application server');