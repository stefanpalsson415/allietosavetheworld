const fs = require('fs');

// Read the file
const filePath = './src/components/dashboard/tabs/ChildrenTrackingTab.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Search for Wardrobe Concierge with surrounding context
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Wardrobe Concierge')) {
    // Print 20 lines before and after for context
    console.log(`Found 'Wardrobe Concierge' at line ${i + 1}`);
    console.log('Context:');
    const start = Math.max(0, i - 20);
    const end = Math.min(lines.length, i + 20);
    for (let j = start; j < end; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}