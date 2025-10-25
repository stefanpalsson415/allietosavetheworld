/**
 * Stripe Firebase Functions Tests
 * Tests for backend Stripe integration functions
 */

// Mock Stripe BEFORE any other imports
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn()
    }
  },
  customers: {
    list: jest.fn(),
    create: jest.fn()
  },
  subscriptions: {
    update: jest.fn(),
    retrieve: jest.fn()
  },
  webhooks: {
    constructEvent: jest.fn()
  }
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

// Mock Firestore
const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  set: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      familyData: { familyName: 'Test' },
      email: 'test@test.com'
    }),
    ref: { delete: jest.fn() }
  }),
  update: jest.fn().mockResolvedValue({})
};

// Mock Firebase Admin BEFORE any imports
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => mockFirestore),
  credential: {
    cert: jest.fn()
  }
}));

// Add FieldValue to the mock
const admin = require('firebase-admin');
admin.firestore.FieldValue = {
  serverTimestamp: jest.fn(() => new Date()),
  arrayUnion: jest.fn((...args) => args),
  arrayRemove: jest.fn((...args) => args),
  increment: jest.fn((n) => n),
  delete: jest.fn()
};

// Set environment variable for Stripe key
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';

const test = require('firebase-functions-test')();

describe('Stripe Firebase Functions', () => {
  let functions;
  let stripeService;

  beforeAll(() => {
    // Initialize functions
    functions = require('../index');
    stripeService = require('../services/stripe-service');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Firestore mocks
    mockFirestore.collection.mockReturnThis();
    mockFirestore.doc.mockReturnThis();
    mockFirestore.set.mockResolvedValue({});
    mockFirestore.get.mockResolvedValue({
      exists: true,
      data: () => ({
        familyData: { familyName: 'Test' },
        email: 'test@test.com'
      }),
      ref: { delete: jest.fn() }
    });
    mockFirestore.update.mockResolvedValue({});
  });

  afterAll(() => {
    test.cleanup();
  });

  describe('createCheckoutSession', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.createCheckoutSession);

      await expect(
        wrapped({ priceId: 'price_123', familyData: {} })
      ).rejects.toThrow('User must be authenticated');
    });

    it('should require priceId parameter', async () => {
      const wrapped = test.wrap(functions.createCheckoutSession);

      await expect(
        wrapped(
          { familyData: {} },
          { auth: { uid: 'test-user', token: { email: 'test@test.com' } } }
        )
      ).rejects.toThrow('priceId is required');
    });

    it('should create temp checkout data', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_123' });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      });

      const wrapped = test.wrap(functions.createCheckoutSession);

      const result = await wrapped(
        {
          priceId: 'price_123',
          familyData: { familyName: 'Test Family' }
        },
        {
          auth: {
            uid: 'test-user',
            token: { email: 'test@test.com' }
          }
        }
      );

      expect(mockFirestore.set).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://checkout.stripe.com/test');
    });

    it('should create Stripe customer if not exists', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_123' });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      });

      const wrapped = test.wrap(functions.createCheckoutSession);

      await wrapped(
        { priceId: 'price_123', familyData: {} },
        { auth: { uid: 'test-user', token: { email: 'test@test.com' } } }
      );

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@test.com'
      });
    });

    it('should reuse existing Stripe customer', async () => {
      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_existing', email: 'test@test.com' }]
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      });

      const wrapped = test.wrap(functions.createCheckoutSession);

      await wrapped(
        { priceId: 'price_123', familyData: {} },
        { auth: { uid: 'test-user', token: { email: 'test@test.com' } } }
      );

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing'
        })
      );
    });
  });

  describe('stripeWebhook', () => {
    it('should verify webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const req = {
        headers: { 'stripe-signature': 'invalid' },
        rawBody: Buffer.from('test')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      const wrapped = test.wrap(functions.stripeWebhook);
      await wrapped(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Webhook Error'));
    });

    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            subscription: 'sub_123',
            customer: 'cus_123',
            metadata: { tempDataId: 'temp_123' }
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const req = {
        headers: { 'stripe-signature': 'valid' },
        rawBody: Buffer.from('test')
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      const wrapped = test.wrap(functions.stripeWebhook);
      await wrapped(req, res);

      expect(mockFirestore.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: { familyId: 'family_123' }
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const req = {
        headers: { 'stripe-signature': 'valid' },
        rawBody: Buffer.from('test')
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      const wrapped = test.wrap(functions.stripeWebhook);
      await wrapped(req, res);

      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'subscription.status': 'canceled'
        })
      );
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            customer_email: 'test@test.com'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const req = {
        headers: { 'stripe-signature': 'valid' },
        rawBody: Buffer.from('test')
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      const wrapped = test.wrap(functions.stripeWebhook);
      await wrapped(req, res);

      // Should log error and send email (mocked in actual implementation)
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('updateSubscriptionMetadata', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.updateSubscriptionMetadata);

      await expect(
        wrapped({ subscriptionId: 'sub_123', familyId: 'family_123' })
      ).rejects.toThrow('User must be authenticated');
    });

    it('should require subscriptionId and familyId', async () => {
      const wrapped = test.wrap(functions.updateSubscriptionMetadata);

      await expect(
        wrapped(
          { subscriptionId: 'sub_123' },
          { auth: { uid: 'test-user' } }
        )
      ).rejects.toThrow('subscriptionId and familyId are required');
    });

    it('should update Stripe subscription metadata', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({ id: 'sub_123' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_123' } }]
        }
      });

      const wrapped = test.wrap(functions.updateSubscriptionMetadata);

      const result = await wrapped(
        { subscriptionId: 'sub_123', familyId: 'family_123' },
        { auth: { uid: 'test-user' } }
      );

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        metadata: { familyId: 'family_123' }
      });
      expect(mockFirestore.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should update family document with subscription data', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({ id: 'sub_123' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: 'price_123' } }]
        }
      });

      const wrapped = test.wrap(functions.updateSubscriptionMetadata);

      await wrapped(
        { subscriptionId: 'sub_123', familyId: 'family_123' },
        { auth: { uid: 'test-user' } }
      );

      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription: expect.objectContaining({
            stripeCustomerId: 'cus_123',
            stripeSubscriptionId: 'sub_123',
            status: 'active',
            priceId: 'price_123'
          })
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.cancelSubscription);

      await expect(
        wrapped({ subscriptionId: 'sub_123' })
      ).rejects.toThrow('User must be authenticated');
    });

    it('should set cancel_at_period_end to true', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: true,
        current_period_end: 1234567890
      });

      const wrapped = test.wrap(functions.cancelSubscription);

      const result = await wrapped(
        { subscriptionId: 'sub_123' },
        { auth: { uid: 'test-user' } }
      );

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true
      });
      expect(result.success).toBe(true);
    });
  });

  describe('reactivateSubscription', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(functions.reactivateSubscription);

      await expect(
        wrapped({ subscriptionId: 'sub_123' })
      ).rejects.toThrow('User must be authenticated');
    });

    it('should set cancel_at_period_end to false', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: false
      });

      const wrapped = test.wrap(functions.reactivateSubscription);

      const result = await wrapped(
        { subscriptionId: 'sub_123' },
        { auth: { uid: 'test-user' } }
      );

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: false
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_existing', email: 'test@test.com' }]
      });

      const stripeService = require('../services/stripe-service');
      const customer = await stripeService.getOrCreateCustomer('test@test.com');

      expect(customer.id).toBe('cus_existing');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      mockStripe.customers.list.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new',
        email: 'test@test.com'
      });

      const stripeService = require('../services/stripe-service');
      const customer = await stripeService.getOrCreateCustomer('test@test.com');

      expect(customer.id).toBe('cus_new');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@test.com'
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create session with correct parameters', async () => {
      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_123' }]
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      });

      const stripeService = require('../services/stripe-service');
      const result = await stripeService.createCheckoutSession({
        priceId: 'price_123',
        customerEmail: 'test@test.com',
        familyData: { familyName: 'Test', tempDataId: 'temp_123' },
        successUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel'
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          line_items: [{ price: 'price_123', quantity: 1 }],
          mode: 'subscription',
          success_url: 'https://test.com/success',
          cancel_url: 'https://test.com/cancel',
          allow_promotion_codes: true,
          billing_address_collection: 'required'
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
