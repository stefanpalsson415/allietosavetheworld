import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Brain, Shield, Database, ArrowLeft } from 'lucide-react';
import config from '../../config';
import logger from '../../utils/logger';



const PaymentScreen = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [familyCreated, setFamilyCreated] = useState(false);
    const [createdFamilyId, setCreatedFamilyId] = useState(null);

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
  
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
        {/* Whoops banner - positioned top-left corner */}
        <div
          className="fixed top-4 left-4 z-50"
        >
          <div
            className="relative bg-yellow-400 px-6 py-4 rounded-2xl border-4 border-yellow-500 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
            style={{
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-1">
                🎉 Whoops! 🎉
              </p>
              <p className="text-base text-gray-700 mb-2">
                Payments don't work yet!
              </p>
              <p className="text-sm text-gray-600">
                Email me at{' '}
                <a
                  href="mailto:stefan@checkallie.com"
                  className="text-blue-600 underline hover:text-blue-800 font-semibold"
                >
                  stefan@checkallie.com
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                for a code 🎫
              </p>
            </div>
          </div>
        </div>

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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 hover:shadow-md transition-all">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">Monthly Plan</h3>
                  <div className="text-3xl font-bold mt-2">$20<span className="text-lg font-normal text-gray-500">/month</span></div>
                  <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Unlimited family members</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Weekly AI recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Email progress reports</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Cancel anytime</span>
                  </li>
                </ul>
                
                <button 
  onClick={() => {
    setSelectedPlan('monthly');
    // Scroll to payment form after a short delay
    setTimeout(() => {
      document.getElementById('payment-details-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }}
  className={`w-full py-2 ${selectedPlan === 'monthly' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'} rounded-md hover:bg-gray-800 hover:text-white`}
>
  Select Monthly Plan
</button>
              </div>
              
              <div className="border rounded-lg p-6 hover:shadow-md transition-all relative">
                <div className="absolute top-0 right-0 bg-green-500 text-white py-1 px-3 text-xs transform translate-y-0 rounded-b-md">
                  BEST VALUE
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">Annual Plan</h3>
                  <div className="text-3xl font-bold mt-2">$180<span className="text-lg font-normal text-gray-500">/year</span></div>
                  <p className="text-sm text-gray-500 mt-1">$15/month, billed annually</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Everything in monthly plan</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Save 25% ($60/year)</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Premium support</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">Advanced progress analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">30-day money back guarantee</span>
                  </li>
                </ul>
                
                <button 
  onClick={() => {
    setSelectedPlan('annual');
    // Scroll to payment form after a short delay
    setTimeout(() => {
      document.getElementById('payment-details-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }}
  className={`w-full py-2 ${selectedPlan === 'annual' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'} rounded-md hover:bg-gray-800 hover:text-white`}
>
  Select Annual Plan
</button>
              </div>
            </div>
            
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
            <form onSubmit={handleSubmit} className="border-t pt-6" id="payment-details-section">

              <h3 className="text-xl font-medium mb-4">Payment Details</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Card Information</label>
                <div className="border rounded p-3">
                  <input 
                    type="text" 
                    className="w-full" 
                    placeholder="Card number" 
                  />
                  <div className="flex mt-2">
                    <input type="text" className="w-1/2 mr-2" placeholder="MM/YY" />
                    <input type="text" className="w-1/2" placeholder="CVC" />
                  </div>
                </div>
              </div>
                    
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Have a coupon?</label>
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
                    placeholder="Enter coupon code"
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
                    
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white rounded-md"
              >
                {loading ? 'Processing...' : `Complete Payment - ${selectedPlan === 'monthly' ? '$20/month' : '$180/year'}`}
              </button>
            </form>
          )}
        </div>
      </div>
    );
};

export default PaymentScreen;