# CircleCI Setup - Final Steps (15 minutes)

All files are ready! Just follow these 4 simple steps:

---

## ✅ Step 1: Get Firebase CI Token (2 min)

Run this command in your terminal:

```bash
./get-firebase-token.sh
```

**What happens:**
- Opens browser for Firebase authentication
- Shows token (starts with `1//0...`)
- **Copy this token** - you'll need it in Step 3

---

## ✅ Step 2: Connect GitHub to CircleCI (3 min)

1. **Go to:** https://app.circleci.com/projects
2. **Find:** `parentload-clean` in your repositories list
3. **Click:** "Set Up Project" button
4. **Select:** "Use existing config" (we already have .circleci/config.yml)
5. **Click:** "Start Building"

**Expected result:** CircleCI is now watching your repo

---

## ✅ Step 3: Add Environment Variables (8 min)

1. **In CircleCI**, click: **Project Settings** (gear icon)
2. **Select:** Environment Variables (left sidebar)
3. **Open:** `.circleci-env-vars.txt` (all values are already filled in!)
4. **For each variable:**
   - Click "Add Environment Variable"
   - Copy variable name (e.g., `FIREBASE_TOKEN`)
   - Copy value (everything after the `=`)
   - Click "Add Variable"

**Special ones:**
- **FIREBASE_TOKEN**: Use the token from Step 1
- **GCLOUD_SERVICE_KEY**: Copy entire contents of `.gcloud-service-key-base64.txt`

**Total variables to add:** ~25 variables

---

## ✅ Step 4: Trigger First Build (2 min)

Make a small change and push to GitHub:

```bash
# Make a small change to trigger build
echo "# CircleCI configured!" >> README.md

# Commit and push
git add README.md
git commit -m "chore: Trigger first CircleCI build"
git push origin main
```

**What happens:**
- CircleCI automatically detects the push
- Starts build pipeline (takes ~8-12 min first time)
- **Watch it live:** https://app.circleci.com

---

## 🎉 Success Indicators

You'll know it's working when you see:

1. ✅ **CircleCI Dashboard** shows your build running
2. ✅ **Setup job** completes (installs dependencies)
3. ✅ **Build job** completes (builds React app)
4. ✅ **Test jobs** run in parallel (unit + smoke tests)
5. ✅ **Deployment waits** for manual approval (if on main branch)

---

## 📊 What You Get

**Automatic on every commit:**
- ✅ Build + test in ~5-8 minutes
- ✅ Caching for faster builds (2nd build ~3-5 min)
- ✅ Parallel test execution
- ✅ Build artifacts stored

**On develop branch:**
- ✅ Auto-deploy to staging (no approval needed)

**On main branch:**
- ✅ Manual approval required before production deploy
- ✅ Deploy to Firebase Hosting + Functions
- ✅ Deploy to Cloud Run (if server code changed)
- ✅ Deployment verification

---

## 🚨 If Something Goes Wrong

### Build fails: "Firebase authentication error"
```bash
# Regenerate token
./get-firebase-token.sh

# Update in CircleCI: Environment Variables → Edit FIREBASE_TOKEN
```

### Build fails: "Missing environment variable"
- Check `.circleci-env-vars.txt` for the complete list
- Make sure all ~25 variables are in CircleCI
- Variable names must match exactly (case-sensitive)

### Build succeeds but nothing deployed
- Check if you're on `main` or `develop` branch
- On main: Click "Approve" in CircleCI workflow
- Clear browser cache (Cmd+Shift+R)

---

## 📁 Files Created

All these files are now in your repo:

- `.circleci/config.yml` - Main CI/CD configuration
- `.circleci-env-vars.txt` - All environment variables (ready to copy)
- `.gcloud-service-key-base64.txt` - GCP service account key
- `get-firebase-token.sh` - Quick token generator
- `CIRCLECI_SETUP_GUIDE.md` - Comprehensive guide (30+ pages)
- `CIRCLECI_QUICKSTART.md` - 5-step quick start

---

## 🎯 Quick Reference

**CircleCI Dashboard:** https://app.circleci.com

**Your Organization:**
- ID: `3e8c8d91-df84-4951-9337-a29637dc7f91`
- Slug: `circleci/82hJfozkeGv7PMpWEzTa7J`

**Production Site:** https://checkallie.com

**Cloud Run API:** https://allie-claude-api-363935868004.us-central1.run.app

---

**Total Time:** ~15 minutes

**Ready?** Start with Step 1! 🚀
