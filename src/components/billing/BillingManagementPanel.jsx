/**
 * BillingManagementPanel.jsx
 *
 * Comprehensive billing management section for Account & Security tab
 * Handles both usage-based and traditional subscription pricing
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Download, ChevronRight, TrendingUp, Calendar,
  DollarSign, CheckCircle, AlertCircle, X, Info, Sparkles,
  ExternalLink, FileText, Receipt, Shield, Zap
} from 'lucide-react';
import familyBalanceScoreService from '../../services/FamilyBalanceScoreService';
import PricingComparisonModal from '../payment/PricingComparisonModal';
import { useFamily } from '../../contexts/FamilyContext';

const BillingManagementPanel = () => {
  const { familyId } = useFamily();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoices, setInvoices] = useState([]);

  // TODO: Replace with actual Stripe subscription data
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'usage-based', // or 'monthly' or 'annual'
    status: 'active',
    currentPeriodEnd: new Date('2025-11-25'),
    currentBalance: 42, // For usage-based
    estimatedCharge: 42, // For usage-based
    hasBaseline: true
  });

  useEffect(() => {
    loadBillingData();
  }, [familyId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load improvement data for usage-based pricing
      const improvementData = await familyBalanceScoreService.getImprovement(familyId);
      setImprovement(improvementData);

      // TODO: Load actual billing data from Stripe
      // const stripeData = await stripeService.getSubscription(familyId);
      // setBillingData(stripeData);

      // Mock invoices for now
      setInvoices([
        {
          id: 'inv_001',
          date: new Date('2025-10-01'),
          amount: 38,
          status: 'paid',
          description: 'October 2025 - Usage-Based',
          downloadUrl: '#'
        },
        {
          id: 'inv_002',
          date: new Date('2025-09-01'),
          amount: 45,
          status: 'paid',
          description: 'September 2025 - Usage-Based',
          downloadUrl: '#'
        },
        {
          id: 'inv_003',
          date: new Date('2025-08-01'),
          amount: 50,
          status: 'paid',
          description: 'August 2025 - Usage-Based',
          downloadUrl: '#'
        }
      ]);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlan = (newPlan) => {
    console.log('Switching to plan:', newPlan);
    // TODO: Implement Stripe plan switching
    setShowPricingModal(false);
  };

  const handleCancelSubscription = async () => {
    console.log('Canceling subscription...');
    // TODO: Implement Stripe cancellation
    setShowCancelModal(false);
  };

  const calculateEstimatedCharge = () => {
    if (!improvement?.hasBaseline) return 0;
    const points = Math.max(0, improvement.improvement);
    return Math.min(50, points);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className={`rounded-xl border-2 overflow-hidden ${
        subscriptionData.plan === 'usage-based'
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
          : 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {subscriptionData.plan === 'usage-based' ? (
                  <Sparkles className="w-5 h-5 text-green-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="text-lg font-bold text-gray-900">
                  {subscriptionData.plan === 'usage-based' ? 'Usage-Based Plan' :
                   subscriptionData.plan === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {subscriptionData.plan === 'usage-based'
                  ? 'You only pay when Allie improves your family balance'
                  : 'Unlimited access with predictable billing'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscriptionData.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {subscriptionData.status === 'active' ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Inactive</span>
                </div>
              )}
            </div>
          </div>

          {/* Usage-Based Plan Details */}
          {subscriptionData.plan === 'usage-based' && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white bg-opacity-60 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">This Month's Improvement</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-green-600">
                    +{improvement?.improvement || 0}
                  </span>
                  <span className="text-sm text-gray-600">points</span>
                </div>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Great progress!</span>
                </div>
              </div>

              <div className="bg-white bg-opacity-60 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Estimated Charge</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-gray-900">
                    ${calculateEstimatedCharge()}
                  </span>
                  <span className="text-sm text-gray-600">this month</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {calculateEstimatedCharge() < 50 ? (
                    <span className="text-green-600">Under $50 cap</span>
                  ) : (
                    <span className="text-amber-600">At $50 maximum</span>
                  )}
                </div>
              </div>

              <div className="bg-white bg-opacity-60 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Next Billing Date</div>
                <div className="text-lg font-semibold text-gray-900">
                  {subscriptionData.currentPeriodEnd.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {Math.ceil((subscriptionData.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
              </div>
            </div>
          )}

          {/* Traditional Plan Details */}
          {subscriptionData.plan !== 'usage-based' && (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white bg-opacity-60 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-blue-600">
                    ${subscriptionData.plan === 'annual' ? '300' : '30'}
                  </span>
                  <span className="text-sm text-gray-600">
                    / {subscriptionData.plan === 'annual' ? 'year' : 'month'}
                  </span>
                </div>
                {subscriptionData.plan === 'annual' && (
                  <div className="mt-2 text-xs text-green-600">
                    Saving $60/year (17% off)
                  </div>
                )}
              </div>

              <div className="bg-white bg-opacity-60 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Next Billing Date</div>
                <div className="text-lg font-semibold text-gray-900">
                  {subscriptionData.currentPeriodEnd.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {Math.ceil((subscriptionData.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Switch Plan</span>
            </button>
            <button className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Update Payment</span>
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-semibold">Payment Method</h4>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Add New
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium">Visa ending in 4242</div>
                <div className="text-sm text-gray-600">Expires 12/2025</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                Default
              </span>
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-semibold">Billing History</h4>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    invoice.status === 'paid' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <Receipt className={`w-5 h-5 ${
                      invoice.status === 'paid' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{invoice.description}</div>
                    <div className="text-sm text-gray-600">
                      {invoice.date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                    <div className={`text-xs ${
                      invoice.status === 'paid' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Details (for usage-based customers) */}
      {subscriptionData.plan === 'usage-based' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How Usage-Based Pricing Works</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Your Family Balance Score is calculated weekly based on mental load, task distribution, harmony, and habits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>You pay $1 per point of improvement from your baseline, with a maximum of $50/month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>If your score decreases or stays the same, you pay $0 that month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>Switch to traditional pricing anytime if you prefer predictable billing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Comparison Modal */}
      <PricingComparisonModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSwitchPlan}
        familyId={familyId}
        currentImprovement={improvement}
      />

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your subscription? You'll lose access to all premium features at the end of your current billing period.
              </p>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingManagementPanel;
