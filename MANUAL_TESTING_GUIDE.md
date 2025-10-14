# Manual Testing Guide - Ready for User Testing

Since automated tests require authentication setup, here's a comprehensive manual testing approach you can do right now.

## Prerequisites
1. **Make sure you're logged in** at http://localhost:3000
2. **Select your family member** (Stefan)
3. **Have the dashboard loaded**

## Quick Smoke Test (5 minutes)

### 1. **Header Layout Test**
✅ **Check:** "Home" title appears on the LEFT side of header  
✅ **Check:** Chat button and avatar appear on the RIGHT side of header  
✅ **Check:** Header layout looks clean and professional (Notion-style)

### 2. **Navigation Test**
Click each tab in the sidebar and verify it loads:

✅ **Home** (`/dashboard?tab=home`)
- Family Overview section
- Weekly Progress calendar  
- "Why families trust us" trust metrics
- Allie chat section

✅ **Balance & Habits** (`/dashboard?tab=tasks`)
- Task/habit interface loads
- Week selector works

✅ **Family Calendar** (`/dashboard?tab=calendar`)
- Calendar grid displays
- Can navigate months/weeks
- "Add Event" functionality

✅ **Document Hub** (`/dashboard?tab=documents`)
- Document library interface
- Upload functionality

✅ **Knowledge Graph** (`/dashboard?tab=knowledge`)
- Graph visualization loads

### 3. **Kid-Friendly Features** (if visible)
✅ **Chore Chart** (`/dashboard?tab=chores`)  
✅ **Reward Party** (`/dashboard?tab=rewards`)  
✅ **Palsson Bucks** (`/dashboard?tab=bucks`)

### 4. **Admin Features** (parent only)
✅ **Chore & Reward Admin** (`/dashboard?tab=chore-admin`)

### 5. **Critical Functionality Test**

#### **Transparency Report Test:**
1. Go to Home tab
2. Scroll to "Why families trust us" section
3. Click "View full transparency report" button
4. ✅ **Check:** Allie chat opens
5. ✅ **Check:** Report shows "2 parents and 3 kids in the Palsson household"
6. ✅ **Check:** Report is short and conversational (not long and corporate)

#### **Family Member Switching:**
1. Click the user dropdown in sidebar (shows your name + "Palsson Family")
2. ✅ **Check:** Dropdown opens with family members listed
3. Try switching to another family member (Kimberly)
4. ✅ **Check:** Confirmation dialog appears
5. ✅ **Check:** User context changes after switching

#### **Chat Functionality:**
1. Click "Chat with Allie" button (various locations)
2. ✅ **Check:** Chat drawer opens on the right
3. Type a test message and send
4. ✅ **Check:** Allie responds
5. ✅ **Check:** Can close chat drawer

## Responsive Design Test (5 minutes)

### **Mobile Layout** (resize browser to ~375px width)
✅ **Check:** Sidebar collapses to mobile menu  
✅ **Check:** Header adjusts for mobile  
✅ **Check:** All content remains usable  

### **Tablet Layout** (resize to ~768px width)
✅ **Check:** Layout adjusts appropriately  
✅ **Check:** Navigation remains accessible  

### **Desktop Layout** (full screen)
✅ **Check:** Full sidebar navigation visible  
✅ **Check:** Chat drawer doesn't overlap content  

## Critical CRUD Operations Test (10 minutes)

### **Calendar Events:**
1. Go to Family Calendar tab
2. Click "Add Event" or "+" button
3. ✅ **Create:** Fill out event form and save
4. ✅ **Read:** Event appears on calendar
5. ✅ **Edit:** Click event, modify details, save
6. ✅ **Delete:** Delete the test event (with confirmation)

### **Tasks/Chores:**
1. Go to Balance & Habits tab
2. ✅ **Create:** Add a new task/chore
3. ✅ **Complete:** Mark a task as complete
4. ✅ **Delete:** Remove a task (if possible)

### **Admin Templates** (if you're a parent):
1. Go to Chore & Reward Admin
2. ✅ **Create:** Add new template
3. ✅ **Edit:** Modify existing template
4. ✅ **Delete:** Remove test template

## Error Handling Test (5 minutes)

### **Navigation Errors:**
✅ Go to invalid URL: `/dashboard?tab=nonexistent`  
✅ **Check:** App handles gracefully (doesn't crash)

### **Browser Actions:**
✅ **Refresh page** - data persists  
✅ **Browser back/forward** - navigation works  
✅ **Multiple tabs** - state is consistent  

## Performance Test (3 minutes)

✅ **Initial load time** - under 3 seconds  
✅ **Tab switching** - responsive  
✅ **Chat responses** - timely  
✅ **Large calendar views** - smooth scrolling  

## Ready for User Testing Checklist

Mark these as complete before user testing:

### **Core Functionality:**
- [ ] All tabs load without errors
- [ ] Navigation works smoothly
- [ ] Family member switching works
- [ ] Chat functionality works
- [ ] Transparency report shows correct data

### **User Experience:**
- [ ] Design looks clean and professional (Notion-style)
- [ ] Header layout is correct (Home left, buttons right)
- [ ] No obvious bugs or broken features
- [ ] Responsive design works on different screen sizes

### **Data & Content:**
- [ ] Transparency report is personalized (2 parents, 3 kids)
- [ ] Family data appears correctly
- [ ] All text is appropriate and helpful

### **Critical Operations:**
- [ ] Can create calendar events
- [ ] Can complete tasks/chores
- [ ] Can access all family member profiles
- [ ] Can use chat functionality

## If You Find Issues:

**For each issue found:**
1. **Note the exact steps** to reproduce
2. **Take a screenshot** if visual
3. **Note which browser/device**
4. **Rate severity:** Critical / High / Medium / Low

**Report format:**
```
Issue: [Brief description]
Steps: 1. Go to... 2. Click... 3. Expected... 4. Actual...
Severity: [Critical/High/Medium/Low]
Browser: [Chrome/Firefox/Safari]
Screenshot: [if applicable]
```

## Quick Test Script

If you want to do this quickly, here's a 10-minute version:

1. **🏠 Home tab** - Check layout, click transparency report
2. **⚖️ Balance & Habits** - Switch between family members
3. **📅 Calendar** - Create and delete a test event
4. **💬 Chat** - Send a message to Allie
5. **📱 Mobile** - Resize browser and check mobile layout

That's it! This covers the most critical functionality for user testing.