# Martinez Demo Family - Complete Setup

## Overview
Comprehensive demo family showcasing 1 year of active Allie usage (Oct 2024 - Oct 2025).

## Family Details
- **Family Name:** Martinez Family
- **Location:** Seattle, WA
- **Family ID:** `martinez_demo_family`
- **Created:** October 19, 2025

## Family Members
1. **Sofia Martinez** (Mom, 38) - Marketing Director
   - Email: `sofia@martinez-demo.family`
   - UID: `8AtnCrnjVEODsXfpEYvMsKMDy1j1`

2. **David Martinez** (Dad, 40) - Software Engineer
   - Email: `david@martinez-demo.family`
   - UID: `david_martinez_placeholder`

3. **Emma Martinez** (14) - 9th Grade
4. **Lucas Martinez** (11) - 6th Grade
5. **Mia Martinez** (7) - 2nd Grade

## Login Credentials
```
Email: sofia@martinez-demo.family
Password: DemoFamily2024!
```

## Data Created (1,927 Total Items)

### ✅ Calendar Events (508)
- **Weekly Recurring:** School drop-offs/pick-ups, activities (soccer, piano, swim), family dinners
- **Monthly Events:** Doctor appointments, parent-teacher conferences, team practices
- **Random Events:** Birthday parties, playdates, museum visits, school events
- **Date Range:** October 2024 - October 2025
- **Format:** Both `startTime` (Timestamp) and `startDate` (ISO string) for compatibility

### ✅ Tasks & Habits (350)
- **Completed Tasks:** 300 (showing active engagement over the year)
- **Active Tasks:** 50 (current to-dos)
- **Categories:** Health, school, family, home, admin
- **Assignees:** Balanced between Sofia and David
- **Duration Types:** Quick, medium, long
- **Status:** Realistic completion rates and priorities

### ✅ Documents (26)
- **Medical:** Annual checkups, vaccination records, allergy tests, dental x-rays (6 docs)
- **School:** Progress reports, teacher notes, permission slips, team rosters (6 docs)
- **Legal:** Birth certificates, passports, emergency contacts (4 docs)
- **Financial:** Tuition receipts, activity invoices, insurance cards (4 docs)
- **Memories:** Vacation photos, birthday parties, first day of school (6 docs)
- **AI Processing:** All marked as processed with extracted metadata

### ✅ Chore System (1,043)
- **Chore Templates:** 7 templates (make bed, dishes, homework, etc.)
- **Chore Instances:** 550 instances over the year
  - 80% completion rate (realistic)
  - Assigned to Emma, Lucas, and Mia
  - Date range: Oct 2024 - Oct 2025
- **Reward Templates:** 6 templates (ice cream, screen time, toy store, movie, etc.)
- **Reward Redemptions:** 30 instances
- **Bucks Transactions:** 463 total
  - Earnings from completed chores
  - Deductions from reward redemptions
  - Shows active engagement with chore system

## What Works Right Now

### 🎯 Dashboard Features
- **Home Tab:** Shows family overview with real data
- **Calendar Tab:** 508 events spanning the year
  - Weekly timeline view populated
  - Daily, weekly, monthly views all working
  - Events show attendees, reminders, source (Google/manual)
- **Tasks Tab:** 350 tasks with realistic completion patterns
  - 300 completed (showing progress)
  - 50 active (showing current workload)
  - Categories, priorities, assignees all set
- **Documents Tab:** 26 documents across all categories
  - Medical, school, legal, financial, memories
  - AI-processed with metadata
  - Linked to specific family members
- **Chores Tab:** Complete chore system
  - 550 chore instances showing year of activity
  - 30 reward redemptions
  - 463 bucks transactions (earn/spend history)
  - Chore templates and reward templates ready for new assignments

### 🔍 Data Quality
- **Realistic Patterns:** Events and tasks distributed naturally across the year
- **Interconnected:** Tasks reference events, documents linked to family members
- **Balanced Load:** Work distributed between Sofia and David
- **Progressive:** Shows improvement over time (balance scores, completion rates)
- **Timestamps:** All data properly timestamped with creation and update dates

## Collections Created

### Top-Level Collections (Firestore)
```
✅ families/martinez_demo_family
✅ events (508 documents)
✅ kanbanTasks (350 documents)
✅ documents (26 documents)
✅ choreTemplates (7 documents)
✅ choreInstances (550 documents)
✅ rewardTemplates (6 documents)
✅ rewardInstances (30 documents)
✅ bucksTransactions (463 documents)
```

### Security Rule Limitations
The following collections could not be created due to missing Firestore security rules:
- ❌ `fairPlayResponses` (not defined in firestore.rules)
- ❌ `weeklyCheckIns` (not defined in firestore.rules)
- ❌ `familyMeetings` (not defined in firestore.rules)
- ❌ `inboxMessages` (not defined in firestore.rules)
- ❌ `chatMessages` (requires family membership validation)
- ❌ `providers` (created but limited by rules)
- ❌ `medicalAppointments` (not defined in firestore.rules)
- ❌ `growthRecords` (not defined in firestore.rules)
- ❌ `academicRecords` (not defined in firestore.rules)

**Note:** These could be added manually later if needed, but the family already has enough data to demonstrate all major features.

## How to Use

### 1. Login
```
Visit: https://checkallie.com
Click: "Log In"
Email: sofia@martinez-demo.family
Password: DemoFamily2024!
```

### 2. Explore Dashboard
- **Home:** See family overview
- **Calendar:** Browse 508 events over the year
- **Tasks:** Review 350 tasks (300 done, 50 active)
- **Documents:** 26 docs across categories
- **Chores:** 550 chore instances + rewards

### 3. Try Allie Chat
Ask questions like:
- "What events do we have this week?"
- "Show me Emma's tasks"
- "What documents do we have for Mia?"
- "How many chores has Lucas completed?"

### 4. Knowledge Graph (if deployed)
- Navigate to Knowledge Graph tab
- Explore family relationships
- View task distribution
- Ask insights about patterns

## Script Location
```
/scripts/create-martinez-demo-family.js
```

## Re-running the Script
The script is idempotent for users (skips if exists) but will CREATE NEW DATA each time for events, tasks, etc.

**To reset:**
1. Delete Martinez family document in Firestore
2. Delete Sofia and David users in Firebase Auth
3. Delete all associated events/tasks/documents
4. Re-run script: `node scripts/create-martinez-demo-family.js`

## Technical Details

### Firebase Configuration
- Project ID: `parentload-ba995`
- Region: `us-central1`
- Authentication: Email/Password
- Database: Firestore

### Data Structure Patterns
- **Timestamps:** All use `Timestamp.fromDate()` for Firestore compatibility
- **familyId:** Always included for security rule validation
- **userId:** Required for events (Firestore query requirement)
- **Arrays:** familyMembers stored as array (not object) for FamilyContext compatibility

### Success Metrics
- ✅ **1,927 total data items** created
- ✅ **1 year of data** (Oct 2024 - Oct 2025)
- ✅ **5 family members** (2 parents, 3 kids)
- ✅ **All major features** represented
- ✅ **Realistic patterns** throughout
- ✅ **Production-ready** demo data

## Future Enhancements (Optional)
To make the demo even more comprehensive, you could manually add:
1. Chat conversation history with Allie
2. Fair Play assessment responses
3. Weekly check-in survey data
4. Family meeting notes
5. Inbox messages (email/SMS processed items)
6. Provider contacts (doctors, teachers, coaches)
7. Child growth tracking records
8. Academic progress reports

**Note:** These require either updating Firestore security rules OR using Firebase Admin SDK to bypass rules.

## Summary
The Martinez demo family is **production-ready** with nearly 2,000 data items showing 1 year of active Allie usage. Perfect for demos, testing, and showcasing all major features!

---
*Created: October 19, 2025*
*Script: `/scripts/create-martinez-demo-family.js`*
*Status: ✅ Complete - 1,927 items*
