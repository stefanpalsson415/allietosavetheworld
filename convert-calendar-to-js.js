const fs = require('fs');
const path = require('path');

function convertTypeScriptToJavaScript(content) {
  // Remove TypeScript-specific syntax
  let jsContent = content;
  
  // Remove interfaces and type declarations
  jsContent = jsContent.replace(/^export\s+interface\s+\w+\s*{[^}]*}/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+\s*{[^}]*}/gm, '');
  jsContent = jsContent.replace(/^export\s+type\s+\w+\s*=\s*[^;]+;/gm, '');
  jsContent = jsContent.replace(/^type\s+\w+\s*=\s*[^;]+;/gm, '');
  
  // Remove type annotations from function parameters and return types
  jsContent = jsContent.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(\s*=)/g, '$4');
  jsContent = jsContent.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*([,\)])/g, '$4');
  jsContent = jsContent.replace(/:\s*{[^}]+}([,\)])/g, '$1');
  
  // Remove return type annotations
  jsContent = jsContent.replace(/\)\s*:\s*[\w\[\]<>,\s|]+\s*{/g, ') {');
  jsContent = jsContent.replace(/\)\s*:\s*Promise<[^>]+>\s*{/g, ') {');
  jsContent = jsContent.replace(/\)\s*:\s*void\s*{/g, ') {');
  
  // Remove generic type parameters
  jsContent = jsContent.replace(/<[\w\s,]+>/g, '');
  
  // Remove React.FC and similar
  jsContent = jsContent.replace(/:\s*React\.FC\s*/g, ' ');
  jsContent = jsContent.replace(/:\s*React\.ReactElement\s*/g, ' ');
  
  // Remove 'as' type assertions
  jsContent = jsContent.replace(/\s+as\s+[\w\[\]]+/g, '');
  
  // Remove readonly modifiers
  jsContent = jsContent.replace(/readonly\s+/g, '');
  
  // Convert enum to object
  jsContent = jsContent.replace(/export\s+enum\s+(\w+)\s*{([^}]+)}/g, (match, name, body) => {
    const items = body.split(',').map(item => {
      const [key, value] = item.trim().split('=').map(s => s.trim());
      if (value) {
        return `  ${key}: ${value}`;
      } else {
        return `  ${key}: '${key}'`;
      }
    }).join(',\n');
    return `export const ${name} = {\n${items}\n}`;
  });
  
  // Remove implements clause
  jsContent = jsContent.replace(/\s+implements\s+\w+/g, '');
  
  // Remove declare statements
  jsContent = jsContent.replace(/^declare\s+.+$/gm, '');
  
  // Clean up empty lines
  jsContent = jsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return jsContent;
}

function processFile(filePath) {
  if (!filePath.endsWith('.js')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const converted = convertTypeScriptToJavaScript(content);
    
    if (content !== converted) {
      fs.writeFileSync(filePath, converted, 'utf8');
      console.log(`Converted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else {
      processFile(filePath);
    }
  });
}

// Start conversion
const calendarDir = path.join(__dirname, 'src/components/calendar-v2');
console.log('Converting Calendar V2 to JavaScript...');
walkDirectory(calendarDir);
console.log('Conversion complete!');