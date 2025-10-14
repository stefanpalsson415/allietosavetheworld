// src/apply-guard-to-app.js
/**
 * This script adds the event loop guard import to the main App.js file
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'App.js');

try {
  console.log(`Reading ${appPath}...`);
  
  // Read App.js content
  let content = fs.readFileSync(appPath, 'utf8');
  
  // Create backup
  const backupPath = `${appPath}.bak-loop-fix`;
  fs.writeFileSync(backupPath, content);
  console.log(`Created backup at ${backupPath}`);
  
  // Check if import already exists
  if (content.includes('./event-loop-guard-index') || 
      content.includes('./event-loop-guard-enhanced')) {
    console.log('Guard import already exists in App.js');
  } else {
    // Add import at the beginning
    const imports = content.match(/import.*?;/gs);
    
    if (imports && imports.length > 0) {
      // Find the last import statement
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      
      // Insert our import after the last existing import
      content = content.slice(0, lastImportIndex) + 
               '\n// Import event loop protection\nimport "./event-loop-guard-index.js";\n' + 
               content.slice(lastImportIndex);
    } else {
      // If no imports found, add at beginning of file
      content = '// Import event loop protection\nimport "./event-loop-guard-index.js";\n\n' + content;
    }
    
    // Write updated file
    fs.writeFileSync(appPath, content);
    console.log('Added guard import to App.js');
  }
  
  // Also add the monitor script to index.html
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`Reading ${indexPath}...`);
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script already exists
    if (indexContent.includes('event-loop-monitor.js')) {
      console.log('Monitor script already exists in index.html');
    } else {
      // Add script before closing body tag
      const closingBodyIndex = indexContent.lastIndexOf('</body>');
      
      if (closingBodyIndex !== -1) {
        indexContent = indexContent.slice(0, closingBodyIndex) + 
                     '  <!-- Event loop monitor -->' +
                     '\n  <script src="/event-loop-monitor.js"></script>\n  ' + 
                     indexContent.slice(closingBodyIndex);
        
        // Create backup
        const indexBackupPath = `${indexPath}.bak-loop-fix`;
        fs.writeFileSync(indexBackupPath, indexContent);
        console.log(`Created backup at ${indexBackupPath}`);
        
        // Write updated file
        fs.writeFileSync(indexPath, indexContent);
        console.log('Added monitor script to index.html');
      } else {
        console.log('Could not find closing body tag in index.html');
      }
    }
  } else {
    console.log(`${indexPath} not found`);
  }
  
  console.log('\nEvent loop fix integration complete!');
  console.log('Next steps:');
  console.log('1. Run the fix application script: node src/apply-event-loop-fix.js');
  console.log('2. Restart your application server: npm start');
  console.log('3. Check the monitor in the bottom-right corner of your app');
} catch (err) {
  console.error('Error applying guard to App.js:', err);
}