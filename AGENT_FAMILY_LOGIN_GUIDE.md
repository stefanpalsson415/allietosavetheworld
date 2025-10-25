# 🔑 Palsson Agent Family - Login & Data Guide

## 📋 Quick Start: Fill App with Data

### Step 1: Create the Family (with Firebase Auth accounts)
```bash
node scripts/agents/create-agent-family.js
```

**This creates:**
- ✅ 5 Firebase Auth users with real passwords
- ✅ Family document in Firestore (with memberIds for login)
- ✅ User documents for each member
- ✅ All initialization data

### Step 2: Run Simulation with `--write` Flag
```bash
# This will ACTUALLY write data to Firestore (takes ~0.1 seconds)
node scripts/agents/simulate-family-year.js --write
```

**This generates:**
- 📅 **~320 calendar events** (volleyball, science club, swimming, family dinners)
- 📋 **~450 tasks** (invisible labor, coordination, household tasks)
- 📄 **~20 documents** (vaccination records, school forms, permission slips)
- 📧 **~70 emails** (school, doctor, dentist, camp registration)
- 💬 **~30 SMS messages** (appointment reminders, haircut reminders)
- 📝 **~50 survey cycles** (weekly check-ins from Stefan & Kimberly)
- 🎤 **5 discovery interviews** (all family members completed)
- 👨‍👩‍👧‍👦 **~25 family meetings** (bi-weekly after surveys)
- ✅ **Daily habit tracking** (Lillian: plants, Oly: study, Tegner: chores)

### Step 3: Log In and Explore!
```
Go to: https://checkallie.com

Login with ANY of these accounts:
  stefan@palssonfamily.com / PalssonFamily2025!
  kimberly@palssonfamily.com / PalssonFamily2025!
  lillian@palssonfamily.com / PalssonFamily2025!
  oly@palssonfamily.com / PalssonFamily2025!
  tegner@palssonfamily.com / PalssonFamily2025!
```

---

## 🔐 Login Credentials

**Password (all accounts):** `PalssonFamily2025!`

**Email Accounts:**

| Member | Email | Role | Age | Best For Testing |
|--------|-------|------|-----|------------------|
| Stefan | stefan@palssonfamily.com | Parent | 40 | Low awareness → High awareness transformation |
| Kimberly | kimberly@palssonfamily.com | Parent | 38 | Mental load relief (87% → 58%) |
| Lillian | lillian@palssonfamily.com | Child | 14 | Teen skepticism → helpfulness |
| Oly | oly@palssonfamily.com | Child | 11 | Curious scientist, study habits |
| Tegner | tegner@palssonfamily.com | Child | 7 | High energy, sleep improvement |

---

## 🎯 What You'll See in the App

### 1. **Dashboard (Home Page)**
- ✅ Discovery interviews completed for all 5 members
- ✅ Weekly survey progress indicators
- ✅ Family meeting schedule
- ✅ Habit streaks for all 3 kids

### 2. **Calendar Tab**
- 📅 Volleyball practices (Lillian: Tuesdays & Thursdays at 4pm)
- 📅 Science club (Oly: Thursdays at 3:30pm)
- 📅 Swimming lessons (Tegner: Wednesdays at 4pm with Stefan)
- 📅 Family dinners (random throughout year)
- 📅 Family meetings (bi-weekly)

### 3. **Tasks Tab (Balance & Habits)**
- 📋 Stefan's visible tasks (dishes, laundry, groceries)
- 📋 Kimberly's invisible labor (coordination, anticipation)
- 📋 Kid coordination tasks (volleyball rides, science club, swimming)
- ✅ Habit completion tracking

### 4. **Inbox Tab**
- 📧 School emails (Hillside Elementary: field trips, picture day, PTA)
- 📧 Doctor appointment reminders (Dr. Sarah Chen)
- 📧 Dentist checkup reminders (Bright Smiles Dental - quarterly)
- 📧 Summer camp registration (City Summer Camps - May)
- 💬 SMS reminders (appointments, haircuts)

### 5. **Documents Tab**
- 📄 Vaccination records (uploaded by Kimberly)
- 📄 School forms (permission slips, emergency contacts)
- 📄 Insurance cards

### 6. **Interviews Tab**
- 🎤 Stefan's discovery interview (12 questions, 20 min)
- 🎤 Kimberly's discovery interview (12 questions, 20 min)
- 🎤 Lillian's discovery interview (8 questions, 15 min)
- 🎤 Oly's discovery interview (8 questions, 15 min)
- 🎤 Tegner's discovery interview (8 questions, 15 min)

### 7. **Surveys Tab**
- 📝 Stefan's weekly check-ins (brief version, 8 min)
- 📝 Kimberly's weekly check-ins (full version, 15 min)
- 📊 Mental load tracking over time
- 📊 Stress reduction graphs

### 8. **Meetings Tab**
- 👨‍👩‍👧‍👦 Bi-weekly family meetings
- 📋 Meeting agendas (adapt to transformation phase)
- ✅ Action items from meetings

---

## 📊 Expected Data Volumes (1 Year Simulation)

| Data Type | Count | Details |
|-----------|-------|---------|
| **Calendar Events** | ~320 | Recurring activities + ad-hoc events |
| **Tasks Created** | ~450 | 85% Kimberly (invisible labor), 15% Stefan |
| **Documents** | ~20 | Vaccination records, school forms |
| **Emails Received** | ~70 | School, doctors, services |
| **SMS Received** | ~30 | Appointment confirmations, reminders |
| **Survey Cycles** | 51 | Weekly check-ins (52 weeks - 1) |
| **Interviews** | 5 | One per family member |
| **Family Meetings** | ~25 | Bi-weekly after Discovery phase |
| **Allie Interactions** | ~280 | Questions, suggestions, chat |

---

## 🔄 Transformation Journey You'll See

### **Phase 1: Chaos (Month 1-2)**
- Stefan unaware (30%), Kimberly overwhelmed (87% mental load)
- Kids disengaged, Lillian skeptical (70%)
- Minimal coordination, high friction

### **Phase 2: Discovery (Month 3)**
- Discovery interviews completed
- Stefan: "Wow, I had no idea Kimberly was managing so much..."
- Awareness growing, first insights

### **Phase 3: Integration (Month 4-6)**
- Stefan takes on Oly's science club + Tegner's swimming
- Habits forming: Lillian (plants), Oly (study), Tegner (chores)
- Weekly surveys + bi-weekly meetings start

### **Phase 4: Balanced (Month 7-9)**
- Mental load equalized: Stefan 48%, Kimberly 62%
- Habits established (80%+ completion)
- Tegner's sleep improved 40% (60% → 84%)
- Family meetings productive

### **Phase 5: Thriving (Month 10-12)**
- Stefan awareness at 85%
- Kimberly mental load at 58% (down from 87%!)
- Lillian helpfulness at 90% (skepticism down to 5%)
- Sustainable family harmony

---

## 🧪 Testing Different Perspectives

**Login as Stefan to see:**
- Tasks he's now responsible for (Oly's science club, Tegner's swimming)
- Calendar with his new commitments
- Awareness growth in survey responses
- Mental load equalization

**Login as Kimberly to see:**
- Reduced task creation rate (85% → 60%)
- Mental load relief (87% → 58%)
- Stress reduction in surveys
- More energy for herself

**Login as Lillian to see:**
- Skepticism transformation (70% → 5%)
- Plant care habit streak
- Increased helpfulness with siblings
- Teen perspective on family changes

---

## ⚠️ Important Notes

**1. `--write` Flag is Required**
- `--dry-run` = Statistics only, no database writes
- `--write` = Actually populates Firestore

**2. Simulation Speed**
- Runs in ~0.05 seconds for entire year
- All data backdated to start from 2025-01-01
- Transformation phases progress realistically

**3. Data Persistence**
- All data remains in Firestore
- Can re-run simulation to generate new family
- Use different `--family-id` for multiple families

---

## 🚀 Commands Reference

```bash
# Create family with Firebase Auth accounts
node scripts/agents/create-agent-family.js

# Run simulation and WRITE all data to Firestore
node scripts/agents/simulate-family-year.js --write

# Use custom family ID
node scripts/agents/simulate-family-year.js --write --family-id=custom_family_001

# Dry run (test only, no database writes)
node scripts/agents/simulate-family-year.js --dry-run

# Run tests
node scripts/agents/test-agents.js
```

---

## ✅ Checklist: Full Data Population

- [ ] Run `node scripts/agents/create-agent-family.js`
- [ ] See "Firebase Auth user created" for all 5 members
- [ ] See login credentials displayed
- [ ] Run `node scripts/agents/simulate-family-year.js --write`
- [ ] See "SIMULATION COMPLETE" with full statistics
- [ ] Go to https://checkallie.com
- [ ] Log in with `stefan@palssonfamily.com` / `PalssonFamily2025!`
- [ ] Verify calendar has ~320 events
- [ ] Verify tasks tab has ~450 tasks
- [ ] Verify inbox has ~100 emails/SMS
- [ ] Verify all 5 discovery interviews completed
- [ ] Verify family meetings scheduled
- [ ] Verify habit streaks visible
- [ ] Switch to other family members (Kimberly, Lillian, etc.)
- [ ] Explore transformation journey!

---

**Status:** ✅ Ready to fill app with realistic family data!
**Login:** Any of the 5 accounts above with password `PalssonFamily2025!`
**URL:** https://checkallie.com
