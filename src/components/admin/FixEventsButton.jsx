import React, { useState } from 'react';
import { Wrench, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { fixEventUserIds, smartFixEventUserIds } from '../../utils/fixEventUserIds';

const FixEventsButton = () => {
  const { currentUser } = useAuth();
  const { familyId, familyMembers } = useFamily();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFix = async (useSmartFix = false) => {
    setIsFixing(true);
    setResult(null);
    
    try {
      let fixResult;
      
      if (useSmartFix && familyMembers && familyMembers.length > 0) {
        // Use smart fix to assign based on attendees
        fixResult = await smartFixEventUserIds(familyId, familyMembers);
      } else {
        // Simple fix - assign all to current user
        const userId = currentUser?.uid || currentUser?.id;
        if (!userId) {
          throw new Error('No user ID available');
        }
        fixResult = await fixEventUserIds(familyId, userId);
      }
      
      setResult(fixResult);
      
      // Reload the page after successful fix to refresh events
      if (fixResult.success && fixResult.fixed > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsFixing(false);
      setShowConfirm(false);
    }
  };

  if (!familyId) {
    return null;
  }

  return (
    <>
      {/* Fix Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        disabled={isFixing}
      >
        {isFixing ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Wrench className="w-4 h-4" />
        )}
        Fix Event UserIds
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowConfirm(false)} />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Fix Events with Undefined User IDs</h3>
            
            <p className="text-gray-600 mb-4">
              Some events from Google Calendar sync don't have proper user IDs assigned. 
              Choose how to fix them:
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleFix(true)}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isFixing}
              >
                <div className="font-medium">Smart Fix (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Assign events to family members based on attendees
                </div>
              </button>
              
              <button
                onClick={() => handleFix(false)}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isFixing}
              >
                <div className="font-medium">Simple Fix</div>
                <div className="text-sm text-gray-600">
                  Assign all events to you ({currentUser?.email})
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isFixing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              {result.success ? (
                <div>
                  <div className="font-medium text-green-800">
                    Fixed {result.fixed} events!
                  </div>
                  {result.remaining > 0 && (
                    <div className="text-sm text-green-600">
                      {result.remaining} events still need attention
                    </div>
                  )}
                  <div className="text-sm text-green-600 mt-1">
                    Reloading page...
                  </div>
                </div>
              ) : (
                <div className="text-red-800">
                  Error: {result.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FixEventsButton;