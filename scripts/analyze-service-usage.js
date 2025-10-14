#!/usr/bin/env node
// analyze-service-usage.js - Find what needs to be migrated

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Services to analyze
const OLD_SERVICES = {
  'EventStore': {
    replacement: 'CalendarServiceV2',
    imports: ['EventStore', './EventStore', '../EventStore', '../../services/EventStore']
  },
  'CalendarService': {
    replacement: 'CalendarServiceV2',
    imports: ['CalendarService', './CalendarService', '../CalendarService', '../../services/CalendarService']
  },
  'MasterCalendarService': {
    replacement: 'CalendarServiceV2',
    imports: ['MasterCalendarService', './MasterCalendarService', '../MasterCalendarService', '../../services/MasterCalendarService']
  },
  'HabitService2': {
    replacement: 'HabitServiceV2',
    imports: ['HabitService2', './HabitService2', '../HabitService2', '../../services/HabitService2']
  },
  'HabitCyclesService': {
    replacement: 'HabitServiceV2',
    imports: ['HabitCyclesService', './HabitCyclesService', '../HabitCyclesService', '../../services/HabitCyclesService']
  }
};

// Collections to consolidate
const COLLECTION_CONSOLIDATION = {
  'calendar_events': 'events',
  'failedCalendarEvents': 'events',
  'eventRelationships': 'events',
  'habitCycles': 'habits',
  'habitQuests': 'habits',
  'habitDJSettings': 'habits',
  'habitHelperFeedback': 'habits',
  'familyDocuments': 'documents',
  'documentInbox': 'documents',
  'documentFolders': 'documents',
  'familyProfiles': 'families',
  'familyMembers': 'families',
  'familyContacts': 'families'
};

// ID patterns to fix
const OLD_ID_PATTERNS = [
  'firestoreId',
  'universalId',
  'eventId',
  'documentId',
  'habitId'
];

async function analyzeServiceUsage() {
  console.log('🔍 Analyzing Service Usage...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    serviceUsage: {},
    collectionUsage: {},
    idPatternUsage: {},
    filesAnalyzed: 0,
    totalIssues: 0
  };

  // Find all JS/JSX files
  const files = glob.sync('src/**/*.{js,jsx}', {
    ignore: ['**/node_modules/**', '**/deprecated/**']
  });

  console.log(`Found ${files.length} files to analyze\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    report.filesAnalyzed++;

    // Check for old service imports
    for (const [serviceName, config] of Object.entries(OLD_SERVICES)) {
      for (const importPattern of config.imports) {
        if (content.includes(importPattern)) {
          if (!report.serviceUsage[serviceName]) {
            report.serviceUsage[serviceName] = {
              replacement: config.replacement,
              files: []
            };
          }
          
          // Find all usage patterns
          const usageRegex = new RegExp(`${serviceName}\\.(\\w+)`, 'g');
          const methods = [...content.matchAll(usageRegex)].map(m => m[1]);
          const uniqueMethods = [...new Set(methods)];
          
          report.serviceUsage[serviceName].files.push({
            path: relativePath,
            methods: uniqueMethods,
            lineCount: (content.match(new RegExp(serviceName, 'g')) || []).length
          });
          
          report.totalIssues++;
          break;
        }
      }
    }

    // Check for old collection names
    for (const [oldCollection, newCollection] of Object.entries(COLLECTION_CONSOLIDATION)) {
      const collectionRegex = new RegExp(`collection\\([^,)]*,\\s*['"\`]${oldCollection}['"\`]`, 'g');
      const matches = content.match(collectionRegex);
      
      if (matches) {
        if (!report.collectionUsage[oldCollection]) {
          report.collectionUsage[oldCollection] = {
            replacement: newCollection,
            files: []
          };
        }
        
        report.collectionUsage[oldCollection].files.push({
          path: relativePath,
          occurrences: matches.length
        });
        
        report.totalIssues += matches.length;
      }
    }

    // Check for old ID patterns
    for (const pattern of OLD_ID_PATTERNS) {
      if (content.includes(pattern)) {
        if (!report.idPatternUsage[pattern]) {
          report.idPatternUsage[pattern] = {
            files: []
          };
        }
        
        const occurrences = (content.match(new RegExp(pattern, 'g')) || []).length;
        report.idPatternUsage[pattern].files.push({
          path: relativePath,
          occurrences
        });
        
        report.totalIssues += occurrences;
      }
    }
  }

  // Generate summary
  generateSummary(report);
  
  // Save detailed report
  const reportPath = `./firebase-migration-analysis-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

function generateSummary(report) {
  console.log('\n📊 MIGRATION SUMMARY');
  console.log('===================\n');
  
  // Service usage summary
  if (Object.keys(report.serviceUsage).length > 0) {
    console.log('🔧 Services to Migrate:');
    for (const [service, data] of Object.entries(report.serviceUsage)) {
      console.log(`\n  ${service} → ${data.replacement}`);
      console.log(`  Used in ${data.files.length} files`);
      
      // Show top 3 files
      data.files.slice(0, 3).forEach(file => {
        console.log(`    - ${file.path} (${file.methods.length} methods)`);
      });
      
      if (data.files.length > 3) {
        console.log(`    ... and ${data.files.length - 3} more files`);
      }
    }
  }
  
  // Collection usage summary
  if (Object.keys(report.collectionUsage).length > 0) {
    console.log('\n\n📁 Collections to Consolidate:');
    for (const [collection, data] of Object.entries(report.collectionUsage)) {
      console.log(`\n  ${collection} → ${data.replacement}`);
      console.log(`  Used in ${data.files.length} files`);
      
      data.files.slice(0, 3).forEach(file => {
        console.log(`    - ${file.path} (${file.occurrences} occurrences)`);
      });
    }
  }
  
  // ID pattern summary
  if (Object.keys(report.idPatternUsage).length > 0) {
    console.log('\n\n🔑 ID Patterns to Fix:');
    for (const [pattern, data] of Object.entries(report.idPatternUsage)) {
      const totalOccurrences = data.files.reduce((sum, f) => sum + f.occurrences, 0);
      console.log(`\n  ${pattern}: ${totalOccurrences} occurrences in ${data.files.length} files`);
    }
  }
  
  // Priority actions
  console.log('\n\n🎯 PRIORITY ACTIONS:');
  console.log('1. Create CalendarServiceV2 to replace 3 calendar services');
  console.log('2. Update all event-related components');
  console.log('3. Standardize on single ID pattern');
  console.log('4. Test thoroughly before removing old services');
  
  console.log(`\n\n📈 Total issues to fix: ${report.totalIssues}`);
}

// Generate migration script
function generateMigrationScript(report) {
  let script = `#!/usr/bin/env node
// auto-generated migration script

const replaceInFile = require('replace-in-file');

async function migrate() {
  const replacements = [];
  
`;

  // Add service replacements
  for (const [oldService, data] of Object.entries(report.serviceUsage)) {
    script += `  // Replace ${oldService} with ${data.replacement}\n`;
    script += `  replacements.push({\n`;
    script += `    files: ${JSON.stringify(data.files.map(f => f.path))},\n`;
    script += `    from: /${oldService}/g,\n`;
    script += `    to: '${data.replacement}'\n`;
    script += `  });\n\n`;
  }

  script += `  
  // Execute replacements
  for (const options of replacements) {
    try {
      const results = await replaceInFile(options);
      console.log('Replaced in:', results.filter(r => r.hasChanged).length, 'files');
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

migrate();
`;

  fs.writeFileSync('./generated-migration.js', script);
  console.log('\n✅ Migration script generated: ./generated-migration.js');
}

// Run analysis
analyzeServiceUsage().then(report => {
  if (report.totalIssues > 0) {
    console.log('\n\nWould you like to generate a migration script? (Coming soon...)');
    // generateMigrationScript(report);
  } else {
    console.log('\n✅ No migration needed! Your code is clean.');
  }
}).catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});