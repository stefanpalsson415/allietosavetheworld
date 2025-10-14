# Firebase Deployment Instructions

## Prerequisites
1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Firebase authentication

## Deployment Steps

### 1. Authenticate with Firebase
```bash
firebase login
```

### 2. Build the Project
```bash
npm run build
```

### 3. Deploy to Firebase Hosting

#### Option A: Use the deployment script
```bash
./deploy.sh
```

#### Option B: Manual deployment
```bash
# Deploy only hosting (your React app)
firebase deploy --only hosting

# Deploy everything (hosting + functions + rules)
firebase deploy
```

## Deployment URLs
- Production: https://parentload-ba995.web.app
- Alternative: https://parentload-ba995.firebaseapp.com
- Firebase Console: https://console.firebase.google.com/project/parentload-ba995/overview

## Troubleshooting

### Authentication Issues
If you see "Your credentials are no longer valid", run:
```bash
firebase login --reauth
```

### Build Issues
If the build fails, try:
```bash
npm install --legacy-peer-deps
npm run build
```

### Preview Deployments
To create a preview channel before deploying to production:
```bash
firebase hosting:channel:deploy preview
```

## Current Status
- ✅ Build completed successfully
- ⚠️ Firebase authentication required
- ✅ New storytelling homepage ready
- ✅ Long vision document integrated
- ✅ Mountain progress redesigned

## Next Steps
1. Run `firebase login` to authenticate
2. Run `./deploy.sh` and select option 2 (Hosting only)
3. Visit your site at https://parentload-ba995.web.app