# Stripe Webhook Configuration

## ✅ Deployment Complete

**Functions Deployed:** All 5 Stripe functions are live in production
**Frontend Deployed:** https://checkallie.com
**Webhook URL:** https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook

**⚠️ Webhook Secret:** Currently set to PLACEHOLDER - needs to be replaced with real secret from Stripe Dashboard

---

## 📋 Quick Start: See WEBHOOK_SETUP_INSTRUCTIONS.md

For comprehensive step-by-step webhook setup instructions, see:
**[WEBHOOK_SETUP_INSTRUCTIONS.md](./WEBHOOK_SETUP_INSTRUCTIONS.md)**

The new guide includes:
- Complete Stripe Dashboard configuration
- Webhook secret setup
- Firebase configuration commands
- Testing procedures
- Troubleshooting guide
- Verification checklist

---

## 🔧 NEXT STEP: Configure Stripe Webhook

### Step 1: Add Webhook Endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Enter Endpoint URL:
   ```
   https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook
   ```

4. Click **"Select events"** and choose these 4 events:
   - ✅ `checkout.session.completed` - When payment succeeds
   - ✅ `customer.subscription.updated` - When subscription changes
   - ✅ `customer.subscription.deleted` - When subscription cancels
   - ✅ `invoice.payment_failed` - When payment fails

5. Click **"Add endpoint"**

### Step 2: Get Webhook Signing Secret

After creating the endpoint, you'll see a screen with:
- **Signing secret** (starts with `whsec_...`)

**Copy this secret!** You'll need it in the next step.

### Step 3: Add Webhook Secret to Firebase

```bash
cd /Users/stefanpalsson/parentload\ copy/parentload-clean

# Set the webhook secret (replace with your actual secret)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"

# Redeploy functions to apply the new config
firebase deploy --only functions:stripeWebhook
```

### Step 4: Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only stripeWebhook
   ```

**Expected Output:**
```
📬 Webhook event type: checkout.session.completed
✅ Checkout completed for session: cs_test_...
```

---

## 🧪 End-to-End Testing

### Test 1: Successful Payment

1. **Open:** https://checkallie.com/onboarding
2. **Complete:** Onboarding flow with test family data
3. **Payment Page:** Click "Continue to Payment"
4. **Stripe Checkout:** Use test card `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. **Expected Results:**
   - ✅ Redirects to `/payment/success`
   - ✅ Shows "Processing Payment..." spinner
   - ✅ Email sent to your address (check inbox)
   - ✅ Family created in Firestore with subscription data
   - ✅ Subscription linked to familyId in Stripe
   - ✅ Redirects to `/dashboard`

### Test 2: Coupon Code

1. **Open:** https://checkallie.com/onboarding
2. **Complete:** Onboarding flow
3. **Payment Page:** Enter coupon code:
   - `olytheawesome`
   - `freeforallie`
   - `familyfirst`
4. **Click:** "Apply" button
5. **Expected Results:**
   - ✅ Green success message appears
   - ✅ "Get Started" button appears
   - ✅ No Stripe Checkout required
   - ✅ Family created with `couponAccess: true`
   - ✅ No email sent (no payment)
   - ✅ Redirects to `/dashboard`

### Test 3: Failed Payment

1. **Use test card:** `4000 0000 0000 0002` (Declined)
2. **Expected Results:**
   - ✅ Stripe shows "Your card was declined"
   - ✅ Can try again with different card
   - ✅ No email sent (no successful payment)

### Test 4: Subscription Lifecycle

**Cancel Subscription:**
```bash
# Get subscriptionId from Firestore families/{familyId}/subscription.stripeSubscriptionId
# Then in browser console:
const functions = getFunctions();
const cancel = httpsCallable(functions, 'cancelSubscription');
cancel({ subscriptionId: 'sub_...' });
```

**Expected Results:**
- ✅ Subscription status updates to `active` with `cancel_at_period_end: true`
- ✅ Email sent: "Subscription Canceled"
- ✅ Access continues until period end

**Reactivate Subscription:**
```bash
const reactivate = httpsCallable(functions, 'reactivateSubscription');
reactivate({ subscriptionId: 'sub_...' });
```

**Expected Results:**
- ✅ Subscription status updates to `active` with `cancel_at_period_end: false`
- ✅ Billing resumes normally

---

## 🔍 Verification Checklist

### Firestore Data Check

1. **Go to:** Firebase Console → Firestore Database
2. **Check Collection:** `families/{familyId}`
3. **Verify subscription object:**
   ```json
   {
     "subscription": {
       "stripeCustomerId": "cus_...",
       "stripeSubscriptionId": "sub_...",
       "status": "active",
       "currentPeriodEnd": Timestamp,
       "cancelAtPeriodEnd": false,
       "priceId": "price_1SLhErKrwosuk0SZ...",
       "updatedAt": Timestamp
     }
   }
   ```

### Stripe Dashboard Check

1. **Go to:** https://dashboard.stripe.com/customers
2. **Find:** Customer by email
3. **Verify:**
   - ✅ Customer exists
   - ✅ Active subscription
   - ✅ Metadata includes `familyId`

### Email Check

1. **Check inbox** for: stefan@checkallie.com (or test email)
2. **Verify email received:**
   - Subject: "Welcome to Allie - Payment Confirmed! 🎉"
   - Contains: Dashboard link, feature list
   - From: stefan@checkallie.com

---

## 🐛 Troubleshooting

### Issue: Webhook Events Not Processing

**Check:**
```bash
firebase functions:log --only stripeWebhook
```

**Common Causes:**
1. ❌ Webhook secret not set → Run `firebase functions:config:set stripe.webhook_secret="..."`
2. ❌ Wrong webhook URL in Stripe → Should be `https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook`
3. ❌ Wrong events selected → Need all 4 events listed above

### Issue: No Email Received

**Check:**
```bash
firebase functions:log | grep "email"
```

**Common Causes:**
1. ❌ SendGrid API key not working → Verify in SendGrid dashboard
2. ❌ Email in spam folder → Check spam/junk
3. ❌ SendGrid from_email not verified → Verify sender in SendGrid

### Issue: Family Not Created After Payment

**Check:**
```bash
firebase functions:log --only stripeWebhook
```

**Common Causes:**
1. ❌ Webhook not firing → Check Stripe webhook logs
2. ❌ completedCheckouts document not created → Check webhook logs for errors
3. ❌ PaymentSuccess page error → Check browser console

---

## 📊 Monitoring

### Firebase Functions Logs (Real-Time)

```bash
# Watch webhook events
firebase functions:log --only stripeWebhook

# Watch all Stripe functions
firebase functions:log | grep "stripe"

# Watch email sending
firebase functions:log | grep "email"
```

### Stripe Dashboard

- **Payments:** https://dashboard.stripe.com/payments
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Logs:** Each webhook shows delivery attempts and responses

---

## ✅ Success Criteria

**Payment Flow Working When:**
1. ✅ User completes checkout → Family created
2. ✅ User receives welcome email
3. ✅ Firestore has correct subscription data
4. ✅ Stripe metadata includes familyId
5. ✅ User can access dashboard
6. ✅ Webhook logs show successful processing

**Coupon Flow Working When:**
1. ✅ Valid coupon → Family created with `couponAccess: true`
2. ✅ Dashboard accessible without subscription
3. ✅ AuthContext `hasValidAccess()` returns true

---

**Current Status:** ⚠️ Waiting for webhook secret configuration

**Next Action:** Complete Step 1-3 above to finish webhook setup, then test end-to-end.
