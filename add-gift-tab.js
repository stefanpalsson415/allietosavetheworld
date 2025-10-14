const fs = require('fs');
const path = require('path');

// Read the file
const filePath = './src/components/dashboard/tabs/ChildrenTrackingTab.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Replace the tabs section to add the new tab
const updatedContent = content.replace(
  /<div className="flex items-center">\s*<AlertCircle size={16} className="mr-2" \/>\s*Wardrobe Concierge\s*<\/div>\s*<\/button>/,
  `<div className="flex items-center">
              <AlertCircle size={16} className="mr-2" />
              Wardrobe Concierge
            </div>
          </button>
          <button
            onClick={() => toggleSection('gifts')}
            className={\`px-4 py-2 font-medium text-sm border-b-2 \${
              activeSection === 'gifts' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }\`}
          >
            <div className="flex items-center">
              <Gift size={16} className="mr-2" />
              Kids Gift Ideas
            </div>
          </button>`
);

// Add the 'gifts' section case to the render section
const updatedContentWithSection = updatedContent.replace(
  /{activeSection === 'growth' && \(/,
  `{activeSection === 'gifts' && (
            <div className="p-4">
              <KidsGiftIdeasTab />
            </div>
          )}
          
          {activeSection === 'growth' && (`
);

// Add import for the KidsGiftIdeasTab and Gift icon
const updatedContentWithImport = updatedContentWithSection.replace(
  /import \{\s*Calendar, AlertCircle, Activity, Users, Search, X, RefreshCw,\s*User, PlusCircle, Mic, CheckCircle, Info, FileText,\s*Heart, List, ChevronRight, LayoutGrid, Book, Camera,\s*Clipboard, Database, ArrowRight, Archive, School\s*\} from 'lucide-react';/,
  `import { 
  Calendar, AlertCircle, Activity, Users, Search, X, RefreshCw, 
  User, PlusCircle, Mic, CheckCircle, Info, FileText, 
  Heart, List, ChevronRight, LayoutGrid, Book, Camera,
  Clipboard, Database, ArrowRight, Archive, School, Gift
} from 'lucide-react';`
);

// Add import for KidsGiftIdeasTab
const finalContent = updatedContentWithImport.replace(
  /import RevisedFloatingCalendarWidget from '\.\.\/\.\.\/calendar\/RevisedFloatingCalendarWidget';/,
  `import RevisedFloatingCalendarWidget from '../../calendar/RevisedFloatingCalendarWidget';
import KidsGiftIdeasTab from '../../dashboard/KidsGiftIdeasTab';`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, finalContent, 'utf8');

console.log('Successfully added Kids Gift Ideas tab to ChildrenTrackingTab.jsx');