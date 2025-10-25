# CircleCI Environment Variables Reference

Quick reference for all environment variables needed in CircleCI project settings.

## 🔑 How to Add Variables

1. Go to CircleCI project page
2. Click "Project Settings" (top right)
3. Select "Environment Variables" from sidebar
4. Click "Add Environment Variable"
5. Enter name and value
6. Click "Add Variable"

---

## ✅ Required Variables (Must Set These!)

### Firebase Deployment

```bash
# Generate with: firebase login:ci
FIREBASE_TOKEN=1//0...
```

### Google Cloud (for Cloud Run deployment)

```bash
# Project ID
GCLOUD_PROJECT_ID=parentload-ba995

# Service account key (base64 encoded)
# Generate from: Google Cloud Console → IAM → Service Accounts
GCLOUD_SERVICE_KEY=ewogICJ0eXBlI...
```

### Anthropic API (Claude)

```bash
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Firebase Configuration (for React Build)

```bash
# Get from: Firebase Console → Project Settings → General
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=parentload-ba995.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=parentload-ba995
REACT_APP_FIREBASE_STORAGE_BUCKET=parentload-ba995.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=363935868004
REACT_APP_FIREBASE_APP_ID=1:363935868004:web:...
REACT_APP_FIREBASE_MEASUREMENT_ID=G-...
```

### Mapbox

```bash
# Get from: https://account.mapbox.com/
REACT_APP_MAPBOX_TOKEN=pk.ey...
```

### Stripe Payment

```bash
# Get from: Stripe Dashboard → Developers → API Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Price IDs from Stripe Dashboard → Products
REACT_APP_STRIPE_MONTHLY_PRICE_ID=price_1SLhErKrwosuk0SZe75qGPCC
REACT_APP_STRIPE_ANNUAL_PRICE_ID=price_1SLhGTKrwosuk0SZYGZDu9Gl
```

---

## 🔧 Optional Variables

### Backend URLs (defaults usually work)

```bash
REACT_APP_BACKEND_URL=https://allie-claude-api-363935868004.us-central1.run.app
REACT_APP_CLAUDE_URL=https://allie-claude-api-363935868004.us-central1.run.app/api/claude
```

### Neo4j (if using Knowledge Graph)

```bash
# Get from: Neo4j Aura Console
NEO4J_URI=neo4j+s://c82dff38.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password-here
```

### Slack Notifications (optional)

```bash
# Get from: Slack App → Incoming Webhooks
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

---

## 🚨 Security Best Practices

### DO:
- ✅ Use environment variables for ALL secrets
- ✅ Rotate keys periodically
- ✅ Use separate keys for staging and production
- ✅ Document which variables are required vs optional

### DON'T:
- ❌ Commit secrets to git (even in comments)
- ❌ Share keys in Slack/email
- ❌ Use production keys in development
- ❌ Store keys in code or config files

---

## 📝 Variable Checklist

Use this checklist when setting up CircleCI for a new project:

### Core Infrastructure
- [ ] `FIREBASE_TOKEN` - For deploying hosting, functions, firestore
- [ ] `GCLOUD_PROJECT_ID` - GCP project ID
- [ ] `GCLOUD_SERVICE_KEY` - Service account for Cloud Run

### API Keys
- [ ] `ANTHROPIC_API_KEY` - Claude AI
- [ ] `REACT_APP_MAPBOX_TOKEN` - Mapbox maps

### Firebase Config (React)
- [ ] `REACT_APP_FIREBASE_API_KEY`
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
- [ ] `REACT_APP_FIREBASE_PROJECT_ID`
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `REACT_APP_FIREBASE_APP_ID`
- [ ] `REACT_APP_FIREBASE_MEASUREMENT_ID`

### Payment
- [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- [ ] `REACT_APP_STRIPE_MONTHLY_PRICE_ID`
- [ ] `REACT_APP_STRIPE_ANNUAL_PRICE_ID`

### Optional
- [ ] `NEO4J_URI` (if using Knowledge Graph)
- [ ] `NEO4J_USER` (if using Knowledge Graph)
- [ ] `NEO4J_PASSWORD` (if using Knowledge Graph)
- [ ] `SLACK_WEBHOOK` (for notifications)

---

## 🔍 How to Find Values

### Firebase Token
```bash
firebase login:ci
# Outputs: 1//0e...
```

### Google Cloud Service Account Key
1. GCP Console → IAM & Admin → Service Accounts
2. Create service account: "circleci-deployer"
3. Grant roles: Cloud Run Admin, Storage Admin, Service Account User
4. Create JSON key
5. Encode to base64:
   ```bash
   cat service-account.json | base64 | tr -d '\n'
   ```

### Firebase Config
1. Firebase Console
2. Project Settings → General
3. Scroll to "Your apps"
4. Copy config values

### Mapbox Token
1. [Mapbox Account](https://account.mapbox.com/)
2. Access tokens → Create a token
3. Copy public token (starts with `pk.`)

### Stripe Keys
1. [Stripe Dashboard](https://dashboard.stripe.com/)
2. Developers → API Keys
3. Copy Publishable key
4. Products → Find your products → Copy price IDs

### Neo4j Credentials
1. [Neo4j Aura Console](https://console.neo4j.io/)
2. Select your database
3. Connect → Connection URI
4. Use credentials created during database setup

---

## 🧪 Testing Variables

### Test Firebase Token
```bash
firebase deploy --only hosting --token="YOUR_TOKEN" --dry-run
```

### Test GCloud Service Key
```bash
echo "YOUR_BASE64_KEY" | base64 --decode > test-key.json
gcloud auth activate-service-account --key-file test-key.json
gcloud projects list
rm test-key.json
```

### Test in CircleCI Locally
```bash
# Add variables to .env file (DO NOT COMMIT!)
cp .env.example .env
# Edit .env with real values

# Run local CircleCI build
circleci local execute --job build
```

---

## 🐛 Troubleshooting

### "Environment variable not found"
- Check variable name spelling (case-sensitive!)
- Verify variable is added to CircleCI project
- Check if variable needs `REACT_APP_` prefix

### "Invalid Firebase token"
- Regenerate token: `firebase login:ci --reauth`
- Update CircleCI variable
- Re-run build

### "GCloud authentication failed"
- Verify base64 encoding (no newlines!)
- Check service account has required permissions
- Regenerate service account key if needed

### Build passes but app broken
- Missing `REACT_APP_*` variables (not injected at runtime)
- Check browser console for errors
- Verify all required env vars are set in CircleCI

---

## 📚 Additional Resources

- [CircleCI Environment Variables Docs](https://circleci.com/docs/env-vars/)
- [Firebase CI Token Setup](https://firebase.google.com/docs/cli#cli-ci-systems)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
