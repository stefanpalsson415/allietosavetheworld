import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import logger from '../../utils/logger';

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
        logger.info('Waiting for webhook to process checkout...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Fetch completed checkout data
        const db = getFirestore();
        const checkoutDoc = await getDoc(doc(db, 'completedCheckouts', sessionId));

        if (!checkoutDoc.exists()) {
          throw new Error('Payment data not found. Please contact support at stefan@checkallie.com');
        }

        const checkoutData = checkoutDoc.data();
        logger.info('Checkout data retrieved:', checkoutData.status);

        // Create the family using the stored data
        logger.info('Creating family from payment data...');
        const result = await createFamily(checkoutData.familyData);

        if (result?.familyId) {
          logger.info('Family created successfully:', result.familyId);

          // Link Stripe subscription to family
          if (checkoutData.subscription?.id) {
            try {
              logger.info('Linking subscription to family...');
              const functions = getFunctions();
              const updateSubscriptionMetadata = httpsCallable(functions, 'updateSubscriptionMetadata');
              await updateSubscriptionMetadata({
                subscriptionId: checkoutData.subscription.id,
                familyId: result.familyId
              });
              logger.info('Subscription linked successfully');
            } catch (linkError) {
              logger.error('Error linking subscription (non-blocking):', linkError);
              // Don't block family creation if linking fails - can be done later
            }
          }

          // Update checkout status
          await updateDoc(doc(db, 'completedCheckouts', sessionId), {
            status: 'family_created',
            familyId: result.familyId
          });

          // Navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                directAccess: true,
                familyId: result.familyId,
                newSubscription: true
              },
              replace: true
            });
          }, 2000);
        }
      } catch (error) {
        logger.error('Error processing payment:', error);
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
            className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800"
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
