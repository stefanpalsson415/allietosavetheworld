const fs = require('fs');

const filePath = 'src/components/calendar-v2/sync/BaseSyncAdapter.js';
let content = fs.readFileSync(filePath, 'utf8');

// Remove TypeScript type annotations
content = content.replace(/export abstract class/g, 'export class');
content = content.replace(/protected\s+/g, '');
content = content.replace(/abstract\s+/g, '');
content = content.replace(/:\s*SyncProvider;/g, ';');
content = content.replace(/:\s*SyncCredentials\s*\|\s*null\s*=\s*null;/g, ' = null;');
content = content.replace(/:\s*SyncStatus;/g, ';');
content = content.replace(/:\s*SyncOptions;/g, ';');
content = content.replace(/:\s*EventStore;/g, ';');
content = content.replace(/:\s*AllieEventProcessor;/g, ';');
content = content.replace(/:\s*SyncProvider/g, '');
content = content.replace(/:\s*EventStore/g, '');
content = content.replace(/:\s*AllieEventProcessor/g, '');
content = content.replace(/:\s*any/g, '');
content = content.replace(/:\s*Promise<[^>]+>/g, '');
content = content.replace(/:\s*string/g, '');
content = content.replace(/:\s*void/g, '');
content = content.replace(/:\s*boolean/g, '');
content = content.replace(/:\s*Date/g, '');
content = content.replace(/:\s*FamilyEvent/g, '');
content = content.replace(/:\s*ExternalEvent\[\]/g, '');
content = content.replace(/:\s*Partial<[^>]+>/g, '');
content = content.replace(/:\s*SyncResult/g, '');
content = content.replace(/:\s*SyncCredentials/g, '');
content = content.replace(/:\s*{\s*imported:\s*number;\s*conflicts:\s*SyncConflict\[\];\s*}/g, '');
content = content.replace(/:\s*{\s*exported:\s*number;\s*errors:\s*string\[\];\s*}/g, '');
content = content.replace(/:\s*'time'\s*\|\s*'title'\s*\|\s*'location'\s*\|\s*null/g, '');
content = content.replace(/:\s*ExternalEvent/g, '');
content = content.replace(/:\s*number/g, '');
content = content.replace(/:\s*string\[\]/g, '');
content = content.replace(/const conflicts:\s*SyncConflict\[\]/g, 'const conflicts');
content = content.replace(/const errors:\s*string\[\]/g, 'const errors');
content = content.replace(/const result:\s*SyncResult/g, 'const result');

// Write the file
fs.writeFileSync(filePath, content);
console.log('Converted BaseSyncAdapter to JavaScript');