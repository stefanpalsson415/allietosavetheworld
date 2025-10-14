// Clear all cached data for a fresh start
console.log('🧹 Clearing all cached data...');

// Clear localStorage
const keysToKeep = ['currentUserId']; // Keep user ID if you want to stay logged in
const allKeys = Object.keys(localStorage);

allKeys.forEach(key => {
  if (!keysToKeep.includes(key)) {
    console.log(`Removing: ${key}`);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
sessionStorage.clear();

// Clear IndexedDB (if used)
if (window.indexedDB) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      console.log(`Deleting IndexedDB: ${db.name}`);
      indexedDB.deleteDatabase(db.name);
    });
  }).catch(e => console.log('Could not list IndexedDB databases'));
}

console.log('✅ Cache cleared! Please refresh the page.');
console.log('   If you were logged in, you may need to log in again.');