import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Brain, Shield, Database, ArrowLeft, Sparkles } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import config from '../../config';
import logger from '../../utils/logger';
import PricingComparisonModal from './PricingComparisonModal';
import familyBalanceScoreService from '../../services/FamilyBalanceScoreService';



const PaymentScreen = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [familyCreated, setFamilyCreated] = useState(false);
    const [createdFamilyId, setCreatedFamilyId] = useState(null);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const [pendingFamilyData, setPendingFamilyData] = useState(null);
    const { createFamily, login, familyData, availableFamilies, currentUser } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);

    
    // Effect to load pending family data
    useEffect(() => {
      // Check for data passed in location state
      if (location?.state?.familyData) {
        setPendingFamilyData(location.state.familyData);
      }
      // Check for data in localStorage
      else {
        const storedData = localStorage.getItem('pendingFamilyData');
        if (storedData) {
          try {
            setPendingFamilyData(JSON.parse(storedData));
          } catch (e) {
            logger.error("Error parsing stored family data:", e);
          }
        }
      }
    }, [location]);

    // Effect to navigate when family data is ready (FIX for Oct 10: Same as OTP fix from Oct 8)
    useEffect(() => {
      // Only navigate if:
      // 1. Family creation was initiated (familyCreated flag is true)
      // 2. User is authenticated
      // 3. Family data OR available families are loaded
      if (familyCreated && currentUser && (familyData?.familyId || availableFamilies.length > 0)) {
        logger.info("Family data is ready, navigating to dashboard now");
        logger.info("FamilyId:", familyData?.familyId, "Available families:", availableFamilies.length);

        // Clear the flag
        setFamilyCreated(false);
        setLoading(false);

        // Navigate with the family ID
        navigate('/dashboard', {
          state: {
            directAccess: true,
            familyId: familyData?.familyId || availableFamilies[0]?.familyId
          },
          replace: true // Replace history entry so back button works correctly
        });
      }
    }, [familyCreated, currentUser, familyData, availableFamilies, navigate]);
    
    const handleSubmit = async (event) => {
      event.preventDefault();
      setLoading(true);
      
      try {
        // Check if coupon code is valid (now uses environment variable)
        if (config?.payment?.validCoupons?.includes(couponCode.toLowerCase())) {
          // Skip payment process and proceed directly
          logger.info('Free coupon applied');
          setCouponApplied(true);
          
          // Create the family and navigate directly to dashboard
          if (pendingFamilyData) {
            // Store a flag indicating payment is complete
            localStorage.setItem('paymentCompleted', 'true');
            
            try {
              logger.info("Creating family with data:", pendingFamilyData);
              
              // Smart email generation function
              const generateSmartEmail = (name, primaryEmail) => {
                // Extract the username and domain from primary email
                const [username, domain] = primaryEmail.split('@');
                // Create a clean version of the name (lowercase, no spaces)
                const cleanName = name.toLowerCase().replace(/\s/g, '');
                // Generate smart email: name+username@domain
                return `${cleanName}+${username}@${domain}`;
              };

              // Prepare family data for creation
              const familyDataForCreation = {
                ...pendingFamilyData,
                couponAccess: true, // Mark family as having free access via coupon
                couponCode: couponCode.toLowerCase(), // Store which coupon was used
                parents: pendingFamilyData.parents.map((parent, index) => {
                  // Check if this parent used Google Auth
                  if (parent.googleAuth && parent.googleAuth.authenticated) {
                    // Google Auth - preserve the googleAuth object
                    return {
                      ...parent,
                      googleAuth: parent.googleAuth
                    };
                  } else if (index === 0 && pendingFamilyData.emailVerified && pendingFamilyData.email) {
                    // First parent gets the verified email and their chosen password (or temp if not set)
                    return {
                      ...parent,
                      email: pendingFamilyData.email,
                      password: pendingFamilyData.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                    };
                  } else if (parent.email && parent.emailVerified) {
                    // If this parent has a verified email, use it
                    return {
                      ...parent,
                      email: parent.email,
                      password: parent.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                    };
                  } else {
                    // Include parents without verified emails - they'll get placeholder accounts
                    return {
                      ...parent,
                      email: parent.email || null,
                      password: null
                    };
                  }
                })
              };
              
              // Create the family in Firebase
              const result = await createFamily(familyDataForCreation);
              logger.info("Family creation result:", result);

              // Store the family ID in localStorage to help with debugging
              if (result && result.familyId) {
                localStorage.setItem('lastCreatedFamilyId', result.familyId);
                localStorage.setItem('selectedFamilyId', result.familyId);

                // Set a flag to ensure we use this new family
                localStorage.setItem('directFamilyAccess', JSON.stringify({
                  familyId: result.familyId,
                  familyName: pendingFamilyData.familyName,
                  timestamp: new Date().getTime()
                }));

                // Clear onboarding progress
                localStorage.removeItem('onboardingProgress');
                localStorage.removeItem('pendingFamilyData');

                // Set flags to trigger navigation when family data is ready (FIX: Wait for AuthContext)
                logger.info("Family created, waiting for AuthContext to load family data before navigating");
                setCreatedFamilyId(result.familyId);
                setFamilyCreated(true);
                // Keep loading=true, will be cleared by useEffect when navigation happens
              }
            } catch (error) {
              logger.error("Error creating family:", error);

              // Check for specific Firebase errors
              if (error.message?.includes('email-already-in-use') || error.code === 'auth/email-already-in-use') {
                setError(`The email ${pendingFamilyData.email} is already registered. Please log in instead or use a different email.`);
                // Optionally redirect to login after a delay
                setTimeout(() => {
                  navigate('/login', {
                    state: {
                      email: pendingFamilyData.email,
                      message: 'This email is already registered. Please log in.'
                    }
                  });
                }, 3000);
              } else if (error.existingEmails && error.existingEmails.length > 0) {
                // Handle case where emails exist but passwords don't match
                setError(`The email(s) ${error.existingEmails.join(', ')} already exist. Please log in with your existing account or use different emails.`);
                setTimeout(() => {
                  navigate('/login', {
                    state: {
                      email: error.existingEmails[0],
                      message: 'This email is already registered. Please log in with your existing password.'
                    }
                  });
                }, 4000);
              } else if (error.message?.includes('Missing or insufficient permissions')) {
                setError("Unable to create family account. Please try again or contact support.");
              } else if (error.message?.includes('No parent users could be created')) {
                setError("Unable to create user accounts. The emails may already be registered. Please try logging in instead.");
                setTimeout(() => {
                  navigate('/login');
                }, 3000);
              } else {
                setError("There was an error creating your family: " + (error.message || "Unknown error"));
              }
            }
          } else {
            logger.error("No pending family data available");
            setError("Missing family information. Please try again.");
          }
          return;
        }
        
        // Regular payment processing would happen here
        // ...
        
        // After successful payment, create family and navigate to dashboard
        if (pendingFamilyData) {
          localStorage.setItem('paymentCompleted', 'true');
          
          try {
            logger.info("Creating family after payment with data:", pendingFamilyData);
            
            // Smart email generation function
            const generateSmartEmail = (name, primaryEmail) => {
              // Extract the username and domain from primary email
              const [username, domain] = primaryEmail.split('@');
              // Create a clean version of the name (lowercase, no spaces)
              const cleanName = name.toLowerCase().replace(/\s/g, '');
              // Generate smart email: name+username@domain
              return `${cleanName}+${username}@${domain}`;
            };

            // Prepare family data for creation
            const familyDataForCreation = {
              ...pendingFamilyData,
              parents: pendingFamilyData.parents.map((parent, index) => {
                // Check if this parent used Google Auth
                if (parent.googleAuth && parent.googleAuth.authenticated) {
                  // Google Auth - preserve the googleAuth object
                  return {
                    ...parent,
                    googleAuth: parent.googleAuth
                  };
                } else if (index === 0 && pendingFamilyData.emailVerified && pendingFamilyData.email) {
                  // First parent gets the verified email and their chosen password (or temp if not set)
                  return {
                    ...parent,
                    email: pendingFamilyData.email,
                    password: pendingFamilyData.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                  };
                } else if (parent.email && parent.emailVerified) {
                  // If this parent has a verified email, use it
                  return {
                    ...parent,
                    email: parent.email,
                    password: parent.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                  };
                } else {
                  // Include parents without verified emails - they'll get placeholder accounts
                  return {
                    ...parent,
                    email: parent.email || null,
                    password: null
                  };
                }
              })
            };

            // Create the family in Firebase
            const result = await createFamily(familyDataForCreation);
            logger.info("Family creation result:", result);

            // Store the family ID in localStorage to help with debugging
            if (result && result.familyId) {
              localStorage.setItem('lastCreatedFamilyId', result.familyId);
              localStorage.setItem('selectedFamilyId', result.familyId);

              // Set a flag to ensure we use this new family
              localStorage.setItem('directFamilyAccess', JSON.stringify({
                familyId: result.familyId,
                familyName: pendingFamilyData.familyName,
                timestamp: new Date().getTime()
              }));

              // Clear onboarding progress
              localStorage.removeItem('onboardingProgress');
              localStorage.removeItem('pendingFamilyData');

              // Set flags to trigger navigation when family data is ready (FIX: Wait for AuthContext)
              logger.info("Family created, waiting for AuthContext to load family data before navigating");
              setCreatedFamilyId(result.familyId);
              setFamilyCreated(true);
              // Keep loading=true, will be cleared by useEffect when navigation happens
            }
          } catch (error) {
            logger.error("Error creating family:", error);
            setError("There was an error creating your family: " + (error.message || "Unknown error"));
            setLoading(false); // Clear loading on error
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        logger.error("Error in payment processing:", error);
        setError("An error occurred. Please try again.");
        setLoading(false); // Only clear loading on error
      }
      // Don't set loading=false in finally - let useEffect handle it after family data loads
    };
  
    const applyCoupon = (e) => {
      // Prevent any form submission
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Hard-code valid coupons for now since env variable might not be set
      const validCoupons = ['olytheawesome', 'freeforallie', 'familyfirst'];
      const trimmedCode = couponCode.trim().toLowerCase();

      if (!trimmedCode) {
        setError('Please enter a coupon code');
        return;
      }

      console.log('Applying coupon:', trimmedCode);
      console.log('Valid coupons:', validCoupons);
      console.log('Config coupons:', config?.payment?.validCoupons);

      if (validCoupons.includes(trimmedCode) ||
          config?.payment?.validCoupons?.includes(trimmedCode)) {
        setCouponApplied(true);
        setError(null);
        console.log('Coupon applied successfully!');
      } else {
        setError('Invalid coupon code');
        setCouponApplied(false);
      }
    };

    // Handle plan selection from modal
    const handlePlanSelection = (planDetails) => {
      logger.info('Plan selected:', planDetails);
      setSelectedPlanDetails(planDetails);
      setSelectedPlan(planDetails.type); // 'usage-based', 'monthly', or 'annual'
      setShowPricingModal(false);

      // Scroll to payment details section
      setTimeout(() => {
        document.getElementById('payment-details-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    };

    // Handle Stripe Checkout
    const handleStripeCheckout = async (planType) => {
      setLoading(true);
      setError(null);

      try {
        // Determine if this is usage-based or traditional pricing
        const isUsageBased = planType === 'usage-based';

        // Get the Stripe Price ID for this plan
        let priceId;
        if (isUsageBased) {
          // Usage-based will use metered billing (to be configured in Stripe)
          priceId = config.stripe.prices.usageBased || null;
        } else {
          priceId = planType === 'monthly'
            ? config.stripe.prices.monthly
            : config.stripe.prices.annual;
        }

        logger.info('Creating Stripe checkout session:', {
          planType,
          priceId,
          isUsageBased,
          selectedPlanDetails
        });

        // Call Firebase Function to create checkout session
        const functions = getFunctions();
        const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

        const result = await createCheckoutSession({
          priceId,
          familyData: pendingFamilyData,
          metadata: {
            pricingPlan: planType, // 'usage-based', 'monthly', or 'annual'
            ...(isUsageBased && { usageBasedPricing: true })
          }
        });

        logger.info('Checkout session created:', result.data);

        if (result.data.success) {
          // Redirect to Stripe Checkout
          logger.info('Redirecting to Stripe Checkout:', result.data.url);
          window.location.href = result.data.url;
        } else {
          throw new Error(result.data.error || 'Failed to create checkout session');
        }
      } catch (error) {
        logger.error('Error creating checkout session:', error);
        setError('Unable to start payment process. Please try again or contact support at stefan@checkallie.com');
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow">
          {/* Back button */}
          <button
            onClick={() => {
              // If we came from onboarding, restore the progress before going back
              if (location?.state?.fromOnboarding && pendingFamilyData) {
                // Restore the onboarding progress
                const onboardingData = {
                  step: 13, // Last step before payment
                  familyData: pendingFamilyData,
                  timestamp: new Date().getTime()
                };
                localStorage.setItem('onboardingProgress', JSON.stringify(onboardingData));
                navigate('/onboarding');
              } else {
                // Otherwise just go back
                navigate(-1);
              }
            }}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          
          <h2 className="text-3xl font-light mb-6">Choose Your Allie Plan</h2>

          <div className="mb-6">
            {/* Revolutionary Pricing Options */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 mb-6">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="text-purple-600 mr-3" size={32} />
                <h3 className="text-2xl font-bold text-gray-800">Revolutionary Pricing Models</h3>
              </div>

              <p className="text-center text-gray-700 mb-6 max-w-3xl mx-auto">
                We're the first family management app to offer <strong>usage-based pricing</strong> where you only pay
                when Allie measurably improves your family's balance. Or choose our traditional monthly/annual plans.
                You decide what works best for your family.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                  <h4 className="font-bold text-purple-700 mb-2">Usage-Based</h4>
                  <p className="text-sm text-gray-600 mb-2">Pay only for improvement</p>
                  <div className="text-2xl font-bold text-purple-700">$1<span className="text-sm font-normal">/point</span></div>
                  <p className="text-xs text-gray-500 mt-1">First month FREE · Max $50/month</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <h4 className="font-bold text-blue-700 mb-2">Monthly Plan</h4>
                  <p className="text-sm text-gray-600 mb-2">Predictable pricing</p>
                  <div className="text-2xl font-bold text-blue-700">€29.99<span className="text-sm font-normal">/month</span></div>
                  <p className="text-xs text-gray-500 mt-1">299 SEK · Cancel anytime</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                  <h4 className="font-bold text-green-700 mb-2">Annual Plan</h4>
                  <p className="text-sm text-gray-600 mb-2">Best value</p>
                  <div className="text-2xl font-bold text-green-700">€259<span className="text-sm font-normal">/year</span></div>
                  <p className="text-xs text-gray-500 mt-1">2,599 SEK · Save 28%</p>
                </div>
              </div>

              <button
                onClick={() => setShowPricingModal(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg"
              >
                Compare Plans & Choose What's Right for You
              </button>
            </div>

            {/* Selected Plan Display */}
            {selectedPlan && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-blue-900">Selected Plan</h4>
                    <p className="text-blue-700">
                      {selectedPlan === 'usage-based' && 'Usage-Based: Pay for Improvement'}
                      {selectedPlan === 'monthly' && 'Monthly Plan: €29.99/month'}
                      {selectedPlan === 'annual' && 'Annual Plan: €259/year (Save 28%)'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="px-4 py-2 bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Change Plan
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 bg-gray-100 p-6 rounded-lg">
              <h3 className="font-medium text-lg mb-3">What You're Paying For</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Brain className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Advanced AI Engine</h4>
                    <p className="text-xs text-gray-600">Powered by Claude, one of the world's most sophisticated AI models</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Shield className="text-green-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Privacy & Security</h4>
                    <p className="text-xs text-gray-600">Enterprise-grade encryption and data protection</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Database className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Secure Data Storage</h4>
                    <p className="text-xs text-gray-600">Your family's data securely stored and backed up</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {couponApplied ? (
            <div className="bg-green-100 p-4 rounded mb-4">
              <p className="text-green-800">Coupon applied successfully! Enjoy Allie at no cost.</p>
              <button
                onClick={async () => {
                  if (pendingFamilyData) {
                    setLoading(true);
                    try {
                      // Store a flag indicating payment is complete
                      localStorage.setItem('paymentCompleted', 'true');
                      
                      logger.info("Creating family with data:", pendingFamilyData);
                      
                      // Smart email generation function
                      const generateSmartEmail = (name, primaryEmail) => {
                        // Extract the username and domain from primary email
                        const [username, domain] = primaryEmail.split('@');
                        // Create a clean version of the name (lowercase, no spaces)
                        const cleanName = name.toLowerCase().replace(/\s/g, '');
                        // Generate smart email: name+username@domain
                        return `${cleanName}+${username}@${domain}`;
                      };

                      // Prepare family data for creation
                      const familyDataForCreation = {
                        ...pendingFamilyData,
                        couponAccess: true, // Mark family as having free access via coupon
                        couponCode: couponCode.toLowerCase(), // Store which coupon was used
                        parents: pendingFamilyData.parents.map((parent, index) => {
                          // Check if this parent used Google Auth
                          if (parent.googleAuth && parent.googleAuth.authenticated) {
                            // Google Auth - preserve the googleAuth object
                            return {
                              ...parent,
                              googleAuth: parent.googleAuth
                            };
                          } else if (index === 0 && pendingFamilyData.emailVerified && pendingFamilyData.email) {
                            // First parent gets the verified email and their chosen password (or temp if not set)
                            return {
                              ...parent,
                              email: pendingFamilyData.email,
                              password: pendingFamilyData.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                            };
                          } else if (parent.email && parent.emailVerified) {
                            // If this parent has a verified email, use it
                            return {
                              ...parent,
                              email: parent.email,
                              password: parent.password || `${config?.payment?.tempPasswordPrefix || 'Allie2024'}!`
                            };
                          } else {
                            // Include parents without verified emails - they'll get placeholder accounts
                            return {
                              ...parent,
                              email: parent.email || null,
                              password: null
                            };
                          }
                        })
                      };
                      
                      // Create the family in Firebase
                      const result = await createFamily(familyDataForCreation);
                      logger.info("Family creation result:", result);

                      // Store the family ID in localStorage to help with debugging
                      if (result && result.familyId) {
                        localStorage.setItem('lastCreatedFamilyId', result.familyId);
                        localStorage.setItem('selectedFamilyId', result.familyId);

                        // Set a flag to ensure we use this new family
                        localStorage.setItem('directFamilyAccess', JSON.stringify({
                          familyId: result.familyId,
                          familyName: pendingFamilyData.familyName,
                          timestamp: new Date().getTime()
                        }));

                        // Clear onboarding progress
                        localStorage.removeItem('onboardingProgress');
                        localStorage.removeItem('pendingFamilyData');

                        // Set flags to trigger navigation when family data is ready (FIX: Wait for AuthContext)
                        logger.info("Family created, waiting for AuthContext to load family data before navigating");
                        setCreatedFamilyId(result.familyId);
                        setFamilyCreated(true);
                        // Keep loading=true, will be cleared by useEffect when navigation happens
                      }
                    } catch (error) {
                      logger.error("Error creating family:", error);
                      setError("There was an error creating your family: " + (error.message || "Unknown error"));
                      setLoading(false); // Clear loading on error
                    }
                  } else {
                    logger.error("No pending family data available");
                    setError("Missing family information. Please try again.");
                  }
                }}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-md"
                disabled={loading}
              >
                {loading ? 'Creating your family...' : 'Start Using Allie'}
              </button>
            </div>
          ) : selectedPlan && (
            <div className="border-t pt-6" id="payment-details-section">
              <h3 className="text-xl font-medium mb-4">Complete Your Purchase</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Have a coupon code?</label>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-l"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCoupon(e);
                      }
                    }}
                    placeholder="Enter coupon code for free access"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-gray-200 rounded-r hover:bg-gray-300 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Secure Payment:</strong> You'll be redirected to Stripe's secure checkout page to complete your payment. All payment information is processed securely by Stripe.
                </p>
              </div>

              <button
                onClick={() => handleStripeCheckout(selectedPlan)}
                disabled={loading}
                className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Redirecting to checkout...' : `Continue to Payment - ${selectedPlan === 'monthly' ? '€29.99/month' : '€259/year'}`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Powered by Stripe • Secure payment processing
              </p>
            </div>
          )}
        </div>

        {/* Pricing Comparison Modal */}
        <PricingComparisonModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onSelectPlan={handlePlanSelection}
          familyId={null} // No familyId yet during onboarding
          currentImprovement={null} // Will show "First month FREE" message
        />
      </div>
    );
};

export default PaymentScreen;