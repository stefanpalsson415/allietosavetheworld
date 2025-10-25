# CircleCI Quick Start - 5 Steps to Production CI/CD

**Total time: ~15 minutes**

All the hard work is done! Just follow these 5 simple steps.

---

## ✅ Step 1: Run the Interactive Setup Script (5 min)

```bash
./setup-circleci.sh
```

This will:
- Generate your Firebase CI token
- Help create Google Cloud service account (optional)
- Create a template with all environment variables you need

**Output files** (keep these private!):
- `.firebase-token.txt` - Your Firebase token
- `.gcloud-service-key-base64.txt` - Your GCP service account key
- `.circleci-env-vars.txt` - Template for CircleCI environment variables

---

## ✅ Step 2: Connect GitHub to CircleCI (2 min)

1. Go to: [https://app.circleci.com/projects](https://app.circleci.com/projects)
2. Find: `parentload-clean` (or your repo name)
3. Click: **"Set Up Project"**
4. Select: **"Use existing config"**
5. Click: **"Start Building"**

---

## ✅ Step 3: Add Environment Variables to CircleCI (5 min)

1. In CircleCI, click: **Project Settings** → **Environment Variables**
2. Add each variable from `.circleci-env-vars.txt`:

**Click "Add Environment Variable" for each:**

```
FIREBASE_TOKEN = <from .firebase-token.txt>
GCLOUD_PROJECT_ID = parentload-ba995
GCLOUD_SERVICE_KEY = <from .gcloud-service-key-base64.txt>
ANTHROPIC_API_KEY = <your Claude API key>

# Plus all REACT_APP_* variables (see .circleci-env-vars.txt)
```

**Quick copy-paste:**
- Open `.circleci-env-vars.txt`
- Copy each `NAME=value` pair
- Add to CircleCI environment variables

---

## ✅ Step 4: Push to GitHub (1 min)

CircleCI files are already committed! Just push:

```bash
git push origin main
```

**What happens next:**
- CircleCI automatically detects the push
- Runs your first build (8-12 minutes)
- You'll see it in real-time at: [https://app.circleci.com](https://app.circleci.com)

---

## ✅ Step 5: Watch Your First Build! (10 min)

1. Go to: [https://app.circleci.com](https://app.circleci.com)
2. Click on your project
3. Watch the build pipeline run:
   - **Setup** → Install dependencies
   - **Build** → Build React app
   - **Test** → Run tests
   - **Deploy** → (if on main/develop branch)

**First build takes ~10 minutes** (subsequent builds: ~3-5 min with caching)

---

## 🎉 You're Done!

### What You Have Now:

✅ **Automated builds** on every commit
✅ **Automated testing** (unit + smoke + regression)
✅ **Auto-deploy to staging** (develop branch)
✅ **Manual approval for production** (main branch)
✅ **Cloud Run deployment** (server changes)
✅ **Build caching** for 3x faster builds
✅ **Slack notifications** (if configured)

---

## 🚀 Deployment Flow

### Develop Branch (Staging)
```bash
git checkout develop
git merge feature/my-feature
git push origin develop
```
→ **Auto-deploys to staging** (no approval needed)

### Main Branch (Production)
```bash
git checkout main
git merge develop
git push origin main
```
→ Build & test → **Manual approval required** → Deploy to production

---

## 🔍 Quick Checks

### Is CircleCI working?

```bash
# Check latest build status
# Go to: https://app.circleci.com/pipelines/circleci/82hJfozkeGv7PMpWEzTa7J

# Or check the status badge in README.md
```

### Test locally before pushing:

```bash
# Validate config
./.circleci/validate-config.sh

# (Optional) Run build locally
./.circleci/run-build-locally.sh build
```

---

## 📚 Need Help?

### Quick Reference:
- **Environment variables**: `.circleci/ENVIRONMENT_VARIABLES.md`
- **Detailed setup**: `CIRCLECI_SETUP_GUIDE.md`
- **Full documentation**: `CIRCLECI_SETUP_COMPLETE.md`

### Common Issues:

**"Build failed: Firebase authentication error"**
```bash
# Regenerate token
firebase login:ci --reauth

# Update FIREBASE_TOKEN in CircleCI
```

**"Build failed: Missing environment variable"**
- Check `.circleci-env-vars.txt` for the complete list
- Make sure all `REACT_APP_*` variables are set in CircleCI

**"Deployment succeeded but site not updated"**
- Clear browser cache (Cmd+Shift+R on Mac)
- Wait 5-10 minutes for CDN propagation

---

## 🎯 Next Steps (Optional)

### Set up branch protection (recommended):
1. Go to: GitHub repo → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require status checks to pass
   - Select: `ci/circleci: build`
   - ✅ Require branches to be up to date

### Enable Slack notifications:
1. Create Slack webhook: [https://api.slack.com/apps](https://api.slack.com/apps)
2. Add to CircleCI: `SLACK_WEBHOOK = https://hooks.slack.com/services/...`

### Monitor performance:
- View builds: [https://app.circleci.com](https://app.circleci.com)
- Check artifacts: Build → Artifacts tab
- View test results: Build → Tests tab

---

## 🔐 Security Reminder

The following files contain sensitive information and are automatically ignored by git:

- `.firebase-token.txt`
- `.gcloud-service-key-base64.txt`
- `.circleci-env-vars.txt`

**After adding to CircleCI, delete these files:**

```bash
rm .firebase-token.txt
rm .gcloud-service-key-base64.txt
rm .circleci-env-vars.txt
```

---

**That's it! You now have a production-ready CI/CD pipeline.** 🚀

Questions? Check `CIRCLECI_SETUP_GUIDE.md` for comprehensive documentation.
