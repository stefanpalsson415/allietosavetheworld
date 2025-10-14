# Deploy Firebase Rules - Manual Steps

The Firebase authentication has expired. Please follow these steps to deploy the rules:

## Option 1: Re-authenticate and Deploy (Recommended)

1. Open a terminal in the project directory:
```bash
cd "/Users/stefanpalsson/parentload copy/parentload-clean"
```

2. Re-authenticate with Firebase:
```bash
firebase login --reauth
```

3. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## Option 2: Deploy via Firebase Console

1. Go to https://console.firebase.google.com/
2. Select your project: `parentload-ba995`
3. Navigate to Firestore Database → Rules
4. Copy and paste the contents of `firestore.rules` file
5. Click "Publish"

## What These Rules Fix

The updated rules allow OTP users (like Kimberly) to:
- Save survey responses without authentication errors
- Track survey progress properly
- Pause and resume surveys

## Verification

After deploying, verify the fix by:
1. Having Kimberly pause her survey again
2. Check that no permission errors appear in the console
3. Confirm that progress is saved properly

The rules changes are already in the `firestore.rules` file - you just need to deploy them to Firebase.