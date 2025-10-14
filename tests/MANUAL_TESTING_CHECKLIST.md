# Manual Testing Checklist for User Testing

This comprehensive checklist ensures all functionality is tested before user testing sessions.

## 🏠 Basic Navigation & Layout

### Header & Navigation
- [ ] "Home" title appears on the left side of header
- [ ] Chat button and user avatar appear on the right side of header
- [ ] Header layout is consistent across all tabs
- [ ] Sidebar navigation is visible and accessible
- [ ] All navigation items are clickable and functional

### Family Member Switching
- [ ] User dropdown opens when clicked
- [ ] All family members are listed (Stefan, Kimberly, Lilly, Olaf, Tegner)
- [ ] Switching between family members works
- [ ] Confirmation dialog appears when switching users
- [ ] User context changes after switching (name, role, permissions)

## 📱 Tab Functionality Testing

### 🏠 Home Tab (`/dashboard?tab=home`)
- [ ] Family Overview section loads
- [ ] Allie suggestions appear
- [ ] Weekly Progress calendar shows correctly
- [ ] Weekly stats show real data (Tasks Done, Events Today, Day Streak)
- [ ] "Why families trust us" section appears above Allie chat
- [ ] Transparency metrics show (94%, 92%, etc.)
- [ ] Questions Asked and Sources Cited numbers appear
- [ ] "View full transparency report" button works
- [ ] Clicking transparency button opens Allie chat with proper message
- [ ] Allie responds with personalized transparency report
- [ ] "Hi, I'm Allie!" chat section appears below trust metrics
- [ ] "Chat with Allie" button opens chat drawer
- [ ] Family Snapshot shows realistic progress bars
- [ ] All family member selector pills work

### ⚖️ Balance & Habits Tab (`/dashboard?tab=tasks`)
- [ ] Week selector works (Week 1, Week 2, Week 3, etc.)
- [ ] User can switch between family members
- [ ] Habits section loads for selected user
- [ ] Tasks/chores appear for selected user
- [ ] Progress tracking works
- [ ] Completion buttons function
- [ ] Habit cycling and streak tracking
- [ ] Due dates and calendar integration
- [ ] Can mark tasks as complete
- [ ] Completion affects progress tracking

### 📋 Task Board Tab (`/dashboard?tab=taskboard`)
- [ ] Kanban board layout appears
- [ ] Columns for different task states
- [ ] Tasks can be dragged between columns
- [ ] Add new task functionality
- [ ] Task cards show proper information
- [ ] Filtering and sorting options

### 👨‍👩‍👧‍👦 Family Dashboard Tab (`/dashboard?tab=dashboard`)
- [ ] Family overview statistics
- [ ] Member-specific insights
- [ ] Progress tracking across family
- [ ] Goal setting and tracking
- [ ] Family meeting scheduler

### 📅 Family Calendar Tab (`/dashboard?tab=calendar`)
- [ ] Calendar grid displays correctly
- [ ] Can navigate between months/weeks
- [ ] "Add Event" button works
- [ ] Event creation form opens
- [ ] Can fill out event details (title, date, time, attendees)
- [ ] Events save successfully
- [ ] Events appear on calendar
- [ ] Can click on existing events
- [ ] Event details modal opens
- [ ] Can edit existing events
- [ ] Can delete events (with confirmation)
- [ ] Different event types/categories
- [ ] Recurring event functionality
- [ ] Integration with family member schedules

### 📁 Document Hub Tab (`/dashboard?tab=documents`)
- [ ] Document library loads
- [ ] File upload functionality works
- [ ] Can upload different file types
- [ ] Documents appear after upload
- [ ] Can view/preview documents
- [ ] Document organization/folders
- [ ] Search functionality
- [ ] Can delete documents
- [ ] Document sharing with family members

### 🧠 Knowledge Graph Tab (`/dashboard?tab=knowledge`)
- [ ] Graph visualization loads
- [ ] Nodes and connections appear
- [ ] Interactive navigation
- [ ] Can explore family relationships
- [ ] Data insights and patterns
- [ ] Filtering and search options

## 👶 Kid-Friendly Features

### 📝 Chore Chart Tab (`/dashboard?tab=chores`)
- [ ] Kid-friendly interface loads
- [ ] Large, colorful chore cards
- [ ] Completion buttons are easy to click
- [ ] Progress visualization for kids
- [ ] Reward earning feedback
- [ ] Age-appropriate language and design

### 🎉 Reward Party Tab (`/dashboard?tab=rewards`)
- [ ] Available rewards display
- [ ] Kid can see current balance
- [ ] Reward claiming process
- [ ] Confirmation dialogs
- [ ] Balance updates after claiming
- [ ] Reward history/achievements

### 💰 My Palsson Bucks Tab (`/dashboard?tab=bucks`)
- [ ] Current balance displays prominently
- [ ] Transaction history
- [ ] Earning opportunities
- [ ] Spending options
- [ ] Balance updates in real-time
- [ ] Kid-friendly money visualization

## 🔧 Admin Features

### ⚙️ Chore & Reward Admin Tab (`/dashboard?tab=chore-admin`)
- [ ] Admin interface loads (parent access only)
- [ ] Can create new chore templates
- [ ] Can edit existing templates
- [ ] Can delete templates (with confirmation)
- [ ] Can create new reward templates
- [ ] Can set reward costs and availability
- [ ] Can manage family member assignments
- [ ] Bulk operations work
- [ ] Changes reflect immediately in kid interfaces

## 🤖 Allie Chat Testing

### Chat Functionality
- [ ] Chat drawer opens from multiple entry points
- [ ] Chat input field accepts text
- [ ] Send button/Enter key works
- [ ] Messages appear in chat history
- [ ] Allie responds to messages
- [ ] Chat history persists across sessions
- [ ] Can close chat drawer
- [ ] Chat drawer resizes content appropriately

### Specific Chat Features
- [ ] Transparency report request works properly
- [ ] Family-specific information appears in responses
- [ ] Context awareness (knows current user, family composition)
- [ ] Helpful suggestions and recommendations
- [ ] Error handling for failed responses

## 🌐 Responsive Design Testing

### Mobile Testing (< 768px)
- [ ] Sidebar collapses to mobile menu
- [ ] Header adjusts for mobile
- [ ] All tabs accessible on mobile
- [ ] Touch interactions work
- [ ] Text remains readable
- [ ] Buttons are appropriately sized
- [ ] Chat drawer works on mobile

### Tablet Testing (768px - 1024px)
- [ ] Layout adjusts appropriately
- [ ] Sidebar width adjusts
- [ ] Content remains usable
- [ ] Touch interactions optimized

### Desktop Testing (> 1024px)
- [ ] Full sidebar navigation
- [ ] Proper spacing and layout
- [ ] Chat drawer doesn't overlap content
- [ ] Keyboard navigation works

## 🔄 CRUD Operations Testing

### Creating Data
- [ ] Can create new calendar events
- [ ] Can create new tasks/chores
- [ ] Can create new templates (admin)
- [ ] Can upload new documents
- [ ] Form validation works properly
- [ ] Required fields are enforced

### Reading/Viewing Data
- [ ] Data displays correctly after creation
- [ ] Lists and grids show proper information
- [ ] Filtering and search work
- [ ] Pagination works for large datasets
- [ ] Data refreshes appropriately

### Updating Data
- [ ] Can edit calendar events
- [ ] Can modify task details
- [ ] Can update templates
- [ ] Changes save successfully
- [ ] Updates reflect immediately

### Deleting Data
- [ ] Delete buttons are clearly marked
- [ ] Confirmation dialogs appear
- [ ] Can cancel delete operations
- [ ] Successful deletion removes data
- [ ] Related data is handled properly
- [ ] No broken references after deletion

## 🔒 Permissions & Security Testing

### Role-Based Access
- [ ] Parents can access admin features
- [ ] Kids cannot access admin features
- [ ] Family member data is isolated appropriately
- [ ] Switching users enforces proper permissions

### Data Privacy
- [ ] Family data is not shared between families
- [ ] Personal information is protected
- [ ] Chat history is private
- [ ] Document access is controlled

## 🚨 Error Handling & Edge Cases

### Network Issues
- [ ] Graceful handling of connection loss
- [ ] Appropriate error messages
- [ ] Retry mechanisms work
- [ ] Offline state handling

### Invalid Data
- [ ] Form validation prevents invalid submissions
- [ ] Error messages are helpful
- [ ] Recovery from error states
- [ ] Data consistency maintained

### Browser Issues
- [ ] Works across different browsers
- [ ] Handles browser back/forward
- [ ] Local storage works properly
- [ ] No memory leaks during extended use

## 📊 Performance Testing

### Load Times
- [ ] Initial page load is reasonable (< 3 seconds)
- [ ] Tab switching is responsive
- [ ] Search results appear quickly
- [ ] Large datasets load efficiently

### Responsiveness
- [ ] UI remains responsive during operations
- [ ] No blocking of user interactions
- [ ] Smooth animations and transitions
- [ ] Proper loading states

## 🎯 User Experience Testing

### Discoverability
- [ ] New users can find key features
- [ ] Navigation is intuitive
- [ ] Important actions are prominent
- [ ] Help/guidance is available when needed

### Consistency
- [ ] Design patterns are consistent
- [ ] Language and terminology consistent
- [ ] Interaction patterns predictable
- [ ] Visual hierarchy clear

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast adequate
- [ ] Font sizes readable
- [ ] Alternative text for images

## 📝 Pre-User Testing Checklist

### Data Preparation
- [ ] Demo family data is set up
- [ ] Sample events, tasks, and documents created
- [ ] All family members have appropriate data
- [ ] Realistic usage scenarios prepared

### Environment Setup
- [ ] Application is running on stable server
- [ ] All services are operational
- [ ] Backup and recovery plans in place
- [ ] Monitoring and logging enabled

### Testing Scenarios
- [ ] New user onboarding flow prepared
- [ ] Common use case scenarios documented
- [ ] Edge case testing scenarios ready
- [ ] Performance benchmarks established

## 🎬 Test Execution Commands

### Run All Automated Tests
```bash
# Comprehensive UI tests
npx playwright test comprehensive-ui-tests.spec.js

# CRUD operations tests  
npx playwright test crud-operations-tests.spec.js

# Existing calendar tests
npx playwright test calendar-crud.spec.js

# Run all tests
npx playwright test

# Run tests in headed mode (watch tests run)
npx playwright test --headed

# Run tests with debugging
npx playwright test --debug
```

### Generate Test Reports
```bash
# Generate HTML report
npx playwright show-report

# Run with video recording
npx playwright test --config=playwright.config.js
```

## 📋 Sign-off Checklist

Before declaring the application ready for user testing:

- [ ] All critical functionality tested and working
- [ ] No blocking bugs identified
- [ ] Performance meets acceptable standards
- [ ] Security considerations addressed
- [ ] User experience flows validated
- [ ] Automated test suite passing
- [ ] Manual testing checklist completed
- [ ] Demo environment stable and reliable
- [ ] User testing scenarios prepared
- [ ] Feedback collection mechanism ready