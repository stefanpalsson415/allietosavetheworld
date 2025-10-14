/**
 * User Setup Diagnostic Script
 *
 * Purpose: Audit current Firebase user and family data to identify gaps
 * Before: Deleting user data and setting up lead collection
 *
 * What it checks:
 * 1. Firebase Auth users (login credentials)
 * 2. Firestore users/{email} documents (user metadata)
 * 3. Firestore families/{familyId} documents (family data)
 * 4. Data connections (user → familyId → family members)
 * 5. Existing leads collection (if any)
 *
 * Run: node audit-user-setup.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
let app;
try {
  // Try to load service account from local file
  const serviceAccount = require('./serviceAccountKey.json');
  app = initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized with service account\n');
} catch (error) {
  console.error('❌ Error loading service account. Please ensure serviceAccountKey.json exists.');
  console.error('   Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  process.exit(1);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Report structure
const report = {
  timestamp: new Date().toISOString(),
  auth: {
    total: 0,
    byProvider: {
      password: 0,
      google: 0,
      phone: 0, // OTP
      other: 0
    },
    users: []
  },
  firestore: {
    users: {
      total: 0,
      withFamilyId: 0,
      withoutFamilyId: 0,
      documents: []
    },
    families: {
      total: 0,
      withMembers: 0,
      orphaned: 0, // Families with no corresponding users
      documents: []
    },
    leads: {
      exists: false,
      total: 0,
      documents: []
    }
  },
  gaps: {
    authOnlyUsers: [], // Users in Auth but not in Firestore
    firestoreOnlyUsers: [], // Users in Firestore but not in Auth
    usersWithoutFamily: [], // Users with no familyId
    familiesWithoutUsers: [], // Families with no parent users
    missingConnections: [] // Users with familyId pointing to non-existent family
  },
  summary: {
    completeUsers: 0, // Auth + Firestore + Family
    incompleteUsers: 0, // Missing parts
    recommendations: []
  }
};

/**
 * Step 1: Get all Firebase Auth users
 */
async function auditAuthUsers() {
  console.log('📋 Step 1: Checking Firebase Authentication users...\n');

  try {
    const listUsersResult = await auth.listUsers();

    report.auth.total = listUsersResult.users.length;

    listUsersResult.users.forEach(user => {
      // Determine provider
      const providers = user.providerData.map(p => p.providerId);
      let authMethod = 'other';

      if (providers.includes('password')) {
        authMethod = 'password';
        report.auth.byProvider.password++;
      } else if (providers.includes('google.com')) {
        authMethod = 'google';
        report.auth.byProvider.google++;
      } else if (providers.includes('phone')) {
        authMethod = 'phone';
        report.auth.byProvider.phone++;
      } else {
        report.auth.byProvider.other++;
      }

      report.auth.users.push({
        uid: user.uid,
        email: user.email,
        authMethod,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
        disabled: user.disabled
      });
    });

    console.log(`   Found ${report.auth.total} users in Firebase Auth:`);
    console.log(`   - Password: ${report.auth.byProvider.password}`);
    console.log(`   - Google OAuth: ${report.auth.byProvider.google}`);
    console.log(`   - Phone (OTP): ${report.auth.byProvider.phone}`);
    console.log(`   - Other: ${report.auth.byProvider.other}\n`);

  } catch (error) {
    console.error('❌ Error reading Auth users:', error.message);
  }
}

/**
 * Step 2: Get all Firestore users/{email} documents
 */
async function auditFirestoreUsers() {
  console.log('📋 Step 2: Checking Firestore users collection...\n');

  try {
    const usersSnapshot = await db.collection('users').get();

    report.firestore.users.total = usersSnapshot.size;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const hasFamilyId = !!data.familyId;

      if (hasFamilyId) {
        report.firestore.users.withFamilyId++;
      } else {
        report.firestore.users.withoutFamilyId++;
      }

      report.firestore.users.documents.push({
        email: doc.id,
        familyId: data.familyId || null,
        authMethod: data.authMethod || 'unknown',
        hasPassword: data.hasPassword || false,
        displayName: data.displayName || null,
        createdAt: data.createdAt?.toDate?.() || null
      });
    });

    console.log(`   Found ${report.firestore.users.total} user documents in Firestore:`);
    console.log(`   - With familyId: ${report.firestore.users.withFamilyId}`);
    console.log(`   - Without familyId: ${report.firestore.users.withoutFamilyId}\n`);

  } catch (error) {
    console.error('❌ Error reading Firestore users:', error.message);
  }
}

/**
 * Step 3: Get all Firestore families/{familyId} documents
 */
async function auditFirestoreFamilies() {
  console.log('📋 Step 3: Checking Firestore families collection...\n');

  try {
    const familiesSnapshot = await db.collection('families').get();

    report.firestore.families.total = familiesSnapshot.size;

    familiesSnapshot.forEach(doc => {
      const data = doc.data();
      const hasMembers = Array.isArray(data.familyMembers) && data.familyMembers.length > 0;

      if (hasMembers) {
        report.firestore.families.withMembers++;
      }

      report.firestore.families.documents.push({
        familyId: doc.id,
        familyName: data.familyName || 'Unnamed',
        memberCount: data.familyMembers?.length || 0,
        memberIds: data.memberIds || [],
        primaryEmail: data.primaryEmail || null,
        createdAt: data.createdAt?.toDate?.() || null,
        members: data.familyMembers || []
      });
    });

    console.log(`   Found ${report.firestore.families.total} family documents:`);
    console.log(`   - With members: ${report.firestore.families.withMembers}`);
    console.log(`   - Empty: ${report.firestore.families.total - report.firestore.families.withMembers}\n`);

  } catch (error) {
    console.error('❌ Error reading Firestore families:', error.message);
  }
}

/**
 * Step 4: Check for leads collection (blog/quiz emails)
 */
async function auditLeadsCollection() {
  console.log('📋 Step 4: Checking for leads collection...\n');

  try {
    const leadsSnapshot = await db.collection('leads').get();

    if (leadsSnapshot.size > 0) {
      report.firestore.leads.exists = true;
      report.firestore.leads.total = leadsSnapshot.size;

      leadsSnapshot.forEach(doc => {
        const data = doc.data();
        report.firestore.leads.documents.push({
          leadId: doc.id,
          email: data.email || null,
          source: data.source || 'unknown',
          status: data.status || 'subscribed',
          createdAt: data.createdAt?.toDate?.() || null
        });
      });

      console.log(`   ✅ Leads collection exists with ${report.firestore.leads.total} documents\n`);
    } else {
      console.log(`   ℹ️  Leads collection does not exist (will need to create)\n`);
    }

  } catch (error) {
    // Collection doesn't exist
    console.log(`   ℹ️  Leads collection does not exist (will need to create)\n`);
  }
}

/**
 * Step 5: Identify gaps and missing connections
 */
async function identifyGaps() {
  console.log('📋 Step 5: Identifying data gaps and missing connections...\n');

  // Build lookup maps
  const authEmails = new Set(report.auth.users.map(u => u.email).filter(Boolean));
  const firestoreUserEmails = new Set(report.firestore.users.documents.map(u => u.email));
  const familyIds = new Set(report.firestore.families.documents.map(f => f.familyId));

  // Gap 1: Users in Auth but not in Firestore
  report.auth.users.forEach(authUser => {
    if (authUser.email && !firestoreUserEmails.has(authUser.email)) {
      report.gaps.authOnlyUsers.push({
        email: authUser.email,
        uid: authUser.uid,
        authMethod: authUser.authMethod
      });
    }
  });

  // Gap 2: Users in Firestore but not in Auth
  report.firestore.users.documents.forEach(firestoreUser => {
    if (!authEmails.has(firestoreUser.email)) {
      report.gaps.firestoreOnlyUsers.push({
        email: firestoreUser.email,
        familyId: firestoreUser.familyId
      });
    }
  });

  // Gap 3: Users without familyId
  report.firestore.users.documents.forEach(user => {
    if (!user.familyId) {
      report.gaps.usersWithoutFamily.push({
        email: user.email,
        authMethod: user.authMethod
      });
    }
  });

  // Gap 4: Users with familyId pointing to non-existent family
  report.firestore.users.documents.forEach(user => {
    if (user.familyId && !familyIds.has(user.familyId)) {
      report.gaps.missingConnections.push({
        email: user.email,
        familyId: user.familyId,
        issue: 'Family document does not exist'
      });
    }
  });

  // Gap 5: Families without parent users in Auth
  report.firestore.families.documents.forEach(family => {
    // Safety check: ensure members is an array
    const members = Array.isArray(family.members) ? family.members : [];

    const parentEmails = members
      .filter(m => m.role === 'parent' && m.email)
      .map(m => m.email);

    const hasAuthUser = parentEmails.some(email => authEmails.has(email));

    if (!hasAuthUser && parentEmails.length > 0) {
      report.firestore.families.orphaned++;
      report.gaps.familiesWithoutUsers.push({
        familyId: family.familyId,
        familyName: family.familyName,
        parentEmails
      });
    }
  });

  console.log(`   Gaps identified:`);
  console.log(`   - Auth-only users (no Firestore): ${report.gaps.authOnlyUsers.length}`);
  console.log(`   - Firestore-only users (no Auth): ${report.gaps.firestoreOnlyUsers.length}`);
  console.log(`   - Users without familyId: ${report.gaps.usersWithoutFamily.length}`);
  console.log(`   - Users with invalid familyId: ${report.gaps.missingConnections.length}`);
  console.log(`   - Families without Auth users: ${report.gaps.familiesWithoutUsers.length}\n`);
}

/**
 * Step 6: Generate summary and recommendations
 */
function generateSummary() {
  console.log('📋 Step 6: Generating summary and recommendations...\n');

  // Calculate complete users (Auth + Firestore + Family)
  report.firestore.users.documents.forEach(user => {
    const hasAuth = report.auth.users.some(authUser => authUser.email === user.email);
    const hasFamily = user.familyId &&
      report.firestore.families.documents.some(f => f.familyId === user.familyId);

    if (hasAuth && user.familyId && hasFamily) {
      report.summary.completeUsers++;
    } else {
      report.summary.incompleteUsers++;
    }
  });

  // Generate recommendations
  if (report.gaps.authOnlyUsers.length > 0) {
    report.summary.recommendations.push(
      `⚠️  ${report.gaps.authOnlyUsers.length} users have login credentials but no Firestore metadata - they likely bypassed onboarding`
    );
  }

  if (report.gaps.usersWithoutFamily.length > 0) {
    report.summary.recommendations.push(
      `⚠️  ${report.gaps.usersWithoutFamily.length} users have no familyId - they cannot access family features`
    );
  }

  if (report.gaps.familiesWithoutUsers.length > 0) {
    report.summary.recommendations.push(
      `⚠️  ${report.gaps.familiesWithoutUsers.length} families have no parent users - orphaned family data`
    );
  }

  if (report.gaps.missingConnections.length > 0) {
    report.summary.recommendations.push(
      `⚠️  ${report.gaps.missingConnections.length} users point to non-existent families - broken links`
    );
  }

  if (!report.firestore.leads.exists) {
    report.summary.recommendations.push(
      `ℹ️  No leads collection found - need to create system for blog/quiz email collection`
    );
  }

  if (report.summary.completeUsers === 0 && report.auth.total > 0) {
    report.summary.recommendations.push(
      `🔴 CRITICAL: Zero complete users found - all users have setup issues`
    );
  }

  if (report.summary.recommendations.length === 0) {
    report.summary.recommendations.push(
      `✅ All users appear to have complete setup (Auth + Firestore + Family)`
    );
  }
}

/**
 * Step 7: Display report
 */
function displayReport() {
  console.log('\n' + '='.repeat(80));
  console.log('USER SETUP AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('📊 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Auth Users: ${report.auth.total}`);
  console.log(`Total Firestore Users: ${report.firestore.users.total}`);
  console.log(`Total Families: ${report.firestore.families.total}`);
  console.log(`Complete Users (Auth + Firestore + Family): ${report.summary.completeUsers}`);
  console.log(`Incomplete Users: ${report.summary.incompleteUsers}\n`);

  console.log('🔍 AUTHENTICATION BREAKDOWN');
  console.log('-'.repeat(80));
  console.log(`Password Auth: ${report.auth.byProvider.password}`);
  console.log(`Google OAuth: ${report.auth.byProvider.google}`);
  console.log(`Phone/OTP: ${report.auth.byProvider.phone}`);
  console.log(`Other: ${report.auth.byProvider.other}\n`);

  console.log('⚠️  DATA GAPS');
  console.log('-'.repeat(80));
  console.log(`Auth-only users (missing Firestore): ${report.gaps.authOnlyUsers.length}`);
  console.log(`Firestore-only users (missing Auth): ${report.gaps.firestoreOnlyUsers.length}`);
  console.log(`Users without familyId: ${report.gaps.usersWithoutFamily.length}`);
  console.log(`Users with invalid familyId: ${report.gaps.missingConnections.length}`);
  console.log(`Orphaned families: ${report.gaps.familiesWithoutUsers.length}\n`);

  console.log('💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));
  report.summary.recommendations.forEach(rec => {
    console.log(rec);
  });
  console.log();

  // Detailed gaps
  if (report.gaps.authOnlyUsers.length > 0) {
    console.log('📝 AUTH-ONLY USERS (no Firestore metadata):');
    console.log('-'.repeat(80));
    report.gaps.authOnlyUsers.forEach(user => {
      console.log(`   ${user.email} (${user.authMethod}) - uid: ${user.uid}`);
    });
    console.log();
  }

  if (report.gaps.usersWithoutFamily.length > 0) {
    console.log('📝 USERS WITHOUT FAMILY:');
    console.log('-'.repeat(80));
    report.gaps.usersWithoutFamily.forEach(user => {
      console.log(`   ${user.email} (${user.authMethod})`);
    });
    console.log();
  }

  if (report.gaps.familiesWithoutUsers.length > 0) {
    console.log('📝 ORPHANED FAMILIES:');
    console.log('-'.repeat(80));
    report.gaps.familiesWithoutUsers.forEach(family => {
      console.log(`   ${family.familyName} (${family.familyId})`);
      console.log(`      Parent emails: ${family.parentEmails.join(', ')}`);
    });
    console.log();
  }
}

/**
 * Step 8: Save full report to JSON
 */
async function saveReport() {
  const fs = require('fs').promises;
  const filename = `user-audit-${Date.now()}.json`;

  try {
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`✅ Full report saved to: ${filename}\n`);
  } catch (error) {
    console.error('❌ Error saving report:', error.message);
  }
}

/**
 * Main execution
 */
async function runAudit() {
  console.log('🔍 STARTING USER SETUP AUDIT\n');
  console.log('This will check:');
  console.log('1. Firebase Auth users (login credentials)');
  console.log('2. Firestore users documents (metadata)');
  console.log('3. Firestore families documents (family data)');
  console.log('4. Data connections and gaps');
  console.log('5. Leads collection (if exists)\n');
  console.log('='.repeat(80) + '\n');

  try {
    await auditAuthUsers();
    await auditFirestoreUsers();
    await auditFirestoreFamilies();
    await auditLeadsCollection();
    await identifyGaps();
    generateSummary();
    displayReport();
    await saveReport();

    console.log('✅ Audit complete!\n');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the audit
runAudit();
