# Contributing to Allie

Thank you for your interest in contributing to Allie! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Testing Requirements](#testing-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Common Tasks](#common-tasks)

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Firebase CLI >= 13.x
- Git
- Access to Firebase project (parentload-ba995)
- Access to Google Cloud Platform

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd parentload-clean
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   ```bash
   firebase login
   firebase use parentload-ba995
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Fill in your credentials
   ```

5. **Start development server**:
   ```bash
   npm start
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/school-calendar-sync`)
- `fix/` - Bug fixes (e.g., `fix/calendar-timezone-issue`)
- `refactor/` - Code refactoring (e.g., `refactor/chat-component`)
- `docs/` - Documentation updates (e.g., `docs/api-endpoints`)
- `test/` - Test additions/modifications (e.g., `test/onboarding-flow`)

### Workflow Steps

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write code following our style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm test
   npm run test:e2e
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: Add school calendar integration"
   ```

5. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Code Style Guidelines

### React Components

```javascript
// ✅ GOOD: Functional components with descriptive names
import React, { useState, useEffect } from 'react';

const SchoolCalendarWidget = ({ familyId, childId }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, [familyId, childId]);

  const loadEvents = async () => {
    // Implementation
  };

  return (
    <div className="calendar-widget">
      {/* JSX */}
    </div>
  );
};

export default SchoolCalendarWidget;
```

### Service Classes

```javascript
// ✅ GOOD: Services as singleton classes
class SchoolCalendarSyncService {
  constructor() {
    this.config = {};
  }

  async syncCalendar(calendarUrl) {
    try {
      // Implementation
      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SchoolCalendarSyncService();
```

### Import Order

1. React imports
2. Third-party libraries
3. Local services
4. Local components
5. Styles

```javascript
// ✅ GOOD: Organized imports
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import DatabaseService from '../../services/DatabaseService';
import CalendarWidget from '../calendar/CalendarWidget';
import './styles.css';
```

### Naming Conventions

- **Components**: PascalCase (e.g., `SchoolCalendarSync.jsx`)
- **Services**: PascalCase (e.g., `DatabaseService.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCalendarEvents.js`)
- **Variables**: camelCase (e.g., `eventData`, `familyId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Error Handling

Always use try-catch for async operations:

```javascript
// ✅ GOOD: Comprehensive error handling
const syncCalendar = async () => {
  try {
    const result = await schoolCalendarService.sync(calendarUrl);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setEvents(result.events);

  } catch (error) {
    console.error('Calendar sync failed:', error);
    setError('Failed to sync calendar. Please try again.');
  }
};
```

### Tailwind CSS

Use Tailwind utility classes for styling:

```jsx
// ✅ GOOD: Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">Events</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Sync
  </button>
</div>
```

## Testing Requirements

### Unit Tests

All new services and utilities must have unit tests:

```javascript
// SchoolCalendarSyncService.test.js
import schoolCalendarService from '../services/SchoolCalendarSyncService';

describe('SchoolCalendarSyncService', () => {
  test('should fetch and parse iCal feed', async () => {
    const result = await schoolCalendarService.fetchICalFeed(testUrl);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle invalid URLs', async () => {
    const result = await schoolCalendarService.fetchICalFeed('invalid');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

Critical flows must have integration tests:

```javascript
// e2e/school-calendar-sync.spec.js
import { test, expect } from '@playwright/test';

test('should add and sync school calendar', async ({ page }) => {
  await page.goto('/settings/calendars');
  await page.click('button:has-text("Add School Calendar")');
  await page.fill('input[name="calendarUrl"]', testUrl);
  await page.click('button:has-text("Save")');

  await expect(page.locator('.calendar-success')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Regression tests
npm run test:regression

# Specific test file
npm test SchoolCalendarSyncService.test.js
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**:
   ```bash
   npm test
   npm run test:e2e
   ```

2. **Build successfully**:
   ```bash
   npm run build
   ```

3. **Update documentation** if needed

4. **Add/update tests** for new functionality

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Related Issues
Fixes #(issue number)

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated checks** must pass (tests, build)
2. **Code review** by at least one team member
3. **Manual testing** for UI changes
4. **Approval** required before merge

## Common Tasks

### Adding a New Service

1. Create service file: `src/services/YourService.js`
2. Implement as singleton class
3. Add error handling
4. Export singleton instance
5. Write unit tests
6. Update documentation

### Adding a New Component

1. Create component: `src/components/category/YourComponent.jsx`
2. Use functional component with hooks
3. Add PropTypes or JSDoc
4. Style with Tailwind
5. Write tests
6. Update parent component

### Deploying Changes

#### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

#### Backend (Cloud Functions)
```bash
firebase deploy --only functions
```

#### Backend (Cloud Run)
```bash
gcloud run deploy allie-claude-api \
  --source server/ \
  --region us-central1 \
  --project parentload-ba995
```

### Database Migrations

When adding new Firestore collections or fields:

1. Update `firestore.rules`
2. Add indexes to `firestore.indexes.json`
3. Deploy rules: `firebase deploy --only firestore:rules`
4. Deploy indexes: `firebase deploy --only firestore:indexes`
5. Document schema changes in README.md

### Troubleshooting

#### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Build Issues

```bash
# Clear build cache
rm -rf build node_modules
npm install
npm run build
```

#### Firebase Authentication Issues

```bash
# Re-login to Firebase
firebase logout
firebase login
firebase use parentload-ba995
```

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Security**: Email stefan@checkallie.com
- **Urgent**: Slack #allie-dev channel

## Resources

- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev/)

---

**Last Updated**: October 13, 2025

Thank you for contributing to Allie! 🎉
