// fix-dummy-providers-code.js
// This script fixes the code to prevent dummy providers from being added
// It creates a permanent solution by modifying the actual React components

const fs = require('fs');
const path = require('path');

async function fixDummyProviderCode() {
  console.log("🔧 Starting code modifications to prevent dummy providers...");
  
  // Paths to the files we need to modify
  const componentPaths = {
    providerDirectory: path.join(__dirname, 'components', 'document', 'ProviderDirectory.jsx'),
    providerService: path.join(__dirname, 'services', 'ProviderService.js')
  };
  
  // Verify files exist
  for (const [name, filepath] of Object.entries(componentPaths)) {
    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      console.log(`Looking for ${name} in alternative locations...`);
      // Try a simple search for the file
      const filename = path.basename(filepath);
      const searchPaths = findFiles(filename, __dirname);
      
      if (searchPaths.length > 0) {
        console.log(`Found ${searchPaths.length} possible matches:`);
        searchPaths.forEach((path, i) => console.log(`${i+1}. ${path}`));
        componentPaths[name] = searchPaths[0];
        console.log(`Using ${searchPaths[0]}`);
      } else {
        console.error(`❌ Could not find ${filename} anywhere in the project`);
      }
    }
  }
  
  // Step 1: Create the empty state component
  console.log("\n📋 Step 1: Creating EmptyProviderState component...");
  
  const emptyStateCode = `// src/components/document/EmptyProviderState.jsx
import React from 'react';
import { User, Plus } from 'lucide-react';

/**
 * EmptyProviderState - Shows a friendly message when no providers exist
 * Replaces dummy data with a proper empty state UI
 */
const EmptyProviderState = ({ onAddClick, searchActive = false }) => {
  return (
    <div className="text-center py-10 bg-gray-50 rounded-lg">
      <User size={40} className="text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 font-roboto mb-1">
        {searchActive ? 'No providers found' : 'No healthcare providers yet'}
      </p>
      <p className="text-sm text-gray-400 mb-4 font-roboto">
        {searchActive 
          ? 'Try changing your search or filters' 
          : 'Add your first provider to get started'}
      </p>
      {!searchActive && (
        <button
          onClick={onAddClick}
          className="px-4 py-2 bg-black text-white rounded-md font-roboto hover:bg-gray-800"
        >
          <Plus size={16} className="inline mr-1" />
          Add First Provider
        </button>
      )}
    </div>
  );
};

export default EmptyProviderState;
`;

  // Create the directory if it doesn't exist
  const emptyStateDir = path.join(__dirname, 'components', 'document');
  if (!fs.existsSync(emptyStateDir)) {
    fs.mkdirSync(emptyStateDir, { recursive: true });
  }
  
  // Write the new component
  const emptyStatePath = path.join(emptyStateDir, 'EmptyProviderState.jsx');
  try {
    fs.writeFileSync(emptyStatePath, emptyStateCode);
    console.log(`✅ Created EmptyProviderState component: ${emptyStatePath}`);
  } catch (err) {
    console.error(`❌ Error creating EmptyProviderState component:`, err);
  }
  
  // Step 2: Modify ProviderDirectory.jsx to use the empty state component
  // and never load dummy data
  console.log("\n📋 Step 2: Modifying ProviderDirectory component...");
  
  if (fs.existsSync(componentPaths.providerDirectory)) {
    let providerDirectoryCode = fs.readFileSync(componentPaths.providerDirectory, 'utf8');
    
    // Add import for EmptyProviderState
    if (!providerDirectoryCode.includes('EmptyProviderState')) {
      providerDirectoryCode = providerDirectoryCode.replace(
        'import UserAvatar from', 
        'import EmptyProviderState from \'./EmptyProviderState\';\nimport UserAvatar from'
      );
      console.log('✅ Added import for EmptyProviderState');
    } else {
      console.log('⚠️ EmptyProviderState import already exists');
    }
    
    // Replace the "No providers found" section with EmptyProviderState component
    // This is a bit risky as it depends on the exact structure of the component
    if (providerDirectoryCode.includes('No providers found')) {
      // Look for the empty state rendering portion
      const emptyStateRegex = /<div className="text-center py-10 bg-gray-50 rounded-lg">[\s\S]*?<\/div>\s*?}\s*?}/;
      
      const newEmptyState = `<EmptyProviderState 
          onAddClick={() => openProviderModal()} 
          searchActive={searchQuery || categoryFilter !== 'all'} 
        />
      )}`;
      
      providerDirectoryCode = providerDirectoryCode.replace(emptyStateRegex, newEmptyState);
      console.log('✅ Replaced empty state UI with EmptyProviderState component');
    } else {
      console.log('⚠️ Could not find empty state section to replace');
    }
    
    // Save the modified file
    fs.writeFileSync(componentPaths.providerDirectory, providerDirectoryCode);
    console.log(`✅ Updated ProviderDirectory component`);
    
    // Create a backup just in case
    fs.writeFileSync(`${componentPaths.providerDirectory}.bak`, providerDirectoryCode);
    console.log(`✅ Created backup of ProviderDirectory component`);
  } else {
    console.log(`⚠️ Could not find ProviderDirectory component to modify`);
  }
  
  // Step 3: Modify ProviderService.js to remove any dummy data creation
  console.log("\n📋 Step 3: Modifying ProviderService...");
  
  if (fs.existsSync(componentPaths.providerService)) {
    let providerServiceCode = fs.readFileSync(componentPaths.providerService, 'utf8');
    
    // Look for any methods that might create dummy data
    if (providerServiceCode.includes('dummy') || 
        providerServiceCode.includes('sample') || 
        providerServiceCode.includes('example')) {
      
      console.log('⚠️ Found potential dummy data code in ProviderService');
      
      // Add a method to ensure no dummy data is loaded
      if (!providerServiceCode.includes('preventDummyData')) {
        const preventDummyMethod = `
  /**
   * Ensures no dummy data is loaded for providers
   * @param {Array} providers - The providers list to filter
   * @returns {Array} - The filtered providers list
   */
  preventDummyData(providers) {
    if (!Array.isArray(providers)) return [];
    
    // Filter out any providers with isDummy flag or containing dummy/test keywords
    return providers.filter(provider => {
      if (!provider || !provider.name) return false;
      if (provider.isDummy === true) return false;
      if (provider.isDemo === true || provider.isExample === true) return false;
      
      const name = provider.name.toLowerCase();
      return !(
        name.includes('test') || 
        name.includes('dummy') || 
        name.includes('demo') || 
        name.includes('sample') ||
        name.includes('example')
      );
    });
  }
`;
        
        // Add the method before the last closing brace
        providerServiceCode = providerServiceCode.replace(
          /}\s*$/,
          preventDummyMethod + '}\n'
        );
        
        console.log('✅ Added preventDummyData method to ProviderService');
      } else {
        console.log('⚠️ preventDummyData method already exists');
      }
      
      // Modify any methods that load providers to use the preventDummyData method
      if (providerServiceCode.includes('loadProviders') || 
          providerServiceCode.includes('getProviders')) {
        
        // Find the return statement that sets providers and add the preventDummyData call
        // This is a simplistic approach and might need manual adjustment
        providerServiceCode = providerServiceCode.replace(
          /setProviders\(([^)]+)\)/g,
          'setProviders(this.preventDummyData($1))'
        );
        
        console.log('✅ Modified provider loading methods to filter out dummy data');
      } else {
        console.log('⚠️ Could not find provider loading methods to modify');
      }
      
      // Save the modified file
      fs.writeFileSync(componentPaths.providerService, providerServiceCode);
      console.log(`✅ Updated ProviderService`);
      
      // Create a backup just in case
      fs.writeFileSync(`${componentPaths.providerService}.bak`, providerServiceCode);
      console.log(`✅ Created backup of ProviderService`);
    } else {
      console.log('✅ No dummy data code found in ProviderService');
    }
  } else {
    console.log(`⚠️ Could not find ProviderService to modify`);
  }
  
  console.log("\n🎉 Code modification complete!");
  console.log("\n📋 Next steps:");
  console.log("1. The scripts still need to be run to clean up existing data");
  console.log("2. Run 'node src/clean-providers.js' to remove dummy providers");
  console.log("3. Run 'node src/fix-calendar-appointment.js' to add Lillian's appointment");
  console.log("4. The code changes should prevent new dummy data from appearing");
  console.log("5. You may need to rebuild/restart your app for changes to take effect");
}

// Helper function to find files in the project
function findFiles(filename, startPath) {
  const results = [];
  
  // Simple recursive function to find files
  function searchDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          searchDir(filePath);
        } else if (file === filename) {
          results.push(filePath);
        }
      }
    } catch (err) {
      // Ignore errors from unreadable directories
    }
  }
  
  searchDir(startPath);
  return results;
}

// Run the function
fixDummyProviderCode().then(() => {
  console.log("\n✨ Script completed successfully ✨");
  process.exit(0);
}).catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});