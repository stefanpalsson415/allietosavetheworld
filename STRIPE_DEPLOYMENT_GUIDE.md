# Stripe Integration Deployment Guide

## ✅ Completed Steps

### 1. Frontend Setup
- ✅ Installed Stripe packages: `@stripe/stripe-js`, `@stripe/react-stripe-js`
- ✅ Added Stripe configuration to `src/config.js`
- ✅ Updated `.env` with Stripe publishable key
- ✅ Updated PaymentScreen pricing to match Stripe: €29.99/month, €259/year
- ✅ Removed "Whoops!" banner
- ✅ Integrated Stripe Checkout flow in PaymentScreen
- ✅ Created PaymentSuccess component for post-payment handling
- ✅ Added route `/payment/success` in App.js
- ✅ Added subscription → familyId linking in PaymentSuccess
- ✅ Added couponAccess field for free coupon users

### 2. Backend Setup
- ✅ Installed Stripe in Firebase Functions: `stripe` package
- ✅ Created `functions/services/stripe-service.js` (Stripe API wrapper)
- ✅ Added Firebase Functions to `functions/index.js`:
  - `createCheckoutSession` - Creates Stripe Checkout sessions
  - `stripeWebhook` - Handles Stripe webhook events
  - `cancelSubscription` - Cancels subscriptions
  - `reactivateSubscription` - Reactivates subscriptions
  - `updateSubscriptionMetadata` - Links subscription to familyId

### 3. Email Notifications (SendGrid)
- ✅ Payment confirmation emails
- ✅ Failed payment notifications
- ✅ Subscription canceled notifications

### 4. Access Control
- ✅ AuthContext `hasValidAccess()` function
  - Checks for active subscription OR coupon access
  - Includes 3-day grace period for past_due subscriptions
- ✅ Coupon code users get `couponAccess: true` field in family document

## 🚧 Remaining Deployment Steps

### Step 1: Configure Firebase Functions Environment Variables

**Set Stripe keys in Firebase Functions:**

```bash
# Set Stripe secret key (KEEP THIS SECRET!)
firebase functions:config:set stripe.secret_key="$STRIPE_SECRET_KEY"

# Set app URL for success/cancel redirects
firebase functions:config:set app.url="https://checkallie.com"

# Set SendGrid credentials for email notifications
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set sendgrid.from_email="stefan@checkallie.com"

# Verify configuration
firebase functions:config:get
```

**Expected output:**
```json
{
  "stripe": {
    "secret_key": "sk_live_51RA8k...",
    "webhook_secret": "whsec_..."
  },
  "app": {
    "url": "https://checkallie.com"
  },
  "sendgrid": {
    "api_key": "SG.xxx...",
    "from_email": "stefan@checkallie.com"
  }
}
```

**Note:** The `webhook_secret` will be added in Step 3 after configuring the webhook in Stripe Dashboard.

### Step 2: Deploy Firebase Functions

**Deploy all functions to production:**

```bash
# Build frontend first (to ensure latest code)
npm run build

# Deploy everything (functions + hosting)
firebase deploy

# Or deploy only functions
firebase deploy --only functions
```

**Verify deployment:**
- Check Firebase Console → Functions
- Should see: `createCheckoutSession`, `stripeWebhook`, `cancelSubscription`, `reactivateSubscription`

### Step 3: Set Up Stripe Webhook

**Get your webhook endpoint URL:**

After deploying functions, the webhook URL will be:
```
https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook
```

**(Or check in Firebase Console → Functions → stripeWebhook → Trigger URL)**

**Configure webhook in Stripe Dashboard:**

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter URL: `https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (Required)
   - `customer.subscription.updated` ✅ (Required)
   - `customer.subscription.deleted` ✅ (Required)
   - `invoice.payment_failed` ✅ (Required)
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)

**Add webhook secret to Firebase:**

```bash
# Set webhook secret from Stripe
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"

# Redeploy to apply new config
firebase deploy --only functions
```

### Step 4: Test Payment Flow

**Test with real card (refundable):**

1. Go to https://checkallie.com/onboarding
2. Complete onboarding flow
3. On payment page, select a plan
4. Click "Continue to Payment"
5. You'll be redirected to Stripe Checkout
6. Use a real card (you can refund later)
7. Complete payment
8. Should redirect to `/payment/success`
9. Family account should be created
10. Should redirect to dashboard

**Test with coupon code:**

1. Go to payment page
2. Enter coupon: `olytheawesome`, `freeforallie`, or `familyfirst`
3. Click "Apply"
4. Should get free access without payment

### Step 5: Verify Webhook Processing

**Check Firebase Functions logs:**

```bash
# Watch logs in real-time
firebase functions:log --only stripeWebhook

# Or check in Firebase Console → Functions → stripeWebhook → Logs
```

**What to look for:**
```
✅ Checkout completed for session: cs_test_...
✅ Checkout data stored, ready for family creation
📬 Webhook event type: checkout.session.completed
```

### Step 6: Test Subscription Management

**Test subscription lifecycle:**

1. Create a test subscription
2. Go to Firestore Console → `families` → your family
3. Verify `subscription` field:
   ```json
   {
     "stripeCustomerId": "cus_...",
     "stripeSubscriptionId": "sub_...",
     "status": "active",
     "currentPeriodEnd": "2025-11-24...",
     "priceId": "price_1SLhErKrwosuk0SZe75qGPCC"
   }
   ```

## 🔐 Security Checklist

- ✅ Stripe secret key stored in Firebase Functions config (not in code)
- ✅ Stripe publishable key in `.env` (safe for client-side)
- ✅ Webhook signature verification enabled
- ✅ User authentication required for `createCheckoutSession`
- ✅ familyId linked to subscription for access control

## 📊 Monitoring & Analytics

**Stripe Dashboard:**
- Monitor payments: https://dashboard.stripe.com/payments
- View subscriptions: https://dashboard.stripe.com/subscriptions
- Check webhook logs: https://dashboard.stripe.com/webhooks

**Firebase Console:**
- Function logs: Firebase Console → Functions → Logs
- Firestore data: Firebase Console → Firestore → `completedCheckouts`, `families`

## 🐛 Troubleshooting

### Issue: "Stripe not initialized" error

**Solution:**
```bash
# Verify config is set
firebase functions:config:get

# Redeploy if missing
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase deploy --only functions
```

### Issue: Webhook events not processing

**Solution:**
1. Check webhook secret is set correctly
2. Verify webhook URL in Stripe Dashboard
3. Check Firebase Functions logs for errors
4. Test webhook with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Issue: Payment succeeds but family not created

**Solution:**
1. Check Firestore → `completedCheckouts` collection
2. Check `PaymentSuccess` component logs
3. Verify `createFamily` function works correctly

## 💰 Pricing Tiers

**Current Setup:**

| Plan | Price | Stripe Price ID |
|------|-------|-----------------|
| Monthly | €29.99/month (299 SEK) | `price_1SLhErKrwosuk0SZe75qGPCC` |
| Annual | €259/year (2,599 SEK) | `price_1SLhGTKrwosuk0SZYGZDu9Gl` |

**To change pricing:**
1. Create new prices in Stripe Dashboard
2. Update `.env`:
   ```
   REACT_APP_STRIPE_MONTHLY_PRICE_ID=price_NEW_ID
   REACT_APP_STRIPE_ANNUAL_PRICE_ID=price_NEW_ID
   ```
3. Update `config.js` defaults
4. Rebuild and redeploy

## 🎯 Next Steps (Optional)

### 1. Customer Portal
Allow users to manage their subscriptions:
- Update payment method
- Cancel subscription
- View invoices

**Implementation:**
- Create Stripe Customer Portal session
- Add link in user settings

### 2. Proration Handling
Handle plan changes (monthly ↔ annual):
- Use `stripe.subscriptions.update` with proration
- Show preview of charges

### 3. Failed Payment Recovery
Email users when payment fails:
- Listen to `invoice.payment_failed` webhook
- Send email with payment update link
- Use Stripe's Smart Retries

## 📝 File Reference

**Frontend:**
- `src/config.js` - Stripe configuration
- `src/components/payment/PaymentScreen.jsx` - Payment UI
- `src/components/payment/PaymentSuccess.jsx` - Success page
- `.env` - Stripe publishable key

**Backend:**
- `functions/services/stripe-service.js` - Stripe API wrapper
- `functions/index.js` - Firebase Functions (lines 2102-2293)

**Documentation:**
- `STRIPE_INTEGRATION_PLAN.md` - Original plan
- `STRIPE_DEPLOYMENT_GUIDE.md` - This file

---

## 🚀 Quick Deploy Checklist

- [ ] Set Firebase Functions config (stripe.secret_key, stripe.webhook_secret, app.url)
- [ ] Deploy Firebase Functions: `firebase deploy --only functions`
- [ ] Configure Stripe webhook with correct URL and events
- [ ] Test payment flow end-to-end
- [ ] Verify webhook processing in logs
- [ ] Test coupon codes
- [ ] Monitor first real payment

**Status:** Ready to deploy! 🎉

---

**Support:** If you encounter issues, check Firebase logs or contact stefan@checkallie.com
