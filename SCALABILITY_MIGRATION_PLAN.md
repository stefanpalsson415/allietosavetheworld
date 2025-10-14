# Scalability Migration Plan - Priority #1

## The Problem
The app currently uses unbounded real-time listeners that will cause it to crash with 1000 families. Every component loads ALL data without limits.

## The Solution
Migrate to ScalableDataService.js which provides:
- Pagination (50 items default)
- Caching (5-minute TTL)
- Limited concurrent listeners (10 per family)
- Proper cleanup

## Migration Priority Order

### Phase 1 - Critical Components (Do First)
1. **AIKanbanBoard.jsx** - Replace unbounded kanbanTasks query
2. **EventStore.js** - Add date range limits for calendar events
3. **ChoreService.js** - Paginate chore instances
4. **FamilyContext.js** - Remove real-time sync of ALL data

### Phase 2 - High Impact
5. **CalendarProvider.js** - Only load current month events
6. **DocumentHub components** - Paginate documents
7. **ChatPersistenceService.js** - Limit chat history

### Phase 3 - Medium Impact
8. **Survey components** - Load only active surveys
9. **Knowledge Graph** - Implement virtual scrolling
10. **Activity tracking** - Archive old data

## Example Migration

### Before (AIKanbanBoard.jsx):
```javascript
const q = query(
  collection(db, "kanbanTasks"),
  where("familyId", "==", familyId)
);
const unsubscribe = onSnapshot(q, (snapshot) => {
  // Loads ALL tasks - will crash with many families
});
```

### After:
```javascript
import ScalableDataService from '../../services/ScalableDataService';

// In useEffect:
const unsubscribe = ScalableDataService.subscribeToCollection(
  'kanbanTasks',
  familyId,
  (tasks) => {
    setTasks(tasks); // Only 20 most recent tasks
    setLoading(false);
  },
  {
    limit: 20,
    orderByField: 'updatedAt',
    filters: [where('status', '!=', 'archived')]
  }
);

return () => unsubscribe();
```

## Testing Plan
1. Create test family with 10,000+ events
2. Monitor memory usage before/after
3. Test with 100 concurrent connections
4. Verify pagination works correctly

## Success Metrics
- Page load time < 2 seconds with 1000 items
- Memory usage < 100MB per family
- No Firebase connection limit errors
- 90% reduction in read operations

## Timeline
- Week 1: Migrate Phase 1 components
- Week 2: Test and optimize
- Week 3: Complete remaining components

This is the #1 priority for scaling to 1000 families.