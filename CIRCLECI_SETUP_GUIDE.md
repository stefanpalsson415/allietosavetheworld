# CircleCI Setup Guide for Allie Project

Complete instructions for setting up continuous integration and deployment with CircleCI.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [GitHub Integration](#github-integration)
3. [Environment Variables](#environment-variables)
4. [Firebase Token Setup](#firebase-token-setup)
5. [Google Cloud Setup](#google-cloud-setup)
6. [Slack Notifications (Optional)](#slack-notifications-optional)
7. [Testing the Pipeline](#testing-the-pipeline)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. CircleCI Account
- Go to [https://circleci.com/signup](https://circleci.com/signup)
- Sign up with your GitHub account
- You should now have Organization ID: `3e8c8d91-df84-4951-9337-a29637dc7f91`
- Organization slug: `circleci/82hJfozkeGv7PMpWEzTa7J`

### 2. Install CircleCI CLI (for local testing)
```bash
# macOS
brew install circleci

# Linux
curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash

# Windows
choco install circleci-cli
```

### 3. Verify CLI Installation
```bash
circleci version
```

---

## GitHub Integration

### Step 1: Connect GitHub Repository

1. **Go to CircleCI Dashboard**
   - Visit [https://app.circleci.com/projects](https://app.circleci.com/projects)
   - Click "Set Up Project"

2. **Select Your Repository**
   - Find `parentload-clean` (or your repo name)
   - Click "Set Up Project"

3. **Configure Config File**
   - Select "Use existing config"
   - CircleCI will detect `.circleci/config.yml`
   - Click "Start Building"

### Step 2: Set Up Branch Protection Rules

1. **Go to GitHub Repository Settings**
   - Navigate to: Settings → Branches → Branch protection rules

2. **Protect `main` Branch**
   - Click "Add rule"
   - Branch name pattern: `main`
   - Enable:
     - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Select: `ci/circleci: build`
     - ✅ Require approval from 1 reviewer (optional)
     - ✅ Dismiss stale pull request approvals when new commits are pushed

3. **Protect `develop` Branch** (if using)
   - Repeat above for `develop` branch
   - This will auto-deploy to staging

---

## Environment Variables

You need to add these environment variables in CircleCI:

### Step 1: Access Project Settings
1. Go to CircleCI project page
2. Click "Project Settings" (top right)
3. Select "Environment Variables" from sidebar

### Step 2: Add Required Variables

#### **Firebase Variables** (Required)

```bash
FIREBASE_TOKEN=<see Firebase Token Setup section below>
```

#### **Google Cloud Variables** (Required for Cloud Run deployment)

```bash
GCLOUD_PROJECT_ID=parentload-ba995
GCLOUD_SERVICE_KEY=<base64 encoded service account key - see Google Cloud Setup>
```

#### **API Keys** (Required)

```bash
# Anthropic API Key (for Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Firebase Config (for React app build)
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=parentload-ba995.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=parentload-ba995
REACT_APP_FIREBASE_STORAGE_BUCKET=parentload-ba995.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=1:...
REACT_APP_FIREBASE_MEASUREMENT_ID=G-...

# Mapbox (Required)
REACT_APP_MAPBOX_TOKEN=pk.ey...

# Stripe (Required)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_STRIPE_MONTHLY_PRICE_ID=price_1SLhErKrwosuk0SZe75qGPCC
REACT_APP_STRIPE_ANNUAL_PRICE_ID=price_1SLhGTKrwosuk0SZYGZDu9Gl
```

#### **Optional Variables**

```bash
# Backend URLs (defaults are usually fine)
REACT_APP_BACKEND_URL=https://allie-claude-api-363935868004.us-central1.run.app
REACT_APP_CLAUDE_URL=https://allie-claude-api-363935868004.us-central1.run.app/api/claude

# Neo4j (if using Knowledge Graph)
NEO4J_URI=neo4j+s://c82dff38.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-neo4j-password>
```

---

## Firebase Token Setup

### Step 1: Generate Firebase CI Token

```bash
# Login to Firebase
firebase login:ci
```

This will:
1. Open a browser for authentication
2. Generate a token
3. Display the token in terminal

### Step 2: Add Token to CircleCI

Copy the token and add it to CircleCI as:
```
Variable: FIREBASE_TOKEN
Value: <paste token here>
```

### Step 3: Verify Token Works

```bash
# Test deployment with token
firebase deploy --only hosting --token "<your-token>"
```

---

## Google Cloud Setup

### Step 1: Create Service Account

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Select project: `parentload-ba995`

2. **Create Service Account**
   - Go to: IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: `circleci-deployer`
   - Description: "Service account for CircleCI deployments"

3. **Grant Permissions**
   - Add these roles:
     - ✅ Cloud Run Admin
     - ✅ Service Account User
     - ✅ Storage Admin
     - ✅ Container Registry Service Agent

4. **Create JSON Key**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON"
   - Save the file (e.g., `circleci-service-account.json`)

### Step 2: Encode Service Account Key

```bash
# Encode the JSON file to base64
base64 -i circleci-service-account.json | tr -d '\n' > service-account-base64.txt

# On Linux/macOS
cat circleci-service-account.json | base64 | tr -d '\n' > service-account-base64.txt
```

### Step 3: Add to CircleCI

Copy the contents of `service-account-base64.txt` and add to CircleCI as:
```
Variable: GCLOUD_SERVICE_KEY
Value: <paste base64 encoded key>
```

**⚠️ IMPORTANT**: Delete the JSON files after uploading:
```bash
rm circleci-service-account.json
rm service-account-base64.txt
```

---

## Slack Notifications (Optional)

### Step 1: Create Slack Incoming Webhook

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: "CircleCI Notifications"
4. Select your workspace
5. Go to "Incoming Webhooks" → Enable
6. Click "Add New Webhook to Workspace"
7. Select channel: `#deployments` or `#engineering`
8. Copy the webhook URL

### Step 2: Add to CircleCI

```
Variable: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/...
```

### Step 3: Test Notifications

Push a commit and check Slack for deployment notifications!

---

## Testing the Pipeline

### Option 1: Test Locally (Recommended)

```bash
# Validate config
circleci config validate

# Run all jobs locally
cd /path/to/parentload-clean
./.circleci/run-build-locally.sh all

# Run specific job
./.circleci/run-build-locally.sh build
```

### Option 2: Test with Git Push

```bash
# Create a test branch
git checkout -b test-circleci

# Make a small change (e.g., update README)
echo "# Testing CircleCI" >> README.md
git add README.md
git commit -m "test: Trigger CircleCI pipeline"

# Push and watch CircleCI
git push origin test-circleci
```

### Option 3: Trigger Manual Build

1. Go to CircleCI Dashboard
2. Select your project
3. Click "Trigger Pipeline"
4. Select branch and click "Trigger Pipeline"

---

## Workflows Explained

### 1. Build-Test-Deploy Workflow (Every Commit)

```
Commit → Setup → Build + Tests (parallel) → Deploy
```

- **On any branch**: Runs build and tests
- **On `develop` branch**: Auto-deploys to staging (if tests pass)
- **On `main` branch**: Requires manual approval, then deploys to production

### 2. Nightly Tests Workflow (Scheduled)

```
Daily at 2 AM → Comprehensive regression tests
```

- Runs full test suite
- Sends notifications if failures detected

### 3. Server Deployment Workflow (Manual)

```
Main branch + server changes → Build Docker → Deploy to Cloud Run
```

- Only runs when `server/` directory changes
- Builds and pushes Docker image
- Deploys to Cloud Run

---

## Branch Strategy

### Recommended Git Flow

```
feature/* → develop → main
```

#### Feature Branches
- Create: `git checkout -b feature/new-feature`
- CircleCI: Runs build + tests only
- No automatic deployment

#### Develop Branch (Staging)
- Merge feature branches here first
- CircleCI: Auto-deploys to staging environment
- Test features in staging before production

#### Main Branch (Production)
- Merge from develop after testing
- CircleCI: Requires manual approval to deploy
- Deploys to production Firebase Hosting

---

## Deployment Targets

### Staging (develop branch)
- **URL**: Configure in Firebase (e.g., `staging.checkallie.com`)
- **Purpose**: Test features before production
- **Auto-deploy**: Yes

### Production (main branch)
- **URL**: [https://checkallie.com](https://checkallie.com)
- **Purpose**: Live production site
- **Auto-deploy**: No (requires approval)

---

## Troubleshooting

### Build Fails: "node_modules not found"

**Solution**: Clear CircleCI cache
1. Go to Project Settings → Advanced
2. Click "Clear Cache"
3. Re-run build

### Build Fails: "Firebase authentication error"

**Solution**: Regenerate Firebase token
```bash
firebase login:ci --reauth
```
Update `FIREBASE_TOKEN` in CircleCI environment variables

### Build Fails: "Google Cloud authentication error"

**Solution**: Verify service account key
1. Check `GCLOUD_SERVICE_KEY` is base64 encoded correctly
2. Verify service account has required permissions
3. Regenerate service account key if needed

### Deployment Succeeds but Site Not Updated

**Solution**: Check Firebase hosting cache
```bash
# Force clear browser cache (Cmd+Shift+R on Mac)
# Or wait 5-10 minutes for CDN propagation
```

### Tests Failing in CI but Pass Locally

**Solution**: Check environment variables
1. Ensure all `REACT_APP_*` vars are set in CircleCI
2. Check Node version matches (should be 20.18.0)
3. Look for console warnings about missing env vars

### Docker Build Fails for Server

**Solution**: Check platform compatibility
```bash
# Ensure building for linux/amd64
docker build --platform linux/amd64 -t test .
```

---

## Monitoring & Logs

### View Build Logs
1. Go to CircleCI Dashboard
2. Click on a build
3. Select a job (e.g., "build")
4. View real-time logs

### View Deployment Status
```bash
# Check Firebase deployment status
firebase hosting:channel:list

# Check Cloud Run deployment status
gcloud run services describe allie-claude-api --region us-central1
```

### View Production Logs
```bash
# Firebase Functions logs
firebase functions:log

# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

---

## Next Steps

### 1. Add Status Badge to README

Add this to your `README.md`:

```markdown
[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/82hJfozkeGv7PMpWEzTa7J/parentload-clean/tree/main.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/circleci/82hJfozkeGv7PMpWEzTa7J/parentload-clean/tree/main)
```

### 2. Set Up Performance Monitoring (Optional)

Add Lighthouse CI to `.circleci/config.yml` for automated performance testing:

```yaml
- run:
    name: Run Lighthouse CI
    command: |
      npm install -g @lhci/cli
      lhci autorun
```

### 3. Set Up Security Scanning (Optional)

Add npm audit to catch vulnerabilities:

```yaml
- run:
    name: Security Audit
    command: npm audit --production
```

---

## Support

### CircleCI Resources
- **Documentation**: [https://circleci.com/docs/](https://circleci.com/docs/)
- **Support**: [https://support.circleci.com/](https://support.circleci.com/)
- **Community**: [https://discuss.circleci.com/](https://discuss.circleci.com/)

### Project-Specific Help
- Check `CLAUDE.md` for project conventions
- Review existing deployments in Firebase console
- Check Cloud Run logs for server issues

---

## Summary Checklist

Before going live with CircleCI:

- [ ] GitHub repository connected to CircleCI
- [ ] `.circleci/config.yml` committed to repository
- [ ] All environment variables added to CircleCI
- [ ] Firebase token generated and added
- [ ] Google Cloud service account created and key added
- [ ] Slack webhook configured (optional)
- [ ] Local CircleCI CLI installed and tested
- [ ] Test build run successfully
- [ ] Branch protection rules enabled
- [ ] Status badge added to README
- [ ] Team notified of new CI/CD pipeline

**You're ready to deploy with CircleCI! 🚀**
