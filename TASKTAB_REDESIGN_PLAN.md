# TasksTab Redesign Plan

This document outlines the plan for implementing the changes needed to align the TasksTab with the requirements specified in the my-tasks.md cheatsheet, while also refreshing the design to be more Notion-like.

## 1. Design Philosophy Changes

### Notion-Inspired Design Elements
- Clean, minimalist interface with ample whitespace
- Reduced color palette (primarily monochromatic with focused accent colors)
- Card-based UI with subtle shadows
- Typography: Sans-serif, clear hierarchy
- Interactive elements have subtle hover states

### Color Strategy
- Primary UI: Whites, light grays, dark grays for text
- Accents: Small, vibrant color elements only for:
  - Status indicators
  - Important buttons
  - Progress visualization
  - Categorization

## 2. Component Structure Improvements

### Create New Components
- `RevisedCycleJourney`: Replace current CycleJourney with cleaner design
- `HabitCard`: Extract habit display logic into dedicated component
- `RadarChartSection`: Wrapper for all radar chart related components
- `TasksTabHeader`: For the 3-step process visualization

### Implement Missing Components
- `FilterableRadarChart`: For workload imbalance visualization
- `HabitChangeDialog`: Confirmation dialog for changing habits mid-cycle
- `HabitCarryOverDialog`: UI for transitioning habits between cycles

### Custom Hooks
- `useHabitHelpers`: For all habit-related functionality
- `useCycleProgress`: For tracking the 3-step process

## 3. Feature Implementation Priorities

### High Priority
1. Complete 3-step process implementation
2. Habit management with 5-practice requirement
3. Proper radar chart integration with filtering
4. Role-based access control

### Medium Priority
1. Habit carry-over between cycles
2. Confirmation dialogs
3. Streak calculations and visualizations
4. Historical comparison in radar chart

### Low Priority
1. Animation refinements
2. Additional analytics
3. Extended documentation

## 4. Implementation Approach

### Phase 1: Core Structure and Design
- Create base Notion-style components
- Implement the 3-step process visualization
- Restructure the component hierarchy

### Phase 2: Radar Chart Implementation
- Integrate FilterableRadarChart
- Implement filtering UI
- Add historical comparison

### Phase 3: Habit Management
- Create useHabitHelpers hook
- Implement 5-practice tracking
- Add confirmation dialogs
- Build habit carry-over UI

### Phase 4: Polish and Edge Cases
- Handle offline support
- Optimize mobile views
- Add animations and celebrations
- Final design polish

## 5. Revised Component Structure

```
TasksTab
├── TasksTabHeader
│   └── RevisedCycleJourney (3-step process)
├── RadarChartSection
│   ├── FilterableRadarChart
│   ├── EnhancedImbalanceRadarChart
│   └── WorkloadRadarLayout
└── HabitSection
    ├── HabitList
    │   └── HabitCard
    ├── HabitChangeDialog
    ├── HabitCarryOverDialog
    └── HabitHelperSection
```

## 6. Design System Updates

### Typography
- Headings: 18-24px, font-weight: 600, color: #111827
- Body: 14-16px, font-weight: 400, color: #374151
- Labels: 12-14px, font-weight: 500, color: #6B7280

### Spacing
- Base unit: 4px
- Content padding: 16px or 24px
- Card margin: 16px

### Colors
- Background: #FFFFFF (cards), #F9FAFB (page)
- Text: #111827 (primary), #6B7280 (secondary)
- Borders: #E5E7EB
- Accent: #3B82F6 (blue), #10B981 (green), #F59E0B (amber)
- Status: #10B981 (success), #F59E0B (warning), #EF4444 (error)

### Interactive Elements
- Buttons: Minimal styling, rounded corners, subtle hover effects
- Hover states: Background lightens/darkens slightly
- Focus states: Subtle outline or glow

## 7. Performance Considerations

- Lazy-load heavy components
- Optimize radar chart rendering
- Use memo and callbacks for frequently re-rendered components
- Implement proper loading states