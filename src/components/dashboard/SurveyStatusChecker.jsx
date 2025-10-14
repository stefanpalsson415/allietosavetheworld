import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Users,
  RefreshCw
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import DatabaseService from '../../services/DatabaseService';

const SurveyStatusChecker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const { familyMembers, familyId } = useFamily();

  const checkSurveyStatus = async () => {
    if (!familyId || !familyMembers) {
      console.log('Missing required data:', { familyId, hasFamilyMembers: !!familyMembers });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const statusData = {
        members: [],
        totalResponses: 0,
        completedCount: 0
      };

      // Get all family members' survey data
      for (const member of familyMembers) {
        const memberData = {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role || member.roleType,
          responses: 0,
          completed: false,
          lastUpdate: null
        };

        // Check user document for survey status
        try {
          const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('__name__', '==', member.id)
          ));
          
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            if (userData.surveys?.initial) {
              memberData.completed = userData.surveys.initial.completed || false;
              memberData.responses = userData.surveys.initial.responseCount || 0;
              memberData.lastUpdate = userData.surveys.initial.lastUpdate;
            }
          }
        } catch (e) {
          console.log('Could not fetch user doc for', member.name);
        }

        // Check survey responses collection
        try {
          // First try the new document ID pattern
          const docId = `${familyId}-${member.id}-initial`;
          const responseDoc = await getDoc(doc(db, 'surveyResponses', docId));
          
          if (responseDoc.exists()) {
            const data = responseDoc.data();
            // Prioritize actual response count over stored count to avoid stale data issues
            const actualResponseCount = Object.keys(data.responses || {}).length;
            const storedResponseCount = data.responseCount || 0;
            const docResponses = Math.max(actualResponseCount, storedResponseCount);
            
            // Log any discrepancies for debugging
            if (actualResponseCount !== storedResponseCount) {
              console.log(`Response count mismatch for ${member.name}: stored=${storedResponseCount}, actual=${actualResponseCount}`);
            }
            
            memberData.responses = Math.max(memberData.responses, docResponses);
            
            // Update completed status based on response count
            if (memberData.responses >= 72) {
              memberData.completed = true;
            }
          } else {
            // Fallback to query method for older data
            const responsesQuery = await getDocs(query(
              collection(db, 'surveyResponses'),
              where('memberId', '==', member.id),
              where('familyId', '==', familyId)
            ));

            let totalResponses = 0;
            responsesQuery.forEach(doc => {
              const data = doc.data();
              // Prioritize actual response count over stored count
              const actualCount = Object.keys(data.responses || {}).length;
              const storedCount = data.responseCount || 0;
              totalResponses += Math.max(actualCount, storedCount);
            });

            // Use the higher count (in case of discrepancy)
            memberData.responses = Math.max(memberData.responses, totalResponses);
            
            // Update completed status based on response count
            if (memberData.responses >= 72) {
              memberData.completed = true;
            }
          }
        } catch (e) {
          console.log('Could not fetch survey responses for', member.name);
        }

        statusData.members.push(memberData);
        statusData.totalResponses += memberData.responses;
        if (memberData.completed) statusData.completedCount++;
      }

      // Sort by response count (highest first)
      statusData.members.sort((a, b) => b.responses - a.responses);
      
      setSurveyData(statusData);
    } catch (error) {
      console.error('Error checking survey status:', error);
    }
    setLoading(false);
  };

  const repairResponseCounts = async () => {
    if (!familyId || !familyMembers) {
      console.log('Cannot repair: Missing required data');
      return;
    }

    setRepairing(true);
    try {
      console.log("🔧 Starting response count repair for all members...");

      let repaired = 0;
      let forceCompleted = 0;

      for (const member of familyMembers) {
        try {
          // First try normal repair
          const result = await DatabaseService.repairSurveyResponseCount(familyId, member.id, 'initial');
          if (result.fixed) {
            repaired++;
          }
          
          // If member has 70+ responses but isn't marked complete, force complete them
          if (result.count >= 70 && result.count < 72) {
            console.log(`🔧 ${member.name} has ${result.count} responses - attempting force completion`);
            const forceResult = await DatabaseService.forceCompleteSurvey(familyId, member.id, 'initial');
            if (forceResult.forced) {
              forceCompleted++;
              console.log(`✅ Force completed ${member.name}: ${forceResult.originalCount} → ${forceResult.newCount}`);
            }
          }
          
        } catch (error) {
          console.error(`Failed to repair ${member.name}:`, error);
        }
      }
      
      console.log(`✅ Repair complete: ${repaired} fixed, ${forceCompleted} force completed`);
      
      // Refresh data after repair
      await checkSurveyStatus();
      
    } catch (error) {
      console.error("Error during repair:", error);
    }
    setRepairing(false);
  };

  useEffect(() => {
    if (isOpen && familyId) {
      checkSurveyStatus();
    }
  }, [isOpen, familyId]);

  // ALWAYS disable in production - this is a development/debugging tool
  // The button should never appear on checkallie.com
  const isProduction = window.location.hostname === 'checkallie.com' ||
                       window.location.hostname === 'parentload-ba995.web.app' ||
                       window.location.hostname === 'parentload-ba995.firebaseapp.com';

  // Don't render anything in production - return early
  if (isProduction) {
    return null;
  }

  // Also check NODE_ENV as backup
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';

  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      {/* Floating button - Development only */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-all duration-200 z-40"
        title="Check Survey Status (Dev Only)"
      >
        <ClipboardCheck size={24} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClipboardCheck size={24} />
                <h2 className="text-xl font-semibold">Survey Completion Status</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin text-purple-600" size={32} />
                </div>
              ) : surveyData ? (
                <>
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                      <span className="text-sm text-gray-500">
                        {surveyData.completedCount} of {surveyData.members.length} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(surveyData.completedCount / surveyData.members.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Member List */}
                  <div className="space-y-3">
                    {surveyData.members.map(member => (
                      <div 
                        key={member.id}
                        className={`border rounded-lg p-4 ${
                          member.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`rounded-full p-2 ${
                              member.completed ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {member.completed ? (
                                <CheckCircle className="text-green-600" size={20} />
                              ) : (
                                <AlertCircle className="text-gray-400" size={20} />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{member.name}</h3>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {member.responses}
                              <span className="text-sm font-normal text-gray-500">/72</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.completed ? 'Complete' : `${Math.round((member.responses/72)*100)}% done`}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                member.completed 
                                  ? 'bg-green-500' 
                                  : 'bg-gradient-to-r from-orange-400 to-yellow-400'
                              }`}
                              style={{ width: `${Math.min(100, (member.responses/72)*100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Last update */}
                        {member.lastUpdate && (
                          <div className="mt-2 text-xs text-gray-400">
                            Last updated: {new Date(member.lastUpdate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total responses */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Total Family Responses:</span>
                      <span className="font-semibold">{surveyData.totalResponses}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No survey data found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-3 flex justify-between items-center bg-gray-50">
              <div className="text-xs text-gray-500">
                Initial survey requires 72 responses
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={repairResponseCounts}
                  disabled={loading || repairing}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
                  title="Fix response count discrepancies"
                >
                  <RefreshCw size={14} className={repairing ? 'animate-spin' : ''} />
                  <span>Fix Counts</span>
                </button>
                <button
                  onClick={checkSurveyStatus}
                  disabled={loading || repairing}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurveyStatusChecker;