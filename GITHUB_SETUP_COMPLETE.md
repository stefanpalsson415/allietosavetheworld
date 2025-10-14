# GitHub Repository Setup Complete ✅

This document provides a quick reference for engineers joining the Allie project.

## 📦 Repository Overview

**Project**: Allie - AI-Powered Family Management Platform
**Tech Stack**: React 18, Firebase, Claude AI, Google Cloud Platform
**Status**: ✅ Production Ready (v11.14)
**Live URL**: https://checkallie.com

## 🚀 Quick Start for New Engineers

### 1. Get Repository Access

Contact stefan@checkallie.com for:
- GitHub repository access
- Firebase project access (parentload-ba995)
- Google Cloud Platform access
- Environment variable credentials

### 2. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd parentload-clean

# Install dependencies
npm install

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
firebase use parentload-ba995

# Copy environment template
cp .env.example .env
# Fill in credentials (contact stefan@checkallie.com)

# Start development
npm start
```

### 3. Verify Setup

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## 📁 Key Documents

1. **README.md** - Comprehensive project documentation
   - Architecture overview
   - Feature descriptions
   - Deployment guides
   - Database schema

2. **CONTRIBUTING.md** - Development guidelines
   - Code style guide
   - Testing requirements
   - PR process
   - Common tasks

3. **CLAUDE.md** - AI assistant guidelines
   - Project-specific patterns
   - Service architecture
   - Critical fixes history

4. **.env.example** - Environment configuration template

## 🏗️ Project Structure

```
parentload-clean/
├── src/
│   ├── components/         # React UI components
│   ├── services/          # Business logic
│   ├── contexts/          # React contexts
│   └── hooks/            # Custom hooks
├── functions/             # Firebase Cloud Functions
├── server/               # Cloud Run backend
├── tests/                # Test suites
└── docs/                # Additional documentation
```

## 🔑 Critical Information

### Production URLs
- **Live App**: https://checkallie.com
- **Firebase**: https://parentload-ba995.web.app
- **API**: https://allie-claude-api-4eckwlczwa-uc.a.run.app

### Firebase Project
- **Project ID**: parentload-ba995
- **Region**: us-central1 (primary), europe-west1 (functions)
- **Console**: https://console.firebase.google.com/project/parentload-ba995

### Key Services
- **Firestore**: NoSQL database
- **Firebase Auth**: User authentication
- **Cloud Functions**: Serverless backend
- **Cloud Run**: Containerized services
- **Redis**: Caching (1GB, us-central1-a)

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests with UI
npm run test:e2e:ui

# Regression tests (8 critical bugs)
npm run test:regression

# Smoke tests
npm run test:smoke
```

## 🚢 Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Backend (Cloud Functions)
```bash
firebase deploy --only functions
```

### Backend (Cloud Run)
```bash
gcloud run deploy allie-claude-api \
  --source server/ \
  --region us-central1 \
  --project parentload-ba995
```

## 🐛 Common Issues & Solutions

### 1. Firebase Permission Errors
```bash
firebase logout
firebase login
firebase use parentload-ba995
```

### 2. Build Failures
```bash
rm -rf build node_modules
npm install
npm run build
```

### 3. Test Failures
```bash
npm test -- --clearCache
```

### 4. Google Auth Issues
- Check OAuth configuration in Firebase Console
- Verify client ID in .env matches Google Cloud Console
- Ensure redirect URIs are configured correctly

## 📊 Recent Critical Fixes (October 2025)

### ✅ Google Auth Popup Flow (Oct 13)
- **Issue**: Blank screens during OAuth redirect
- **Fix**: Switched to popup flow
- **File**: `OnboardingFlow.jsx:806-817`

### ✅ Survey Initialization Error (Oct 13)
- **Issue**: TypeError on survey start
- **Fix**: Corrected QuantumKnowledgeGraph method call
- **File**: `DynamicSurveyGenerator.js:57-58`

### ✅ Onboarding White Screen (Oct 13)
- **Issue**: White screens during async operations
- **Fix**: Added loading state management
- **File**: `OnboardingFlow.jsx:847-1091`

See `CLAUDE.md` for full fix history.

## 🤝 Development Workflow

1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow code style in CONTRIBUTING.md
3. **Test**: Run `npm test` and `npm run test:e2e`
4. **Commit**: `git commit -m "feat: Your feature description"`
5. **Push**: `git push origin feature/your-feature`
6. **PR**: Create pull request on GitHub

## 📞 Getting Help

- **Technical Questions**: GitHub Discussions
- **Bugs**: Create GitHub Issue
- **Urgent**: stefan@checkallie.com
- **Firebase Issues**: #allie-firebase channel
- **Deployment**: #allie-deploy channel

## 🔒 Security Notes

- **NEVER commit .env files**
- **Use environment variables** for all secrets
- **Follow Firestore security rules** in `firestore.rules`
- **Request credentials** from stefan@checkallie.com
- **Test security rules** before deploying

## 📚 Additional Resources

### External Documentation
- [React Docs](https://react.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright Testing](https://playwright.dev/)

### Internal Documentation
- `CLAUDE.md` - AI assistant guidelines
- `GOOGLE_AUTH_ANALYSIS_COMPLETE.md` - OAuth implementation
- `MULTI_PERSON_INTERVIEW_SYSTEM_COMPLETE.md` - Interview system
- `PASSWORD_AUTH_TEST_SUMMARY.md` - Test coverage
- `BUG_FIXES_HISTORY.md` - Historical fixes

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase CLI configured
- [ ] Environment variables configured (.env)
- [ ] Development server starts (`npm start`)
- [ ] Tests pass (`npm test`)
- [ ] E2E tests run (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Firebase access verified
- [ ] Can access live app (https://checkallie.com)

## 🎯 First Tasks for New Engineers

### Option 1: Familiarization (Day 1-2)
1. Read README.md thoroughly
2. Run the app locally
3. Explore the codebase structure
4. Run test suites
5. Review CLAUDE.md for context

### Option 2: Quick Win (Day 1)
1. Fix a small bug from GitHub Issues
2. Add a unit test
3. Submit your first PR

### Option 3: Feature Work (Week 1)
1. Pick a feature from backlog
2. Design solution
3. Implement with tests
4. Submit PR with documentation

## 📝 Repository Statistics

- **Total Lines**: ~150,000+
- **Components**: 100+
- **Services**: 30+
- **Test Coverage**: 72%+
- **Dependencies**: 47 packages
- **Last Major Refactor**: Oct 2, 2025 (AllieChat)
- **Production Uptime**: 99.9%

## 🎉 Welcome to the Team!

This repository represents months of work building a comprehensive family management platform. We're excited to have you join us!

Key principles:
- **Quality over speed** - Write clean, tested code
- **Documentation matters** - Update docs with changes
- **Test everything** - Unit + integration + E2E
- **Ask questions** - Better to ask than guess
- **Share knowledge** - Help others learn

Ready to contribute? Start with CONTRIBUTING.md and pick your first issue!

---

**Setup Guide Version**: 1.0
**Last Updated**: October 13, 2025
**Contact**: stefan@checkallie.com
**Status**: ✅ Ready for Production Development
