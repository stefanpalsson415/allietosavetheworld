// This script will analyze the investor funnel files and extract unique slides
const fs = require('fs');
const path = require('path');

const basePath = '/Users/stefanpalsson/parentload copy/src/components/marketing';
const outputFile = path.join(basePath, 'InvestorFunnelAllSlides.jsx');

// List of files to search for unique slides
const filesToAnalyze = [
  path.join(basePath, 'InvestorFunnel.jsx'),
  path.join(basePath, 'InvestorFunnelFixed.jsx'),
  path.join(basePath, 'InvestorFunnelRefactored.jsx'),
  path.join(basePath, 'InvestorFunnelComprehensive.jsx')
];

// Read the template file
const templateFile = path.join(basePath, 'InvestorFunnelComprehensive.jsx');
const templateContent = fs.readFileSync(templateFile, 'utf8');

// Object to store unique slides
const uniqueSlides = {};
let nextSlideNumber = 61; // Start adding new slides from slide 61

// Extract slides from each file
filesToAnalyze.forEach(file => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`File doesn't exist: ${file}`);
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract case statements with slide content
    const caseRegex = /case\s+(\d+):\s*return\s*\(\s*(<div[\s\S]+?<\/div>)\s*\);/g;
    let match;
    
    while ((match = caseRegex.exec(content)) !== null) {
      const slideNumber = match[1];
      const slideContent = match[2];
      
      // Create a hash of the slide content to detect duplicates
      const contentHash = require('crypto').createHash('md5').update(slideContent).digest('hex');
      
      // Check if this is a unique slide
      if (!Object.values(uniqueSlides).some(slide => slide.hash === contentHash)) {
        // Extract slide title if available
        const titleMatch = slideContent.match(/<h[12][^>]*>(.*?)<\/h[12]>/);
        const slideTitle = titleMatch ? titleMatch[1] : `Slide ${slideNumber} from ${path.basename(file)}`;
        
        uniqueSlides[nextSlideNumber] = {
          number: nextSlideNumber,
          title: slideTitle,
          content: slideContent,
          hash: contentHash,
          sourceFile: path.basename(file),
          originalNumber: slideNumber
        };
        
        nextSlideNumber++;
      }
    }
    
    // Also look for custom slides
    const customSlideRegex = /<h2[^>]*>(.*?)<\/h2>[\s\S]+?(?=<h2|<\/div>)/g;
    while ((match = customSlideRegex.exec(content)) !== null) {
      const slideTitle = match[1];
      const slideContent = match[0];
      
      // Create a hash of the slide content to detect duplicates
      const contentHash = require('crypto').createHash('md5').update(slideContent).digest('hex');
      
      // Check if this is a unique slide
      if (!Object.values(uniqueSlides).some(slide => slide.hash === contentHash)) {
        uniqueSlides[nextSlideNumber] = {
          number: nextSlideNumber,
          title: slideTitle,
          content: slideContent,
          hash: contentHash,
          sourceFile: path.basename(file),
          originalNumber: 'custom'
        };
        
        nextSlideNumber++;
      }
    }
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
});

// Count unique slides
const uniqueSlideCount = Object.keys(uniqueSlides).length;
console.log(`Found ${uniqueSlideCount} unique slides`);

// Print unique slide list
console.log('\nUnique slides:');
Object.values(uniqueSlides).forEach(slide => {
  console.log(`${slide.number}. ${slide.title} (from ${slide.sourceFile}, original #${slide.originalNumber})`);
});

console.log(`\nTotal slides including existing ones: ${60 + uniqueSlideCount}`);

// Create a new InvestorFunnelAllSlides.jsx
try {
  // First, update the total slides count
  let updatedContent = templateContent.replace(
    /(const totalSlides = )(\d+)(;.*)/,
    `$1${60 + uniqueSlideCount}$3`
  );
  
  // Find where to insert the new slide cases
  const insertPoint = updatedContent.indexOf('      default:');
  if (insertPoint === -1) {
    throw new Error("Couldn't find insert point for new slides");
  }
  
  // Generate code for new slides
  const newSlideCases = Object.values(uniqueSlides).map(slide => {
    return `
      case ${slide.number}:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              ${slide.number}
            </div>
            <div className="flex flex-col h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h1 className="text-3xl font-bold text-indigo-800 mb-8">${slide.title}</h1>
              <p className="text-gray-700 mb-6">Custom slide from ${slide.sourceFile} (original #${slide.originalNumber})</p>
            </div>
          </div>
        );`;
  }).join('\n');
  
  // Insert the new cases
  updatedContent = updatedContent.slice(0, insertPoint) + newSlideCases + '\n' + updatedContent.slice(insertPoint);
  
  // Write the updated file
  fs.writeFileSync(outputFile, updatedContent);
  console.log(`\nSuccess! Updated ${outputFile} with ${uniqueSlideCount} new unique slides.`);
} catch (error) {
  console.error('Error creating updated file:', error);
}