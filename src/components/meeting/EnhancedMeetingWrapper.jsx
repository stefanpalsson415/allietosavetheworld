// src/components/meeting/EnhancedMeetingWrapper.jsx
// Progressive enhancement wrapper for Family Meeting with all 10 new features
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Download, User, Sparkles } from 'lucide-react';
import EnhancedFamilyMeeting from './EnhancedFamilyMeeting';
import FamilyAchievementsSection from './FamilyAchievementsSection';
import MissionConnectionSection from './MissionConnectionSection';
import KnowledgeGraphService from '../../services/KnowledgeGraphService';
import ClaudeService from '../../services/ClaudeService';
import PremiumVoiceService from '../../services/PremiumVoiceService';
import { useFamily } from '../../contexts/FamilyContext';
import {
  calculateCognitiveLoadTrend,
  predictUpcomingWeekLoad,
  detectHabitStreakAlerts,
  detectImbalanceTrends
} from '../../utils/predictions';

/**
 * Enhanced Meeting Wrapper
 * Adds all 10 enhancements to the base EnhancedFamilyMeeting component
 * Can be toggled on/off with feature flags
 */
const EnhancedMeetingWrapper = ({ onClose }) => {
  const { familyId, familyMembers, currentWeek } = useFamily();

  // Feature flags (can be controlled from settings)
  const [features, setFeatures] = useState({
    voiceMode: false,
    multiPerson: true,
    predictions: true,
    achievements: true,
    storyMode: false,
    missionAlignment: true,
    surveyIntegration: true,
    benchmarking: true,
    audioExport: true
  });

  // Enhanced data
  const [predictions, setPredictions] = useState(null);
  const [kgInsights, setKgInsights] = useState(null);
  const [familyStory, setFamilyStory] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Load enhanced data
  useEffect(() => {
    const loadEnhancedData = async () => {
      if (!familyId || !familyMembers || familyMembers.length === 0) return;

      try {
        // Load predictions if enabled
        if (features.predictions) {
          const predictionsData = await KnowledgeGraphService.getPredictiveInsights(
            familyId,
            familyMembers
          );
          if (predictionsData.success) {
            setPredictions(predictionsData.predictions);
          }
        }

        // Load KG insights
        const kgData = await KnowledgeGraphService.getInvisibleLaborAnalysis(familyId);
        if (kgData.success) {
          setKgInsights(kgData.data);
        }

        // Generate story narrative if enabled
        if (features.storyMode) {
          // This will be called after meeting data is loaded
          // For now, just set up the capability
        }
      } catch (error) {
        console.error('Error loading enhanced meeting data:', error);
      }
    };

    loadEnhancedData();
  }, [familyId, familyMembers, features.predictions, features.storyMode]);

  // Voice controls
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      PremiumVoiceService.stop();
    }
  };

  // Export meeting audio
  const exportAudio = async () => {
    if (!features.audioExport) return;

    try {
      // Generate summary text from meeting
      const summaryText = `Week ${currentWeek} Family Meeting Summary`;
      // TODO: Get actual meeting summary

      // Convert to speech
      const audioBlob = await PremiumVoiceService.generateAudio(summaryText, {
        voice: 'nova',
        speed: 0.95
      });

      // Download
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Family-Meeting-Week-${currentWeek}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audio:', error);
      alert('Audio export failed. Please try again.');
    }
  };

  return (
    <div className="relative">
      {/* Enhanced Controls Toolbar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
        {/* Voice Toggle */}
        {features.voiceMode && (
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={voiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        )}

        {/* Audio Export */}
        {features.audioExport && (
          <button
            onClick={exportAudio}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Export Audio Summary"
          >
            <Download className="w-5 h-5" />
          </button>
        )}

        {/* Story Mode Toggle */}
        {features.storyMode && (
          <button
            onClick={() => {
              // TODO: Toggle story mode in base component
            }}
            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            title="Story Mode"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Speaker Indicator */}
      {features.multiPerson && currentSpeaker && (
        <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
          <User className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            {currentSpeaker.name}
          </span>
        </div>
      )}

      {/* Multi-Person Selection (shown at start) */}
      {features.multiPerson && !currentSpeaker && (
        <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Who's participating?</h3>
          <div className="flex flex-wrap gap-2">
            {familyMembers
              .filter(m => m.role === 'parent' || m.isParent)
              .map(member => (
                <button
                  key={member.userId}
                  onClick={() => setCurrentSpeaker(member)}
                  className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                >
                  {member.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Base Enhanced Family Meeting Component */}
      <EnhancedFamilyMeeting
        onClose={onClose}
        enhancedData={{
          predictions,
          kgInsights,
          familyStory,
          currentSpeaker,
          voiceEnabled,
          features
        }}
      />

      {/* Floating Enhancement Indicators */}
      {predictions && (
        <div className="fixed bottom-4 left-4 z-40 bg-white rounded-lg shadow-lg p-3 max-w-sm">
          <h4 className="font-bold text-sm text-gray-800 mb-2">🔮 Insights Available</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {predictions.burnoutRisks && predictions.burnoutRisks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>{predictions.burnoutRisks.length} burnout alert{predictions.burnoutRisks.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {predictions.upcomingLoad && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Next week: {predictions.upcomingLoad.forecast}</span>
              </div>
            )}
            {predictions.habitStreaks && predictions.habitStreaks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{predictions.habitStreaks.length} habit streak{predictions.habitStreaks.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMeetingWrapper;
