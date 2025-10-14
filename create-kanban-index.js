// Script to create the missing Firestore index for kanban tasks

console.log(`
The Firestore query for kanban tasks requires a composite index.

Please create the index by visiting this URL:
https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=ClRwcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9rYW5iYW5UYXNrcy9pbmRleGVzL18QARoMCghmYW1pbHlJZBABGgwKCHBvc2l0aW9uEAEaDAoIX19uYW1lX18QAQ

Or manually create an index with:
- Collection ID: kanbanTasks
- Fields:
  1. familyId (Ascending)
  2. position (Ascending)
  3. __name__ (Ascending)

This will fix the "failed-precondition" error in the task board.
`);