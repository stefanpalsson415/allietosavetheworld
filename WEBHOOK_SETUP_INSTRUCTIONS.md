# 🔐 Complete Stripe Webhook Setup

## Current Status: ✅ Functions Deployed, ⚠️ Webhook Secret Needed

All 5 Stripe Cloud Functions are **LIVE** in production:
- ✅ createCheckoutSession
- ✅ stripeWebhook
- ✅ cancelSubscription
- ✅ reactivateSubscription
- ✅ updateSubscriptionMetadata

**Webhook URL:** https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook

---

## 📋 Step-by-Step Webhook Configuration

### Step 1: Add Webhook Endpoint in Stripe Dashboard

1. **Open Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Make sure you're in **LIVE mode** (toggle in top-right corner)

2. **Click "+ Add endpoint"**

3. **Configure Endpoint:**
   - **Endpoint URL:**
     ```
     https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook
     ```

   - **Description (optional):**
     ```
     Allie production payment webhook
     ```

4. **Select Events to Listen For:**

   Click "Select events" and choose these **4 required events**:

   - ✅ **checkout.session.completed**
     - Triggers when: Payment succeeds
     - Handler: Creates family account, sends welcome email

   - ✅ **customer.subscription.updated**
     - Triggers when: Subscription status changes
     - Handler: Updates family subscription data

   - ✅ **customer.subscription.deleted**
     - Triggers when: Subscription cancels
     - Handler: Sets status to canceled, sends notification email

   - ✅ **invoice.payment_failed**
     - Triggers when: Payment fails
     - Handler: Sends payment failure email notification

5. **Click "Add endpoint"**

---

### Step 2: Get Webhook Signing Secret

After creating the endpoint, you'll see the webhook details page.

1. **Find the "Signing secret" section**

2. **Click "Reveal" next to the secret**

3. **Copy the secret** (starts with `whsec_...`)

   Example format: `whsec_[your_webhook_secret_here]`

---

### Step 3: Configure Firebase with Webhook Secret

**IMPORTANT:** Run these commands from the project root directory

```bash
cd /Users/stefanpalsson/parentload\ copy/parentload-clean

# Set the webhook secret (replace YOUR_SECRET_HERE with actual secret from Step 2)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"

# Verify configuration
firebase functions:config:get stripe.webhook_secret

# Redeploy the webhook function with new config
firebase deploy --only functions:stripeWebhook
```

---

### Step 4: Test the Webhook

#### Option A: Test in Stripe Dashboard

1. Go back to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event: `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check the response - should see `200 OK`

#### Option B: Test with Real Payment (Recommended)

1. **Open:** https://checkallie.com/onboarding

2. **Complete onboarding flow** with test family data

3. **On payment page**, click "Continue to Payment"

4. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

5. **Expected Results:**
   - ✅ Redirects to `/payment/success`
   - ✅ Shows "Processing Payment..." spinner
   - ✅ Family account created in Firestore
   - ✅ Welcome email sent
   - ✅ Subscription linked to familyId
   - ✅ Redirects to `/dashboard`

---

### Step 5: Monitor Webhook Logs

#### View Firebase Functions Logs:

```bash
# Watch webhook events in real-time
firebase functions:log --only stripeWebhook

# Or filter for Stripe-related logs
firebase functions:log | grep "stripe"
```

#### Expected Log Output:
```
📬 Webhook event type: checkout.session.completed
✅ Checkout completed for session: cs_test_...
✅ Checkout data stored, ready for family creation
```

#### Check Stripe Dashboard:
- Go to: https://dashboard.stripe.com/webhooks
- Click on your webhook endpoint
- View delivery attempts and responses
- Each webhook shows HTTP status and response body

---

## 🔍 Verification Checklist

After completing all steps, verify:

### Firestore Data:
1. Go to: Firebase Console → Firestore Database
2. Check `completedCheckouts` collection
3. Check `families/{familyId}` for subscription object:
   ```json
   {
     "subscription": {
       "stripeCustomerId": "cus_...",
       "stripeSubscriptionId": "sub_...",
       "status": "active",
       "currentPeriodEnd": Timestamp,
       "priceId": "price_...",
       "updatedAt": Timestamp
     }
   }
   ```

### Stripe Dashboard:
1. Go to: https://dashboard.stripe.com/customers
2. Find customer by email
3. Verify:
   - ✅ Customer exists
   - ✅ Active subscription
   - ✅ Metadata includes `familyId`

### Email Delivery:
1. Check inbox for test email
2. Verify email received:
   - Subject: "Welcome to Allie - Payment Confirmed! 🎉"
   - Contains dashboard link
   - From: stefan@checkallie.com

---

## 🐛 Troubleshooting

### Issue: Webhook events not processing

**Check:**
```bash
firebase functions:log --only stripeWebhook
```

**Common Causes:**
- ❌ Webhook secret not set → Run `firebase functions:config:set stripe.webhook_secret="..."`
- ❌ Wrong webhook URL → Should be `https://us-central1-parentload-ba995.cloudfunctions.net/stripeWebhook`
- ❌ Wrong events selected → Need all 4 events listed above
- ❌ Test mode vs Live mode mismatch → Ensure Stripe Dashboard is in Live mode

### Issue: Webhook signature verification fails

**Error in logs:**
```
❌ Webhook signature verification failed
```

**Solution:**
1. Verify webhook secret is correct
2. Check that secret starts with `whsec_`
3. Redeploy function after setting secret
4. Test webhook in Stripe Dashboard

### Issue: No email received

**Check:**
```bash
firebase functions:log | grep "email"
```

**Common Causes:**
- ❌ SendGrid API key not working
- ❌ Email in spam folder
- ❌ SendGrid from_email not verified

---

## ✅ Success Criteria

**Webhook is working when:**
1. ✅ Stripe Dashboard shows webhook as "Enabled"
2. ✅ Test webhook returns `200 OK`
3. ✅ Real payment creates family account
4. ✅ Welcome email is received
5. ✅ Firestore has correct subscription data
6. ✅ Firebase logs show successful webhook processing

---

## 🔐 Security Notes

- **Never commit** webhook secrets to git
- **Webhook secret** is stored in Firebase Functions config (encrypted)
- **Signature verification** prevents unauthorized webhook calls
- **User authentication** required for all callable functions

---

## 📞 Support

If you encounter issues:
1. Check Firebase Functions logs
2. Check Stripe webhook delivery logs
3. Verify all 4 events are configured
4. Ensure webhook secret is set correctly

Contact: stefan@checkallie.com
