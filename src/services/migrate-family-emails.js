// Migration script to update existing families with new email format
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import EmailConfigurationService from './EmailConfigurationService';

/**
 * Migrate all existing families to use the new email format
 */
export async function migrateFamilyEmails() {
  try {
    console.log('Starting family email migration...');
    
    // Get all families
    const familiesSnapshot = await getDocs(collection(db, 'families'));
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const familyDoc of familiesSnapshot.docs) {
      try {
        const familyId = familyDoc.id;
        const familyData = familyDoc.data();
        
        console.log(`Processing family ${familyId}: ${familyData.name || 'Unnamed'}`);
        
        // Check if family already has the new email format
        if (familyData.email && familyData.email.endsWith('@allie.family')) {
          console.log(`  - Already migrated: ${familyData.email}`);
          skippedCount++;
          continue;
        }
        
        // Migrate the email
        const result = await EmailConfigurationService.migrateLegacyEmail(familyId);
        
        if (result.success) {
          if (result.migrated) {
            console.log(`  ✓ Migrated to: ${result.email}`);
            migratedCount++;
          } else {
            console.log(`  - Already had correct format: ${result.email}`);
            skippedCount++;
          }
        } else {
          console.error(`  ✗ Migration failed: ${result.error}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`Error processing family ${familyDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`  - Migrated: ${migratedCount} families`);
    console.log(`  - Skipped: ${skippedCount} families`);
    console.log(`  - Errors: ${errorCount} families`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run migration if called directly
if (typeof window === 'undefined' && require.main === module) {
  migrateFamilyEmails()
    .then(result => {
      console.log('Migration result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}