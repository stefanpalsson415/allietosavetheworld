/**
 * This script cleans up console.log statements from the chore system
 * It can be run to remove unnecessary logging in production
 */

const fs = require('fs');
const path = require('path');

// Files to clean
const filesToClean = [
  './src/services/ChoreService.js',
  './src/services/RewardService.js',
  './src/services/BucksService.js',
  './src/contexts/ChoreContext.js',
  './src/components/dashboard/tabs/chore/ChoreTab.jsx'
];

// Regular expression to match console.log statements
const consoleLogRegex = /console\.log\s*\([^)]*\);?/g;

// Clean each file
filesToClean.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Count console.log statements
    const matches = content.match(consoleLogRegex);
    const count = matches ? matches.length : 0;
    
    // Replace console.log statements with empty strings
    content = content.replace(consoleLogRegex, '');
    
    // Write the file back
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Cleaned ${count} console.log statements from ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Cleanup complete\!');
