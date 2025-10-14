#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Path to the file with the error
const filePath = path.join(__dirname, 'src/components/dashboard/tabs/TasksTab.jsx');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Look for all function declarations
const functions = [];
const lines = content.split('\n');

// Look for function-like patterns
let inFunction = false;
let functionStart = -1;
let bracketCount = 0;
let functionName = '';

// Log function declarations
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for function declarations
  if (!inFunction) {
    // Look for function declarations
    const constMatch = line.match(/^\s*const\s+(\w+)\s*=\s*(?:useCallback\s*\()?\s*\(?(?:\w+)?\)?\s*=>\s*\{/);
    const funcMatch = line.match(/^\s*function\s+(\w+)\s*\(/);
    
    if (constMatch || funcMatch) {
      const name = constMatch ? constMatch[1] : funcMatch[1];
      inFunction = true;
      functionStart = i;
      functionName = name;
      bracketCount = 1; // We already found the opening bracket
      
      // Special case for one-line arrow functions
      if (line.includes('{') && line.includes('}') && 
          line.indexOf('{') < line.indexOf('}')) {
        inFunction = false;
        functions.push({
          name: functionName,
          lineStart: functionStart + 1,
          lineEnd: i + 1,
          content: line
        });
      }
    }
  } else {
    // Count brackets
    for (const char of line) {
      if (char === '{') bracketCount++;
      if (char === '}') bracketCount--;
    }
    
    // Check if we've found the end of the function
    if (bracketCount === 0) {
      inFunction = false;
      functions.push({
        name: functionName,
        lineStart: functionStart + 1,
        lineEnd: i + 1
      });
    }
  }
}

// Look for any function related to triggerAllieChat
console.log('Functions found:');
functions.forEach(func => {
  // Check for any function with a name that might be a duplicate of triggerAllieChat
  if (func.name.toLowerCase().includes('allie') || 
      func.name.toLowerCase().includes('chat') || 
      func.name.toLowerCase().includes('trigger')) {
    console.log(`${func.name} at lines ${func.lineStart}-${func.lineEnd}`);
    
    // Print content around this function
    console.log('\nCode near this function:');
    for (let i = Math.max(0, func.lineStart - 3); i < Math.min(lines.length, func.lineEnd + 3); i++) {
      console.log(`${i+1}: ${lines[i]}`);
    }
    console.log('\n');
  }
});

// Look for the string "Allie Chat" or "triggerAllieChat" in the file
console.log('References to Allie Chat or triggerAllieChat:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('allie chat') || lines[i].includes('triggerAllieChat')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}