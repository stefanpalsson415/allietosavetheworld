# Pre-Deletion Checklist

## Before Deleting All User Data

### 1. **Backup Critical Configuration**
- [ ] Firebase service account keys
- [ ] Environment variables (.env files)
- [ ] API keys (Claude, SendGrid, Twilio, Google Maps)
- [ ] Firebase project configuration
- [ ] Domain/URL configurations

### 2. **Document Current Issues**
Main problems to fix after reset:
- Multiple overlapping event systems (EventStore, CalendarService, MasterCalendarService)
- ID confusion (id vs firestoreId vs universalId)
- Too many competing contexts (EventContext, NewEventContext, UnifiedEventContext)
- Circuit breaker triggering too frequently
- Auth context property naming issues

### 3. **Save Working Components**
These components are working and should be preserved:
- User authentication flow
- Family creation and management
- Allie Chat core functionality
- Document upload and OCR
- Knowledge graph visualization
- Basic dashboard structure

### 4. **Create Test Data Script**
After deletion, you'll need test data. Consider creating a script to:
- Create test families
- Add sample family members
- Create test events
- Add sample habits
- Generate test messages

### 5. **Firestore Indexes to Preserve**
Run this to export your current indexes:
```bash
firebase firestore:indexes > firestore-indexes-backup.json
```

### 6. **Clean Architecture Plan**
After reset, implement ONE system for each feature:
- **Events**: Use only MasterCalendarService
- **State**: Use React Context OR Redux, not both
- **IDs**: Standardize on firestoreId everywhere
- **Error Handling**: Consistent try-catch patterns

### 7. **Remove These Files/Folders**
After backing up, these can be deleted:
- All fix-*.js files in public/
- All test-*.js files in public/
- Duplicate service files
- TypeScript remnants (.ts files)

### 8. **Testing Strategy Post-Reset**
1. Test auth flow first
2. Create a family
3. Add one event manually
4. Test event CRUD operations
5. Test Allie Chat integration
6. Add complexity gradually

### 9. **Performance Optimizations**
- Implement proper query pagination
- Add debouncing to real-time listeners
- Use React.memo for expensive components
- Implement proper loading states

### 10. **Development Workflow**
Moving forward:
- One feature at a time
- Test each feature completely before moving on
- No "quick fixes" - only permanent solutions
- Document major decisions
- Regular git commits with clear messages

## Delete User Data Commands

Once you're ready, here are the commands to delete all data:

### Option 1: Delete Specific Collections
```bash
# Run the backup script first if you haven't
node backup-firestore-data.js

# Then delete collections one by one
firebase firestore:delete users --recursive --yes
firebase firestore:delete families --recursive --yes
firebase firestore:delete events --recursive --yes
firebase firestore:delete habits --recursive --yes
firebase firestore:delete messages --recursive --yes
firebase firestore:delete documents --recursive --yes
firebase firestore:delete tasks --recursive --yes
```

### Option 2: Delete All Auth Users
```bash
# This will delete all authentication accounts
firebase auth:export users-backup.json
# Then manually delete users in Firebase Console
```

### Option 3: Full Reset (Nuclear Option)
1. Go to Firebase Console
2. Project Settings > General
3. Scroll to bottom
4. "Delete Project" (This deletes EVERYTHING)
5. Create a new Firebase project
6. Re-run `firebase init`

## Post-Deletion First Steps

1. Create your user account
2. Create a test family
3. Test basic calendar functionality
4. Verify Allie Chat works
5. Add one habit
6. Test one document upload

Good luck with the fresh start! 🚀