/**
 * PricingComparisonModal.jsx
 *
 * Side-by-side comparison of Usage-Based vs Traditional pricing
 * Helps families choose the plan that works best for them
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, TrendingUp, Calendar, DollarSign, Sparkles,
  Zap, Shield, Heart, Award, Info, ArrowRight
} from 'lucide-react';
import familyBalanceScoreService from '../../services/FamilyBalanceScoreService';

const PricingComparisonModal = ({
  isOpen,
  onClose,
  onSelectPlan,
  familyId,
  currentImprovement = null // Optional: pass in current improvement data
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [estimatedCharge, setEstimatedCharge] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'annual'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && familyId) {
      loadImprovementData();
    }
  }, [isOpen, familyId]);

  const loadImprovementData = async () => {
    try {
      setLoading(true);
      const data = currentImprovement || await familyBalanceScoreService.getImprovement(familyId);
      setImprovement(data);

      if (data?.hasBaseline) {
        const points = Math.max(0, data.improvement);
        setEstimatedCharge(Math.min(50, points));
      } else {
        setEstimatedCharge(0); // First month free to establish baseline
      }
    } catch (error) {
      console.error('Error loading improvement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planType) => {
    setSelectedPlan(planType);
  };

  const handleContinue = () => {
    if (selectedPlan) {
      const planData = {
        type: selectedPlan,
        ...(selectedPlan === 'usage' ? {
          isMetered: true,
          currentCharge: estimatedCharge,
          hasBaseline: improvement?.hasBaseline
        } : {
          isMetered: false,
          interval: billingPeriod,
          price: billingPeriod === 'monthly' ? 30 : 300
        })
      };
      onSelectPlan(planData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-blue-100">Pick the pricing model that works best for your family</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Usage-Based Pricing Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan === 'usage'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => handleSelectPlan('usage')}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Revolutionary</span>
                  </div>
                  {selectedPlan === 'usage' && (
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Usage-Based Pricing
                </h3>
                <p className="text-gray-600 mb-6">
                  Only pay when Allie improves your family balance
                </p>

                {/* Price Display */}
                {loading ? (
                  <div className="animate-pulse h-20 bg-gray-200 rounded-lg mb-6"></div>
                ) : (
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 mb-6">
                    {improvement?.hasBaseline ? (
                      <>
                        <div className="text-center mb-4">
                          <div className="text-sm text-green-700 mb-1">Your estimated cost this month</div>
                          <div className="text-5xl font-bold text-green-600">
                            ${estimatedCharge}
                          </div>
                          <div className="text-sm text-green-600 mt-2">
                            Based on {improvement.improvement} points improvement
                          </div>
                        </div>
                        <div className="border-t border-green-200 pt-4">
                          <div className="flex items-center justify-between text-sm text-green-700">
                            <span>Rate:</span>
                            <span className="font-medium">$1 per point improved</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-green-700 mt-2">
                            <span>Monthly cap:</span>
                            <span className="font-medium">$50 maximum</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="text-5xl font-bold text-green-600 mb-2">
                          $0
                        </div>
                        <div className="text-sm text-green-700">
                          First month FREE while we establish your baseline
                        </div>
                        <div className="mt-4 bg-white bg-opacity-50 rounded-lg p-3">
                          <div className="text-xs text-green-600">
                            After baseline: $1 per point improved, max $50/month
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <FeatureItem
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                    text="Pay only for measurable improvements"
                  />
                  <FeatureItem
                    icon={<Shield className="w-5 h-5 text-green-500" />}
                    text="$50/month maximum (never more)"
                  />
                  <FeatureItem
                    icon={<Zap className="w-5 h-5 text-green-500" />}
                    text="First month FREE to establish baseline"
                  />
                  <FeatureItem
                    icon={<Award className="w-5 h-5 text-green-500" />}
                    text="Celebrate improvements with pricing"
                  />
                  <FeatureItem
                    icon={<Heart className="w-5 h-5 text-green-500" />}
                    text="Incentivizes real family harmony"
                  />
                </div>

                {/* Best For */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900 mb-1">Best for families who:</div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Want to try Allie risk-free</li>
                        <li>• Value results over subscriptions</li>
                        <li>• Enjoy gamification & milestones</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Traditional Pricing Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan === 'traditional'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => handleSelectPlan('traditional')}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Classic
                  </div>
                  {selectedPlan === 'traditional' && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Traditional Pricing
                </h3>
                <p className="text-gray-600 mb-6">
                  Simple, predictable monthly or annual billing
                </p>

                {/* Billing Period Toggle */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBillingPeriod('monthly');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBillingPeriod('annual');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      billingPeriod === 'annual'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Annual
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      Save 17%
                    </span>
                  </button>
                </div>

                {/* Price Display */}
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 mb-1">
                      {billingPeriod === 'monthly' ? 'Per month' : 'Per year'}
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                      <div className="text-5xl font-bold text-blue-600">
                        {billingPeriod === 'monthly' ? '30' : '300'}
                      </div>
                    </div>
                    {billingPeriod === 'annual' && (
                      <div className="text-sm text-blue-600 mt-2">
                        Just $25/month when paid annually
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <FeatureItem
                    icon={<Calendar className="w-5 h-5 text-blue-500" />}
                    text="Predictable monthly or annual billing"
                  />
                  <FeatureItem
                    icon={<Shield className="w-5 h-5 text-blue-500" />}
                    text="No surprises, same price every time"
                  />
                  <FeatureItem
                    icon={<Zap className="w-5 h-5 text-blue-500" />}
                    text="All premium features included"
                  />
                  <FeatureItem
                    icon={<Award className="w-5 h-5 text-blue-500" />}
                    text="Annual plan saves you 17%"
                  />
                  <FeatureItem
                    icon={<Heart className="w-5 h-5 text-blue-500" />}
                    text="Simple budgeting & planning"
                  />
                </div>

                {/* Best For */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 mb-1">Best for families who:</div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Prefer predictable expenses</li>
                        <li>• Want maximum simplicity</li>
                        <li>• Love annual discounts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Comparison Table */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Feature Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-green-600 font-medium">Usage-Based</th>
                      <th className="text-center py-3 px-4 text-blue-600 font-medium">Traditional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <ComparisonRow
                      feature="AI-Powered Family Assistant"
                      usageBased={true}
                      traditional={true}
                    />
                    <ComparisonRow
                      feature="Calendar & Event Management"
                      usageBased={true}
                      traditional={true}
                    />
                    <ComparisonRow
                      feature="Knowledge Graph Insights"
                      usageBased={true}
                      traditional={true}
                    />
                    <ComparisonRow
                      feature="Fair Play Card Sorting"
                      usageBased={true}
                      traditional={true}
                    />
                    <ComparisonRow
                      feature="Family Balance Score"
                      usageBased={true}
                      traditional={true}
                    />
                    <ComparisonRow
                      feature="First Month Cost"
                      usageBased="$0 (baseline)"
                      traditional="$30"
                    />
                    <ComparisonRow
                      feature="Typical Monthly Cost"
                      usageBased="$20-40"
                      traditional="$30"
                    />
                    <ComparisonRow
                      feature="Maximum Monthly Cost"
                      usageBased="$50"
                      traditional="$30"
                    />
                    <ComparisonRow
                      feature="Annual Discount"
                      usageBased={false}
                      traditional="17% off"
                    />
                    <ComparisonRow
                      feature="Switch Plans Anytime"
                      usageBased={true}
                      traditional={true}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Maybe Later
              </button>

              <button
                onClick={handleContinue}
                disabled={!selectedPlan}
                className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all ${
                  selectedPlan
                    ? selectedPlan === 'usage'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Continue with {selectedPlan === 'usage' ? 'Usage-Based' : selectedPlan === 'traditional' ? 'Traditional' : 'Selected'} Plan</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper Components
const FeatureItem = ({ icon, text }) => (
  <div className="flex items-center space-x-3">
    <div className="flex-shrink-0">{icon}</div>
    <span className="text-gray-700">{text}</span>
  </div>
);

const ComparisonRow = ({ feature, usageBased, traditional }) => (
  <tr>
    <td className="py-3 px-4 text-gray-900">{feature}</td>
    <td className="py-3 px-4 text-center">
      {typeof usageBased === 'boolean' ? (
        usageBased ? (
          <Check className="w-5 h-5 text-green-500 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-gray-300 mx-auto" />
        )
      ) : (
        <span className="text-green-600 font-medium">{usageBased}</span>
      )}
    </td>
    <td className="py-3 px-4 text-center">
      {typeof traditional === 'boolean' ? (
        traditional ? (
          <Check className="w-5 h-5 text-blue-500 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-gray-300 mx-auto" />
        )
      ) : (
        <span className="text-blue-600 font-medium">{traditional}</span>
      )}
    </td>
  </tr>
);

export default PricingComparisonModal;
