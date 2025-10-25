# Stripe Integration Plan for Allie

## Overview
Transform the dummy payment page into a production-ready Stripe Checkout integration with subscription management.

## Phase 1: Setup & Configuration (30 mins)

### 1.1 Install Stripe Packages
```bash
# Frontend
npm install @stripe/stripe-js @stripe/react-stripe-js

# Backend (Firebase Functions)
cd functions
npm install stripe
```

### 1.2 Environment Variables

**`.env` (Frontend):**
```bash
# Add to existing .env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here  # Use test key initially
```

**`functions/.env` (Backend):**
```bash
# Add to functions/.env (create if doesn't exist)
STRIPE_SECRET_KEY=sk_test_your_key_here  # Use test key initially
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 1.3 Update .env.example
Add Stripe configuration section to document the new variables.

## Phase 2: Stripe Product Setup (15 mins)

### 2.1 Create Products in Stripe Dashboard
1. Log into https://dashboard.stripe.com/test/products
2. Create two products:
   - **Product 1:** "Allie Monthly Subscription"
     - Price: $20/month recurring
     - Copy the Price ID (starts with `price_`)

   - **Product 2:** "Allie Annual Subscription"
     - Price: $180/year recurring
     - Copy the Price ID (starts with `price_`)

3. Add Price IDs to config:

**`src/config.js`:**
```javascript
const config = {
  backend: {
    url: process.env.NODE_ENV === 'production'
      ? 'https://europe-west1-parentload-ba995.cloudfunctions.net/auth'
      : 'http://localhost:3002/api/auth'
  },
  stripe: {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    prices: {
      monthly: process.env.REACT_APP_STRIPE_MONTHLY_PRICE_ID || 'price_XXXXX',
      annual: process.env.REACT_APP_STRIPE_ANNUAL_PRICE_ID || 'price_YYYYY'
    }
  },
  payment: {
    validCoupons: ['olytheawesome', 'freeforallie', 'familyfirst'],
    tempPasswordPrefix: process.env.REACT_APP_TEMP_PASSWORD_PREFIX || 'Allie2024'
  }
};

export default config;
```

## Phase 3: Backend Implementation (1-2 hours)

### 3.1 Create Stripe Service
**`functions/services/stripe-service.js`:**
```javascript
const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const admin = require('firebase-admin');

class StripeService {
  /**
   * Create a Checkout Session for subscription payment
   */
  async createCheckoutSession({ priceId, customerEmail, familyData, successUrl, cancelUrl }) {
    try {
      // Create or retrieve Stripe customer
      const customer = await this.getOrCreateCustomer(customerEmail);

      // Store familyData in session metadata (Stripe allows 50 keys, 500 chars each)
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true, // Enable Stripe coupon codes
        metadata: {
          // Store minimal data needed to create family after payment
          familyName: familyData.familyName,
          parentName: familyData.parents[0]?.name || '',
          email: customerEmail
        },
        subscription_data: {
          metadata: {
            familyId: '', // Will be set after family creation
          }
        },
        // Collect billing address for tax compliance
        billing_address_collection: 'required',
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get existing customer or create new one
   */
  async getOrCreateCustomer(email) {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await stripe.customers.create({
      email: email,
    });
  }

  /**
   * Handle subscription lifecycle events from webhooks
   */
  async handleSubscriptionUpdate(subscription) {
    const customerId = subscription.customer;
    const status = subscription.status;
    const familyId = subscription.metadata.familyId;

    if (!familyId) {
      console.warn('Subscription has no familyId in metadata');
      return;
    }

    // Update family subscription status in Firestore
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        subscription: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: subscription.items.data[0].price.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });

    console.log(`Updated family ${familyId} subscription status to ${status}`);
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        cancelAt: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new StripeService();
```

### 3.2 Create Firebase Functions
**`functions/index.js`** (add these exports):

```javascript
const stripeService = require('./services/stripe-service');

/**
 * Create Stripe Checkout Session
 * Called from frontend when user selects a plan
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { priceId, familyData } = data;

  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument', 'priceId is required');
  }

  const customerEmail = context.auth.token.email;
  const successUrl = `${functions.config().app.url}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${functions.config().app.url}/payment`;

  // Store family data temporarily in Firestore
  // (Stripe metadata is limited, so we store full data separately)
  const tempDataRef = admin.firestore().collection('tempCheckoutData').doc();
  await tempDataRef.set({
    familyData: familyData,
    email: customerEmail,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
  });

  const result = await stripeService.createCheckoutSession({
    priceId,
    customerEmail,
    familyData: {
      familyName: familyData.familyName,
      tempDataId: tempDataRef.id // Store reference to full data
    },
    successUrl,
    cancelUrl
  });

  if (!result.success) {
    throw new functions.https.HttpsError('internal', result.error);
  }

  return result;
});

/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook event type:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await stripeService.handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Handle successful checkout
 * Create the family account after payment succeeds
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout completed for session:', session.id);

  const tempDataId = session.metadata.tempDataId;
  if (!tempDataId) {
    console.error('No tempDataId in session metadata');
    return;
  }

  // Retrieve full family data from temp storage
  const tempDataDoc = await admin.firestore()
    .collection('tempCheckoutData')
    .doc(tempDataId)
    .get();

  if (!tempDataDoc.exists) {
    console.error('Temp checkout data not found:', tempDataId);
    return;
  }

  const { familyData, email } = tempDataDoc.data();

  // Create the family (reuse existing createFamily logic from AuthContext)
  // This would need to be extracted into a callable function
  // For now, store the data and let the success page handle creation

  await admin.firestore()
    .collection('completedCheckouts')
    .doc(session.id)
    .set({
      sessionId: session.id,
      familyData: familyData,
      email: email,
      subscription: {
        id: session.subscription,
        customerId: session.customer
      },
      status: 'pending_family_creation',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  // Clean up temp data
  await tempDataDoc.ref.delete();

  console.log('Checkout data stored, ready for family creation');
}

async function handleSubscriptionDeleted(subscription) {
  const familyId = subscription.metadata.familyId;

  if (familyId) {
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        'subscription.status': 'canceled',
        'subscription.canceledAt': admin.firestore.FieldValue.serverTimestamp()
      });
  }
}

async function handlePaymentFailed(invoice) {
  console.error('Payment failed for invoice:', invoice.id);

  // Get customer email
  const customer = await stripe.customers.retrieve(invoice.customer);

  // Send email notification (integrate with SendGrid)
  // Notify family that payment failed
}

/**
 * Cancel subscription (callable from frontend)
 */
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { subscriptionId } = data;
  return await stripeService.cancelSubscription(subscriptionId);
});

/**
 * Reactivate subscription (callable from frontend)
 */
exports.reactivateSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { subscriptionId } = data;
  return await stripeService.reactivateSubscription(subscriptionId);
});
```

### 3.3 Set Firebase Config Variables
```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
firebase functions:config:set app.url="http://localhost:3000"  # Change to production URL for prod

# Deploy to apply config
firebase deploy --only functions
```

## Phase 4: Frontend Implementation (2-3 hours)

### 4.1 Create Stripe Context
**`src/contexts/StripeContext.jsx`:**
```javascript
import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import config from '../config';

const StripeContext = createContext();

export function useStripe() {
  return useContext(StripeContext);
}

const stripePromise = loadStripe(config.stripe.publishableKey);

export function StripeProvider({ children }) {
  return (
    <Elements stripe={stripePromise}>
      <StripeContext.Provider value={{}}>
        {children}
      </StripeContext.Provider>
    </Elements>
  );
}
```

### 4.2 Update PaymentScreen.jsx

**Key Changes:**
1. Remove yellow "Whoops!" banner
2. Replace dummy credit card inputs with Stripe Checkout redirect
3. Call `createCheckoutSession` Firebase Function
4. Redirect to Stripe Checkout page
5. Keep coupon logic for free access

**`src/components/payment/PaymentScreen.jsx`:**
```javascript
// Add imports
import { getFunctions, httpsCallable } from 'firebase/functions';

// Inside PaymentScreen component:
const functions = getFunctions();
const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

const handlePlanSelection = async (planType) => {
  setSelectedPlan(planType);
  setLoading(true);
  setError(null);

  try {
    // Get the Stripe Price ID for this plan
    const priceId = planType === 'monthly'
      ? config.stripe.prices.monthly
      : config.stripe.prices.annual;

    // Call Firebase Function to create checkout session
    const result = await createCheckoutSession({
      priceId,
      familyData: pendingFamilyData
    });

    if (result.data.success) {
      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    } else {
      throw new Error(result.data.error);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    setError('Unable to start payment process. Please try again.');
    setLoading(false);
  }
};

// Update plan selection buttons:
<button
  onClick={() => handlePlanSelection('monthly')}
  className="w-full py-2 bg-black text-white rounded-md hover:bg-gray-800"
  disabled={loading}
>
  {loading ? 'Processing...' : 'Select Monthly Plan'}
</button>
```

### 4.3 Create Payment Success Page
**`src/components/payment/PaymentSuccess.jsx`:**
```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { createFamily } = useAuth();

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('No payment session found');
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch completed checkout data
        const db = getFirestore();
        const checkoutDoc = await getDoc(doc(db, 'completedCheckouts', sessionId));

        if (!checkoutDoc.exists()) {
          throw new Error('Payment data not found. Please contact support.');
        }

        const checkoutData = checkoutDoc.data();

        // Create the family using the stored data
        const result = await createFamily(checkoutData.familyData);

        if (result?.familyId) {
          // Update subscription with familyId
          await updateDoc(doc(db, 'completedCheckouts', sessionId), {
            status: 'family_created',
            familyId: result.familyId
          });

          // Navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                directAccess: true,
                familyId: result.familyId
              },
              replace: true
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, createFamily, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Payment Error</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/payment')}
            className="w-full py-3 bg-black text-white rounded-md"
          >
            Return to Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4">Processing Payment...</h2>
            <p className="text-gray-600">Setting up your family account</p>
          </>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Redirecting you to your dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
```

### 4.4 Update App Routes
**`src/App.js`:**
```javascript
import PaymentSuccess from './components/payment/PaymentSuccess';

// Add route:
<Route path="/payment/success" element={<PaymentSuccess />} />
```

### 4.5 Wrap App with StripeProvider
**`src/index.js`:**
```javascript
import { StripeProvider } from './contexts/StripeContext';

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StripeProvider>
          <App />
        </StripeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

## Phase 5: Testing (1-2 hours)

### 5.1 Test Mode Credit Cards (Stripe provides these)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### 5.2 Test Webhook Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local functions
stripe listen --forward-to localhost:5001/parentload-ba995/us-central1/stripeWebhook

# Test webhook
stripe trigger checkout.session.completed
```

### 5.3 Test Checklist
- [ ] Monthly plan selection creates checkout session
- [ ] Annual plan selection creates checkout session
- [ ] Successful payment redirects to success page
- [ ] Family is created after payment
- [ ] User can log in and access dashboard
- [ ] Coupon codes still work for free access
- [ ] Payment failure shows error message
- [ ] Subscription appears in Stripe dashboard
- [ ] Webhook events are logged in Firebase

## Phase 6: Production Deployment (30 mins)

### 6.1 Switch to Live Keys
1. Get live keys from Stripe dashboard (https://dashboard.stripe.com/apikeys)
2. Update environment variables:
```bash
# Production .env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY

# Firebase config
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_KEY" --project production
firebase functions:config:set app.url="https://checkallie.com" --project production
```

### 6.2 Set Up Production Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://europe-west1-parentload-ba995.cloudfunctions.net/stripeWebhook`
3. Select events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
4. Copy webhook signing secret
5. Update Firebase config:
```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_PROD_SECRET" --project production
```

### 6.3 Deploy
```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy
```

### 6.4 Test in Production
- Complete a real payment (you can refund it later)
- Verify webhook events arrive
- Check Firestore for subscription data

## Phase 7: Subscription Management UI (Optional - 2-3 hours)

Add a settings page where users can:
- View current plan
- Cancel subscription
- Reactivate subscription
- Update payment method (Stripe Customer Portal)

**`src/components/settings/SubscriptionSettings.jsx`:**
```javascript
// Implementation details...
```

## Maintenance & Monitoring

### Daily
- Check Stripe dashboard for failed payments
- Monitor webhook event logs

### Weekly
- Review subscription analytics
- Check for declined cards (Stripe Smart Retries handles this automatically)

### Monthly
- Reconcile Stripe revenue with Firestore subscription records
- Update pricing if needed

## Cost Estimate
- Stripe fees: 2.9% + $0.30 per transaction
- Monthly subscription: $20 → Stripe keeps $0.88, you get $19.12
- Annual subscription: $180 → Stripe keeps $5.52, you get $174.48

## Security Checklist
- [ ] Never log API keys
- [ ] Verify webhook signatures
- [ ] Use Firebase Security Rules to protect subscription data
- [ ] Implement rate limiting on callable functions
- [ ] Enable Stripe Radar for fraud protection

## Support Resources
- Stripe Docs: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Firebase Functions + Stripe: https://github.com/stripe-samples/firebase-subscription-payments
- Stripe Support: support@stripe.com

---

**Estimated Total Implementation Time: 6-10 hours**

**Priority Order:**
1. Phase 1-3 (Backend setup) - Get payments working
2. Phase 4 (Frontend) - Update UI
3. Phase 5 (Testing) - Ensure everything works
4. Phase 6 (Production) - Go live
5. Phase 7 (Optional) - Subscription management
