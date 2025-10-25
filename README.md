# Allie - AI-Powered Family Management Platform

> **Reducing mental load through autonomous AI agents**

Allie is a comprehensive family management platform that uses AI to help families balance workload, manage schedules, and maintain harmony. Built with React, Firebase, and Claude AI.

[![Production](https://img.shields.io/badge/Production-Live-brightgreen)](https://checkallie.com)
[![Firebase](https://img.shields.io/badge/Firebase-Deployed-orange)](https://parentload-ba995.web.app)
[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/82hJfozkeGv7PMpWEzTa7J/parentload-clean/tree/main.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/circleci/82hJfozkeGv7PMpWEzTa7J/parentload-clean/tree/main)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

## 🎯 Project Overview

**Allie** provides families with:
- 📅 **Smart Calendar Integration** - Bidirectional sync with Google Calendar
- 🤖 **AI Assistant** - Claude-powered conversational agent (Opus 4.1 for internal, Sonnet 3.5 for sales)
- 🎤 **Voice Interface** - Web Speech API + OpenAI TTS-1-HD (Nova voice)
- 📊 **Family Dashboard** - Unified view of tasks, events, and responsibilities
- 💬 **Multi-Person Interviews** - Automatic speaker identification for family discussions
- 📝 **Smart Surveys** - Context-aware workload assessment
- 🎯 **Task Management** - Kanban-style boards with AI suggestions
- 📧 **Email/SMS Integration** - Unified inbox with auto-processing

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern UI with hooks and concurrent features
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router v6** - Client-side routing
- **Firebase SDK** - Real-time database and authentication

### Backend Stack
- **Firebase Firestore** - NoSQL database
- **Firebase Cloud Functions** - Serverless backend (Node.js)
- **Google Cloud Run** - Containerized backend services
- **Redis** - Caching layer (1GB, us-central1-a)
- **Pinecone** - Vector database for AI memory

### AI & ML
- **Claude API** - Opus 4.1 (internal), Sonnet 3.5 (sales)
- **OpenAI TTS-1-HD** - Premium voice synthesis (Nova, 0.95x speed)
- **Web Speech API** - Voice input with wake word detection
- **QuantumKnowledgeGraph** - 4-tier memory system (working, short, long, episodic)

### Infrastructure
- **GCP Project**: `parentload-ba995`
- **Firebase Hosting**: https://parentload-ba995.web.app
- **Custom Domain**: https://checkallie.com
- **Cloud Run API**: https://allie-claude-api-4eckwlczwa-uc.a.run.app
- **Region**: us-central1 (primary), europe-west1 (functions)

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.x
npm >= 9.x
firebase-tools >= 13.x
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd parentload-clean

# Install dependencies
npm install

# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=parentload-ba995.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=parentload-ba995
REACT_APP_FIREBASE_STORAGE_BUCKET=parentload-ba995.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google APIs
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
REACT_APP_GOOGLE_CLIENT_ID=363935868004-obmgvsk5s9m55rkov4bumpnissnb1sm8.apps.googleusercontent.com

# Claude API
REACT_APP_CLAUDE_API_URL=https://allie-claude-api-4eckwlczwa-uc.a.run.app/api/claude

# Environment
NODE_ENV=development
```

### Development

```bash
# Start development server (port 3000)
npm start

# Start backend proxy (port 3002) - optional
npm run proxy

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run regression tests
npm run test:regression
```

### Production Build

```bash
# Build for production
npm run build

# Analyze bundle size
npm run build:analyze

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy all
firebase deploy
```

## 📁 Project Structure

```
parentload-clean/
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # Allie chat interface
│   │   │   └── refactored/ # Refactored chat (Oct 2025)
│   │   ├── dashboard/      # Main dashboard screens
│   │   ├── calendar/       # Calendar components
│   │   ├── interview/      # Multi-person interview system
│   │   ├── onboarding/     # User onboarding flow
│   │   └── user/          # User settings & profile
│   ├── services/           # Business logic services
│   │   ├── ClaudeService.js            # Claude API integration
│   │   ├── EnhancedCalendarSyncService.js  # Google Calendar sync
│   │   ├── GoogleAuthService.js        # OAuth integration
│   │   ├── PremiumVoiceService.js      # OpenAI TTS
│   │   ├── DatabaseService.js          # Firestore operations
│   │   ├── SchoolCalendarSyncService.js # School calendar integration
│   │   └── QuantumKnowledgeGraph.js    # AI memory system
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.js  # Authentication state
│   │   ├── FamilyContext.js # Family data
│   │   └── UnifiedEventContext.js # Calendar events
│   ├── hooks/              # Custom React hooks
│   ├── config/             # Configuration files
│   └── assets/            # Static assets
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # Email routing, SMS, OTP
│   └── services/          # Backend services
├── server/                # Cloud Run backend
│   ├── production-server.js    # Main server
│   ├── agent-handler.js        # AI agent handler
│   └── services/               # Server services
├── tests/                 # Test files
│   ├── regression/        # Regression tests
│   └── e2e/              # End-to-end tests
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── package.json
```

## 🔑 Key Features

### 1. AllieChat - AI Assistant
- **Location**: `/src/components/chat/refactored/`
- **Components**:
  - `AllieChat.jsx` - Entry point (300 lines)
  - `AllieChatController.jsx` - Business logic (620 lines)
  - `AllieChatUI.jsx` - Presentation (800 lines)
  - `AllieConversationEngine.jsx` - AI engine (485 lines)
- **Models**: Opus 4.1 (internal), Sonnet 3.5 (sales)
- **Features**: Voice input, TTS output, context-aware responses

### 2. Calendar System
- **Bidirectional Google Calendar sync**
- **School calendar integration** (InfoMentor, Skolon)
- **Offline queue** with automatic retry
- **Conflict resolution** with smart merging
- **Natural language event parsing**

### 3. Voice Interface
- **Base**: Web Speech API with wake word detection
- **Premium**: OpenAI TTS-1-HD (Nova voice, 0.95x speed)
- **Multi-Person Support**: Automatic speaker identification
- **Feedback Prevention**: Mic pauses during TTS playback

### 4. Multi-Person Interview System
**Status**: ✅ Production Ready (Oct 8, 2025)
- **3-Phase Implementation**:
  1. Visual speaker selection with keyboard shortcuts
  2. Smart persistence (skips prompts if same speaker)
  3. Hybrid auto-detection with voice enrollment
- **Files**:
  - `/src/components/interview/SpeakerSelector.jsx`
  - `/src/components/interview/VoiceEnrollmentFlow.jsx`
  - `/src/services/voice/VoiceEnrollmentService.js`

### 5. Onboarding Flow
- **13-step guided setup**
- **Google Auth OR password** (dual authentication)
- **Phone verification** with SMS OTP
- **Email verification** with magic links
- **Family profile creation**

## 🐛 Known Issues & Fixes

### Critical Fixes (October 2025)

#### ✅ Google Auth Popup Flow (Oct 13, 2025)
**Fixed**: Popup flow instead of redirect to prevent blank screens
- **File**: `OnboardingFlow.jsx:806-817`
- **Impact**: Seamless Google Auth with immediate feedback

#### ✅ OTP Login Stuck on Loading (Oct 8, 2025)
**Fixed**: Race condition in dashboard initialization
- **Files**: `NotionFamilySelectionScreen.jsx:94`, `DashboardWrapper.jsx:28-33`
- **Impact**: Dashboard loads immediately after OTP login

#### ✅ Calendar Date Matching (Oct 8, 2025)
**Fixed**: UTC timezone conversion in date comparison
- **File**: `WeeklyTimelineView.jsx:40-65`
- **Impact**: All calendar events display correctly

#### ✅ Survey Initialization Error (Oct 13, 2025)
**Fixed**: Incorrect method call to QuantumKnowledgeGraph
- **File**: `DynamicSurveyGenerator.js:57-58`
- **Impact**: Survey starts without errors

#### ✅ Onboarding White Screen (Oct 13, 2025)
**Fixed**: Added loading state management for async operations
- **File**: `OnboardingFlow.jsx:847-1091`
- **Impact**: Users see loading spinner instead of white screens

## 📚 Documentation

- **CLAUDE.md** - Comprehensive AI assistant guidelines
- **GOOGLE_AUTH_ANALYSIS_COMPLETE.md** - Google Auth implementation
- **MULTI_PERSON_INTERVIEW_SYSTEM_COMPLETE.md** - Interview system docs
- **PASSWORD_AUTH_TEST_SUMMARY.md** - Test coverage report
- **BUG_FIXES_HISTORY.md** - Historical bug fixes

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:stage1
```

### Regression Tests
```bash
# Run regression suite (8 critical bugs)
npm run test:regression

# Run against production
npm run test:regression:prod
```

### Smoke Tests
```bash
# Quick auth verification
npm run test:smoke

# Production smoke test
npm run test:smoke:prod
```

## 🚢 Deployment

### Firebase Hosting
```bash
# Build and deploy frontend
npm run build
firebase deploy --only hosting
```

### Cloud Functions
```bash
# Deploy backend functions
firebase deploy --only functions
```

### Cloud Run Backend
```bash
# Deploy Cloud Run service
gcloud run deploy allie-claude-api \
  --source server/ \
  --region us-central1 \
  --project parentload-ba995
```

### Firestore Indexes
```bash
# Deploy indexes
npm run deploy:indexes

# Or manually
firebase deploy --only firestore:indexes
```

## 🔒 Security

### Firestore Rules
- **Location**: `firestore.rules`
- **Rules**: User-family-based access control
- **Collections**: events, families, users, kanbanTasks, surveyResponses

### Authentication
- **Firebase Auth** with custom claims
- **Google OAuth 2.0** with CSRF protection
- **OTP verification** via email
- **SMS verification** via Twilio

### API Security
- **CORS** configured for checkallie.com
- **Rate limiting** on Cloud Run
- **Token refresh** automatic (5 min before expiry)

## 📊 Database Schema

### Core Collections

```javascript
// families
{
  familyId: string,
  familyName: string,
  familyMembers: [
    { id, name, role: 'parent'|'child', email, profilePicture }
  ],
  location: { city, country, latitude, longitude },
  priorities: [],
  createdAt: Timestamp
}

// events
{
  id: string,
  familyId: string,
  userId: string,           // Required for queries
  title: string,
  startTime: Timestamp,     // For Firestore queries
  endTime: Timestamp,
  startDate: string,        // ISO string (compatibility)
  endDate: string,
  source: 'google' | 'manual' | 'school',
  googleId: string,
  childId: string,          // For school events
  reminders: [{minutes, method}]
}

// kanbanTasks
{
  familyId: string,
  title: string,
  status: 'todo' | 'in-progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  assignedTo: string,
  dueDate: Timestamp
}
```

## 🤝 Contributing

This is a private repository. For external contributors:

1. Contact stefan@checkallie.com for access
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

## 📞 Support

- **Production Issues**: stefan@checkallie.com
- **Firebase Console**: https://console.firebase.google.com/project/parentload-ba995
- **Cloud Logs**: `gcloud run services logs read allie-claude-api`

## 📝 License

Proprietary - All rights reserved. © 2025 Parentload/Allie

## 🔗 URLs

- **Production**: https://checkallie.com
- **Firebase Hosting**: https://parentload-ba995.web.app
- **Cloud Run API**: https://allie-claude-api-4eckwlczwa-uc.a.run.app
- **Firebase Console**: https://console.firebase.google.com/project/parentload-ba995

---

**Last Updated**: October 13, 2025
**Version**: 11.14
**Status**: ✅ Production Ready
