# Palsson Bucks & Chore System Documentation

## Overview

The Palsson Bucks & Chore System is a comprehensive solution for family chore management, reward distribution, and virtual currency management. It provides tailored experiences for both parents and children, with an intuitive, role-based interface.

## Key Components

### 1. Chore Management

- **ChoreTab**: Shows chores organized by time of day (morning, afternoon, evening, anytime)
  - **Child View**: Kid-friendly interface with large, tappable chore cards
  - **Parent View**: Overview of all children's chore progress

- **ChoreAndRewardAdminTab**: Parent-only interface for managing chores
  - Create, edit, and delete chore templates
  - Import default chore templates
  - Set chore values and schedules
  - Approve or reject completed chores

### 2. Reward System

- **RewardsTab**: Virtual store for spending Palsson Bucks
  - **Child View**: Shop interface with categories and filtering
  - **Parent View**: Overview of pending reward requests and recent redemptions

- **Reward Management**: (In ChoreAndRewardAdminTab)
  - Create custom rewards for children
  - Set reward costs and availability
  - Schedule approved rewards in the calendar

### 3. Virtual Currency (Palsson Bucks)

- **BucksManagementTab**: Currency management system
  - **Child View**: Balance, transaction history, and stats
  - **Parent View**: Manage all children's accounts, adjust balances

- **Transaction Management**:
  - Automated transactions for chore completion
  - Manual parent adjustments (allowance, bonuses, penalties)
  - Reward purchases and refunds

## Data Structure

### Firestore Collections

1. **choreTemplates**: Base templates for chores
   - name, description, bucksValue, timeOfDay, icon, defaultDuration

2. **choreInstances**: Assigned chore instances for a specific child
   - templateId, childId, status, dueDate, completionDate, bucksEarned, parentApproval

3. **rewardTemplates**: Templates for available rewards
   - name, description, bucksValue, category, imageUrl, isActive

4. **rewardInstances**: Purchased reward instances
   - templateId, childId, status, purchaseDate, redemptionDate, bucksSpent

5. **bucksTransactions**: Transaction records for the virtual currency
   - childId, amount, type, description, timestamp, relatedItemId

## User Flows

### Child User Flow

1. View assigned chores on the Chore Chart tab
2. Complete a chore and submit for approval (with optional photo)
3. Receive Palsson Bucks upon parent approval
4. Browse rewards in the Reward Shop
5. Purchase rewards using Palsson Bucks
6. Track balance and transaction history

### Parent User Flow

1. Create and assign chores in the Admin tab
2. Review and approve completed chores
3. Create and manage available rewards
4. Review and approve reward purchase requests
5. Schedule approved rewards in the calendar
6. Manage children's Palsson Bucks accounts

## Integration Points

### Calendar Integration

The chore system integrates with the application's calendar system to:

- Schedule recurring chores
- Add approved rewards as calendar events
- Display chore deadlines on the family calendar

### Family Context Integration

- Uses FamilyContext to access family member information
- Filters content based on the selected user's role
- Manages visibility of features based on user permissions

## How to Use

### For Parents

1. **Setting Up Chores**:
   - Navigate to "Chore & Reward Admin" in the dashboard sidebar
   - Select the "Chores" tab
   - Click "Import Default Chores" or "Create New Chore"
   - Set values, icons, and assign to children

2. **Approving Completed Chores**:
   - Navigate to "Chore Chart" to see chores awaiting approval
   - Review completion photos if available
   - Approve or reject with optional comment

3. **Creating Rewards**:
   - In "Chore & Reward Admin", select "Rewards" tab
   - Import default rewards or create custom ones
   - Set Palsson Bucks costs and activate for children

4. **Managing Palsson Bucks**:
   - Navigate to "My Palsson Bucks" tab
   - View all children's balances and transaction history
   - Add bonus bucks or make adjustments as needed

### For Children

1. **Completing Chores**:
   - Navigate to "Chore Chart" in the dashboard sidebar
   - Find chores organized by time of day
   - Tap a chore card and click "Mark as Complete"
   - Take a photo of the completed chore (optional)
   - Submit for parent approval

2. **Buying Rewards**:
   - Navigate to "Reward Party" in the dashboard sidebar
   - Browse available rewards
   - Click on a reward to view details
   - Purchase with available Palsson Bucks

3. **Tracking Palsson Bucks**:
   - Navigate to "My Palsson Bucks" in the dashboard sidebar
   - View current balance and recent transactions
   - Set saving goals and track progress

## Best Practices

1. **For Parents**:
   - Set reasonable bucks values for chores based on difficulty and duration
   - Create a mix of daily, weekly, and occasional chores
   - Balance reward costs to incentivize saving while keeping rewards attainable
   - Use the notes field to clarify expectations for each chore
   - Approve chores promptly to maintain children's engagement

2. **Technical Considerations**:
   - Firestore indexes are required for complex queries (sortBy + filter)
   - Transaction operations are used for critical balance updates
   - Calendar integration requires appropriate permissions
   - Default data provides a starting point but should be customized

## Troubleshooting

1. **Missing Chores or Rewards**:
   - Check the "isActive" status in the admin panel
   - Verify the chore is assigned to the correct child
   - Ensure date filters aren't excluding relevant items
   - For missing rewards after import, refresh the page (the system has fallbacks for missing indexes)

2. **Balance Discrepancies**:
   - Review the transaction history in the BucksManagementTab
   - Check for pending approvals that haven't been processed
   - Verify all transactions have completed successfully

3. **Calendar Integration Issues**:
   - Ensure the calendar has appropriate permissions
   - Check EventContext is properly connected
   - Verify CalendarService is accessible to ChoreContext

4. **Firebase Index Issues**:
   - The system will display a banner when Firestore indexes are needed
   - Follow the link provided in the banner to create the required indexes
   - Until indexes are built, the system will use client-side filtering (may be slower but still works)
   - For optimal performance, create the indexes shown in the HOW_TO_DEPLOY_INDEXES.md file

## Future Enhancements

1. **Analytics Dashboard**: Track chore completion rates and reward preferences
2. **Advanced Scheduling**: Create more complex recurring chore patterns
3. **Achievement System**: Add badges and milestones for consistent behavior
4. **Reminder System**: Send notifications for upcoming or overdue chores
5. **Mobile Notifications**: Push alerts for chore approvals and reward status changes