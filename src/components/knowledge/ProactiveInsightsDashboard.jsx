/**
 * ProactiveInsightsDashboard.jsx
 * 
 * Dashboard component for displaying and managing proactive insights
 * generated from the knowledge graph.
 */

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import ProactiveInsightEngine from '../../services/knowledge/ProactiveInsightEngine';
import InsightCard from './InsightCard';
import InsightPreferences from './InsightPreferences';
import NotificationCenter from './NotificationCenter';

// Severity level colors
const severityColors = {
  high: 'bg-red-100 border-red-500 text-red-800',
  medium: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  low: 'bg-blue-100 border-blue-500 text-blue-800'
};

// Insight type icons
const insightTypeIcons = {
  workload_imbalance: '⚖️',
  upcoming_events: '📅',
  task_overdue: '⏰',
  child_needs: '👶',
  relationship_health: '❤️',
  medical_reminder: '💊',
  document_update: '📄',
  milestone_alert: '🏆',
  scheduling_conflict: '⚠️'
};

const ProactiveInsightsDashboard = () => {
  const { currentUser } = useAuth();
  const { familyId, familyMembers } = useFamily();
  
  const [insights, setInsights] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [insightTypes, setInsightTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  
  useEffect(() => {
    const loadData = async () => {
      if (familyId) {
        setIsLoading(true);
        try {
          // Get active insights
          const insightOptions = { limit: 50 };
          const insightResult = await loadInsights(familyId, insightOptions);
          setInsights(insightResult || []);
          
          // Get notifications
          const notificationOptions = { limit: 25 };
          const notificationsResult = await ProactiveInsightEngine.getActiveNotifications(
            familyId, 
            notificationOptions
          );
          setNotifications(notificationsResult || []);
          
          // Extract unique insight types for filtering
          const types = insightResult.reduce((acc, insight) => {
            if (!acc.includes(insight.type)) {
              acc.push(insight.type);
            }
            return acc;
          }, []);
          
          setInsightTypes(types);
        } catch (error) {
          console.error('Error loading insights data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [familyId]);
  
  // Load insights with optional filters
  const loadInsights = async (familyId, options = {}) => {
    try {
      // This function would need to be implemented in ProactiveInsightEngine
      // For now, we'll simulate by using an API endpoint that returns insights from Firestore
      const querySnapshot = await ProactiveInsightEngine.getInsights(familyId, options);
      return querySnapshot;
    } catch (error) {
      console.error('Error loading insights:', error);
      return [];
    }
  };
  
  // Filter insights based on selected criteria
  const filteredInsights = insights.filter(insight => {
    const typeMatch = selectedType === 'all' || insight.type === selectedType;
    const severityMatch = selectedSeverity === 'all' || insight.severity === selectedSeverity;
    return typeMatch && severityMatch;
  });
  
  // Handle insight action
  const handleInsightAction = async (insight, actionIndex) => {
    try {
      if (currentUser?.uid && insight.id) {
        await ProactiveInsightEngine.markNotificationActionCompleted(
          familyId,
          insight.id,
          actionIndex,
          currentUser.uid
        );
        
        // Refresh insights
        const updated = await loadInsights(familyId);
        setInsights(updated || []);
      }
    } catch (error) {
      console.error('Error handling insight action:', error);
    }
  };
  
  // Mark insight as seen
  const handleMarkSeen = async (insightId) => {
    try {
      if (currentUser?.uid) {
        await ProactiveInsightEngine.markNotificationSeen(
          familyId,
          insightId,
          currentUser.uid
        );
        
        // Update local state to reflect the change
        setInsights(insights.map(insight => {
          if (insight.id === insightId) {
            return {
              ...insight,
              seenBy: [...(insight.seenBy || []), currentUser.uid]
            };
          }
          return insight;
        }));
      }
    } catch (error) {
      console.error('Error marking insight as seen:', error);
    }
  };
  
  // Dismiss insight
  const handleDismiss = async (insightId) => {
    try {
      await ProactiveInsightEngine.dismissNotification(
        familyId,
        insightId
      );
      
      // Remove from local state
      setInsights(insights.filter(insight => insight.id !== insightId));
      setNotifications(notifications.filter(notification => notification.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };
  
  // Generate new insights on demand
  const handleGenerateInsights = async () => {
    setIsLoading(true);
    try {
      const result = await ProactiveInsightEngine.generateInsights(familyId, {
        generateNotifications: true,
        immediate: true
      });
      
      // Refresh data
      const insightResult = await loadInsights(familyId);
      setInsights(insightResult || []);
      
      const notificationsResult = await ProactiveInsightEngine.getActiveNotifications(
        familyId, 
        { limit: 25 }
      );
      setNotifications(notificationsResult || []);
      
      return result;
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Schedule regular insight generation
  const handleScheduleInsights = async (schedule) => {
    try {
      await ProactiveInsightEngine.scheduleInsightsGeneration(
        familyId,
        schedule
      );
    } catch (error) {
      console.error('Error scheduling insights:', error);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Family Insights</h1>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'insights' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'notifications' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'preferences' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>
      
      {/* Insights tab */}
      {activeTab === 'insights' && (
        <>
          <div className="flex flex-wrap justify-between items-center mb-4">
            <div className="flex flex-wrap items-center">
              <div className="mr-4 mb-2">
                <label className="mr-2 text-sm font-medium">Type:</label>
                <select 
                  className="border rounded px-2 py-1"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {insightTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mr-4 mb-2">
                <label className="mr-2 text-sm font-medium">Severity:</label>
                <select 
                  className="border rounded px-2 py-1"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-2"
              onClick={handleGenerateInsights}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Generate New Insights'}
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading insights...</p>
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <p className="text-gray-500">No insights available for the selected filters.</p>
              <p className="text-gray-500 mt-2">Try changing your filters or generate new insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  currentUserId={currentUser?.uid}
                  onActionComplete={(actionIndex) => handleInsightAction(insight, actionIndex)}
                  onMarkSeen={() => handleMarkSeen(insight.id)}
                  onDismiss={() => handleDismiss(insight.id)}
                  typeIcon={insightTypeIcons[insight.type] || '📊'}
                  severityClass={severityColors[insight.severity] || 'bg-gray-100 border-gray-500'}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <NotificationCenter
          notifications={notifications}
          currentUserId={currentUser?.uid}
          onMarkSeen={handleMarkSeen}
          onDismiss={handleDismiss}
          onActionComplete={handleInsightAction}
          isLoading={isLoading}
        />
      )}
      
      {/* Preferences tab */}
      {activeTab === 'preferences' && (
        <InsightPreferences
          familyId={familyId}
          onScheduleChange={handleScheduleInsights}
        />
      )}
    </div>
  );
};

export default ProactiveInsightsDashboard;