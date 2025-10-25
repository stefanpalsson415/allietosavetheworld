const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Stripe with secret key from environment
let stripe;
try {
  const stripeKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.warn('⚠️ Stripe secret key not configured. Set with: firebase functions:config:set stripe.secret_key="sk_live_..."');
  } else {
    stripe = require('stripe')(stripeKey);
    console.log('✅ Stripe initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error);
}

class StripeService {
  /**
   * Create a Checkout Session for subscription payment
   */
  async createCheckoutSession({ priceId, customerEmail, familyData, successUrl, cancelUrl }) {
    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure stripe.secret_key.');
    }

    try {
      // Create or retrieve Stripe customer
      const customer = await this.getOrCreateCustomer(customerEmail);

      // Create session
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
          familyName: familyData.familyName || '',
          email: customerEmail,
          tempDataId: familyData.tempDataId || ''
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
      console.error('❌ Error creating checkout session:', error);
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
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    // Search for existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length > 0) {
      console.log(`✅ Found existing Stripe customer: ${customers.data[0].id}`);
      return customers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
    });
    console.log(`✅ Created new Stripe customer: ${customer.id}`);
    return customer;
  }

  /**
   * Handle subscription lifecycle events from webhooks
   */
  async handleSubscriptionUpdate(subscription) {
    const customerId = subscription.customer;
    const status = subscription.status;
    const familyId = subscription.metadata.familyId;

    if (!familyId) {
      console.warn('⚠️ Subscription has no familyId in metadata');
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

    console.log(`✅ Updated family ${familyId} subscription status to ${status}`);
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId) {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        cancelAt: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
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
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('❌ Error reactivating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Construct webhook event from Stripe signature
   */
  constructWebhookEvent(rawBody, signature) {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}

module.exports = new StripeService();
