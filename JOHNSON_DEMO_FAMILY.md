# Johnson Demo Family - Complete Setup

## Overview
Comprehensive demo family showcasing 1 year of active Allie usage (Oct 2024 - Oct 2025), created using Firebase Admin SDK to bypass security rules.

## Family Details
- **Family Name:** Johnson Family
- **Location:** Seattle, WA (implied)
- **Family ID:** `johnson_demo_family`
- **Created:** October 19, 2025
- **Method:** Firebase Admin SDK (complete access, no permission errors)

## Family Members

### Parents
1. **Sarah Johnson** (Mom, 36) - Product Manager
   - Email: `sarah@johnson-demo.family`
   - Password: `DemoFamily2024!`
   - Role: parent

2. **Mike Johnson** (Dad, 38) - Teacher
   - Email: `mike@johnson-demo.family`
   - Password: `DemoFamily2024!`
   - Role: parent

### Children
3. **Olivia Johnson** (12) - 7th Grade
4. **Ethan Johnson** (9) - 4th Grade
5. **Lily Johnson** (5) - Kindergarten

## Login Credentials
```
Email: sarah@johnson-demo.family
Password: DemoFamily2024!

--- OR ---

Email: mike@johnson-demo.family
Password: DemoFamily2024!
```

## Data Created (751 Total Items)

### ✅ Calendar Events (338)
- **Weekly Recurring:**
  - Soccer Practice - Olivia (Tuesdays, 4pm, 1.5hrs)
  - Piano Lessons - Ethan (Wednesdays, 3pm, 1hr)
  - Swimming - Lily (Thursdays, 4pm, 1hr)
  - Family Dinner (Fridays, 6pm, 1.5hrs)
  - Grocery Shopping (Saturdays, 10am, 2hrs)
- **Monthly Events:** Doctor appointments, parent-teacher conferences, dentist, school board meetings
- **Random Events (30):** Birthday parties, playdates, museum visits, school events, movie nights, park outings
- **Date Range:** October 2024 - October 2025
- **Format:** Both `startTime` (Timestamp) and `startDate` (ISO string) for compatibility

### ✅ Tasks (200)
- **Completed Tasks:** 150 (75% completion rate - realistic engagement)
- **Active Tasks:** 50 (current workload)
- **Categories:** Health, school, family, home, admin
- **Priorities:** Low, medium, high distribution
- **Assignees:** Balanced between Sarah and Mike
- **Examples:**
  - Schedule annual checkup
  - Buy school supplies
  - Plan weekend activities
  - Organize garage
  - Review insurance
  - Book summer camp

### ✅ Documents (17)
- **Medical (4):** Annual Checkup, Vaccination Record, Allergy Test, Dental X-Ray
- **School (4):** Progress Report - Olivia, Permission Slip, Teacher Notes, Report Card - Ethan
- **Legal (3):** Birth Certificate - Lily, Passport Copy, Emergency Contacts
- **Financial (3):** Tuition Receipt, Activity Invoice, Insurance Card
- **Memories (3):** Summer Vacation Photos, Birthday Party, First Day of School
- **AI Processing:** All marked as processed with extracted metadata

### ✅ Chore System (120)
- **Chore Templates (4):**
  - Make Bed (5 bucks, easy)
  - Do Dishes (10 bucks, medium)
  - Homework (15 bucks, medium)
  - Clean Room (20 bucks, hard)
- **Chore Instances (100):**
  - 80 completed (80% completion rate)
  - 20 pending
  - Assigned to Olivia, Ethan, and Lily
  - Date range: Oct 2024 - Oct 2025
- **Reward Templates (3):**
  - Ice Cream Trip (50 bucks)
  - Extra Screen Time (30 bucks)
  - Toy Store Visit (100 bucks)
- **Reward Redemptions (20):** Realistic spend patterns over the year

### ✅ Survey Responses (12)
- **Weekly Check-ins:** 12 monthly surveys over the year
- **Metrics Tracked:**
  - Energy level (1-10 scale)
  - Stress level (1-10 scale)
  - Partnership quality (1-10 scale)
  - Notes and observations
- **Pattern:** Shows realistic variation and growth over time

### ✅ Family Meetings (12)
- **Frequency:** Monthly over 1 year
- **Standard Agenda:**
  - Review chores for the week
  - Plan weekend activities
  - Discuss school updates
- **Attendees:** Both parents
- **Notes:** Detailed meeting summaries

### ✅ Inbox Messages (50)
- **Types:** Email (25) and SMS (25)
- **Date Range:** Oct 2024 - Oct 2025
- **Processing Status:** Mixed (some processed, some pending - realistic)
- **Content:** Realistic family communication scenarios

## What Works Right Now

### 🎯 All Dashboard Features
- **Home Tab:** Family overview with real data ✅
- **Calendar Tab:** 338 events spanning the year ✅
  - Weekly timeline view populated
  - Daily, weekly, monthly views all working
  - Events show attendees, reminders, source (Google/manual)
- **Tasks Tab:** 200 tasks with realistic completion patterns ✅
  - 150 completed (showing progress)
  - 50 active (showing current workload)
  - Categories, priorities, assignees all set
- **Documents Tab:** 17 documents across all categories ✅
  - Medical, school, legal, financial, memories
  - AI-processed with metadata
  - Linked to specific family members
- **Chores Tab:** Complete chore system ✅
  - 100 chore instances showing year of activity
  - 20 reward redemptions
  - Chore templates and reward templates ready for new assignments
- **Balance & Habits:** Survey data ready ✅
  - 12 monthly check-ins
  - Energy, stress, partnership metrics
- **Family Meetings:** 12 meetings with notes ✅
- **Inbox:** 50 messages (email/SMS) ✅

## Collections Created

### Successfully Created (Using Firebase Admin SDK)
All collections created without permission errors thanks to Firebase Admin SDK:

```
✅ families/johnson_demo_family
✅ users (2 documents - Sarah & Mike)
✅ events (338 documents)
✅ kanbanTasks (200 documents)
✅ documents (17 documents)
✅ choreTemplates (4 documents)
✅ choreInstances (100 documents)
✅ rewardTemplates (3 documents)
✅ rewardInstances (20 documents)
✅ weeklyCheckIns (12 documents)
✅ familyMeetings (12 documents)
✅ inboxMessages (50 documents)
```

**No Permission Errors!** Firebase Admin SDK bypassed all security rules.

## Key Differences from Martinez Family

### Johnson Family (This One)
- ✅ **Firebase Admin SDK** - Complete access, no permission errors
- ✅ **All collections created** - Including surveys, meetings, inbox
- ✅ **751 total items** - Focused on quality over quantity
- ✅ **User documents created** - No visibility issues
- ✅ **Clean setup** - No chore bugs or child ID issues

### Martinez Family (Previous)
- ⚠️ **Firebase Client SDK** - Hit permission errors on many collections
- ⚠️ **1,927 items** - Larger dataset but incomplete
- ❌ **Missing collections** - fairPlayResponses, weeklyCheckIns, familyMeetings, etc.
- ❌ **Missing user doc** - Required manual fix
- ❌ **Chore bugs** - Placeholder child IDs caused errors

## How to Use

### 1. Login
```
Visit: https://checkallie.com
Click: "Log In"
Email: sarah@johnson-demo.family
Password: DemoFamily2024!
```

### 2. Explore Dashboard
- **Home:** See family overview with 5 members
- **Calendar:** Browse 338 events over the year
  - Click on events to see details
  - Try different views (daily, weekly, monthly)
- **Tasks:** Review 200 tasks (150 done, 50 active)
  - Filter by category, priority, assignee
  - Mark tasks complete
- **Documents:** 17 docs across categories
  - View by category
  - Search functionality
- **Chores:** 100 chore instances + rewards
  - See completion patterns
  - Award bucks, redeem rewards
- **Balance & Habits:** 12 monthly check-ins
  - View trends over time
- **Family Meetings:** 12 meetings with agendas
- **Inbox:** 50 email/SMS messages

### 3. Try Allie Chat
Ask questions like:
- "What events do we have this week?"
- "Show me Olivia's tasks"
- "What documents do we have for Ethan?"
- "How many chores has Lily completed?"
- "What's our energy trend this year?"

### 4. Knowledge Graph
**Note:** Knowledge Graph requires Neo4j data which this family doesn't have yet. Use Rodriguez family for Knowledge Graph testing.

## Script Location
```
/scripts/create-demo-family.js
```

## Re-running the Script
The script is idempotent for users (checks if email exists) but will CREATE NEW DATA each time.

**To reset:**
1. Delete Johnson family document in Firestore
2. Delete Sarah and Mike users in Firebase Auth (or skip, script will reuse)
3. Delete all associated events/tasks/documents
4. Re-run script: `node scripts/create-demo-family.js`

## Technical Details

### Firebase Configuration
- Project ID: `parentload-ba995`
- Region: `us-central1`
- Authentication: Email/Password (Firebase Auth)
- Database: Firestore
- Access Method: Firebase Admin SDK (full access)

### Service Account Key
- File: `firebase-service-account.json` (in project root)
- **SECURITY:** Added to .gitignore, never commit!
- **Purpose:** Bypasses all Firestore security rules

### Data Structure Patterns
- **Timestamps:** All use `admin.firestore.Timestamp.fromDate()` for Firestore compatibility
- **Server timestamps:** Use `admin.firestore.FieldValue.serverTimestamp()` for creation times
- **familyId:** Always included for security rule validation
- **userId:** Required for events (Firestore query requirement)
- **Arrays:** familyMembers stored as array (not object) for FamilyContext compatibility

### Success Metrics
- ✅ **751 total data items** created
- ✅ **1 year of data** (Oct 2024 - Oct 2025)
- ✅ **5 family members** (2 parents, 3 kids)
- ✅ **All major features** represented
- ✅ **Realistic patterns** throughout
- ✅ **Production-ready** demo data
- ✅ **No permission errors** (Firebase Admin SDK)

## Advantages Over Martinez Family

1. **Complete Dataset**
   - All collections created (surveys, meetings, inbox)
   - No missing pieces
   - No permission errors

2. **Clean Implementation**
   - Firebase Admin SDK = no security rule issues
   - Proper user documents from the start
   - No placeholder child IDs

3. **Better Data Quality**
   - More realistic patterns
   - Proper relationships between data
   - Clean, focused dataset (quality over quantity)

4. **Immediate Usability**
   - Login works immediately
   - All features visible
   - No console errors
   - No manual fixes needed

## Known Limitations

1. **No Neo4j Data**
   - Knowledge Graph won't show data
   - Use Rodriguez family for Knowledge Graph testing
   - Could add Neo4j data later with upload script

2. **No Google Calendar Integration**
   - All events are manual entries
   - Could add Google tokens if needed

3. **Children Don't Have Auth Accounts**
   - Children are family member objects, not Firebase users
   - This is intentional (kids typically don't login)
   - Chore assignments use child names, not UIDs

## Summary
The Johnson demo family is **production-ready** with 751 carefully crafted data items showing 1 year of active Allie usage. Created using Firebase Admin SDK to ensure complete, error-free data across all collections. Perfect for demos, testing, and showcasing all major features!

**Key Benefit:** Unlike Martinez family, this family has ZERO permission errors and ALL features working from day one.

---
*Created: October 19, 2025*
*Script: `/scripts/create-demo-family.js`*
*Method: Firebase Admin SDK*
*Status: ✅ Complete - 751 items across 11 collections*
