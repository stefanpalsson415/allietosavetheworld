# Driving/Transportation Habit Fix ✅

## Issue
When creating a habit for "Driving to Activities", Allie was asking for a "2-minute version" which doesn't make sense - you can't do a 2-minute version of driving somewhere.

## Solution
Added special handling for driving/transportation habits that reframes them as preparation habits instead.

## Changes Made

### 1. **Detection of Driving Habits**
```javascript
const isDrivingHabit = habitSetupState.habitTitle.toLowerCase().includes('driv') || 
                      habitSetupState.habitTitle.toLowerCase().includes('transport');
```

### 2. **Updated "Make it Easy" Message**
For driving habits, Allie now says:
> "Since this involves driving, let's focus on the preparation aspect. What's the quickest prep routine that would make departures smoother?"

Instead of asking for a "2-minute version of driving"

### 3. **Better Suggestions for Driving Habits**
When detected as a driving habit, suggestions change to preparation tasks:
- "Check tomorrow's activity schedule and set GPS"
- "Pack kids' activity bags the night before"
- "Prep car snacks and water bottles"
- "Review pickup/dropoff times in family calendar"
- "Set out car keys by door"
- "Quick car check: gas level and car seats"

### 4. **Updated Default Fallbacks**
If personalized suggestions fail, driving habits get appropriate defaults:
- "Check tomorrow's schedule"
- "Pack activity bags"
- "Prep car snacks"
- "Set out car keys"

## Result
Now when you create a habit for driving/transportation:
1. Allie recognizes it's about transportation
2. Reframes it as a preparation habit
3. Provides relevant suggestions for making departures smoother
4. The "2-minute version" makes sense (e.g., "check schedule and pack bags")

## Alternative Approach
Consider guiding users to create habits like:
- "Evening Activity Prep" instead of "Driving to Activities"
- "Morning Departure Routine" instead of "School Drop-off"
- "Weekend Activity Planning" instead of "Weekend Driving"

This naturally fits the habit framework better while achieving the same goal of making transportation smoother.