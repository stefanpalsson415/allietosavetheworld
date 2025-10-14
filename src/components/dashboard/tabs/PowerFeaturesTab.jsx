// src/components/dashboard/tabs/PowerFeaturesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, TrendingUp, BarChart3, Clock, Users, AlertTriangle,
  CheckCircle, ArrowRight, Share2, FileText, Brain, Heart, Zap,
  Sparkles, Shield, Target, MessageCircle, Play, RotateCcw,
  ChevronDown, ChevronUp, Info, Activity, Layers, Network, Lightbulb
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';

// Import our Power Features services
import { AllieHarmonyDetectiveAgent } from '../../../services/agents/AllieHarmonyDetectiveAgent';
import { InvisibleLoadForensicsService } from '../../../services/forensics/InvisibleLoadForensicsService';
import { PowerFeaturesKnowledgeGraphIntegration } from '../../../services/quantum/PowerFeaturesKnowledgeGraphIntegration';
import { familyDNATracker } from '../../../services/dna/RealTimeFamilyDNATracker';
import ForensicsRevealScreen from '../../forensics/ForensicsRevealScreen';

// Import Power Features widgets
import HarmonyMonitoringWidget from '../../powerFeatures/HarmonyMonitoringWidget';
import FamilyDNAInsightsWidget from '../../powerFeatures/FamilyDNAInsightsWidget';
import PreemptiveInterventionWidget from '../../powerFeatures/PreemptiveInterventionWidget';

// Import intervention components
import MicroSurveyModal from '../../intervention/MicroSurveyModal';

// Import testing components
import PowerFeaturesTestDashboard from '../../testing/PowerFeaturesTestDashboard';

/**
 * Power Features Dashboard Tab
 *
 * Integrates the three groundbreaking power features:
 * 1. Invisible Load Forensics
 * 2. Preemptive Harmony Optimization
 * 3. Family Rhythm DNA Sequencing
 */
const PowerFeaturesTab = () => {
  const { familyId, familyMembers } = useFamily();
  const { openDrawer } = useChatDrawer();

  // Service instances
  const [harmonyAgent] = useState(() => new AllieHarmonyDetectiveAgent());
  const [forensicsService] = useState(() => new InvisibleLoadForensicsService());
  const [quantumIntegration] = useState(() => new PowerFeaturesKnowledgeGraphIntegration());

  // State management
  const [activeFeature, setActiveFeature] = useState(null);
  const [forensicsResults, setForensicsResults] = useState(null);
  const [harmonyData, setHarmonyData] = useState(null);
  const [familyDNA, setFamilyDNA] = useState(null);
  const [interventionStatus, setInterventionStatus] = useState(null);
  const [loading, setLoading] = useState({});
  const [showForensicsReveal, setShowForensicsReveal] = useState(false);
  const [dnaTrackingActive, setDnaTrackingActive] = useState(false);
  const [evolutionNotification, setEvolutionNotification] = useState(null);
  const [activeMicroSurvey, setActiveMicroSurvey] = useState(null);
  const [showMicroSurvey, setShowMicroSurvey] = useState(false);
  const [showTestDashboard, setShowTestDashboard] = useState(false);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    forensics: true,
    harmony: true,
    dna: true
  });

  // Initialize data on mount
  useEffect(() => {
    if (familyId) {
      loadInitialData();
      setupDNAEvolutionListener();
      setupInterventionListener();
    }
  }, [familyId]);

  // Setup DNA evolution event listener
  const setupDNAEvolutionListener = () => {
    const handleDNAEvolution = (event) => {
      if (event.detail.familyId === familyId) {
        setEvolutionNotification(event.detail);
        // Refresh DNA data after evolution
        loadFamilyDNAData();
      }
    };

    window.addEventListener('family-dna-evolution', handleDNAEvolution);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('family-dna-evolution', handleDNAEvolution);
    };
  };

  // Setup intervention event listener
  const setupInterventionListener = () => {
    const handleIntervention = (event) => {
      if (event.detail.familyId === familyId) {
        const intervention = event.detail.intervention;

        // Show micro-survey if it's that type
        if (intervention.type === 'micro_survey' && intervention.content) {
          setActiveMicroSurvey(intervention.content);
          setShowMicroSurvey(true);
        }

        // Refresh intervention status
        loadInterventionStatus();
      }
    };

    window.addEventListener('preemptive-intervention', handleIntervention);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('preemptive-intervention', handleIntervention);
    };
  };

  const loadInitialData = async () => {
    setLoading({ forensics: true, harmony: true, dna: true, intervention: true });

    try {
      // Load harmony overview
      const harmonyOverview = await harmonyAgent.getHarmonyOverview(familyId);
      setHarmonyData(harmonyOverview);

      // Load family DNA snapshot
      const dnaSnapshot = await harmonyAgent.getFamilyDNASnapshot(familyId);
      setFamilyDNA(dnaSnapshot);
      setDnaTrackingActive(dnaSnapshot.trackingActive || false);

      // Load intervention status
      const interventionData = harmonyAgent.getInterventionStatus(familyId);
      setInterventionStatus(interventionData);

    } catch (error) {
      console.error('Error loading power features data:', error);
    } finally {
      setLoading({});
    }
  };

  // Reload intervention status
  const loadInterventionStatus = async () => {
    try {
      const interventionData = harmonyAgent.getInterventionStatus(familyId);
      setInterventionStatus(interventionData);
    } catch (error) {
      console.error('Error loading intervention status:', error);
    }
  };

  // Reload just the DNA data
  const loadFamilyDNAData = async () => {
    try {
      const dnaSnapshot = await harmonyAgent.getFamilyDNASnapshot(familyId);
      setFamilyDNA(dnaSnapshot);
      setDnaTrackingActive(dnaSnapshot.trackingActive || false);
    } catch (error) {
      console.error('Error loading DNA data:', error);
    }
  };

  // Handle forensics investigation
  const handleForensicsInvestigation = async (memberId = null) => {
    setLoading(prev => ({ ...prev, forensics: true }));

    try {
      const investigation = await harmonyAgent.conductInvestigation(familyId, {
        type: 'cognitive_load_imbalance',
        targetMember: memberId
      });

      const forensicsResults = await forensicsService.conductForensicAnalysis(
        familyId,
        memberId,
        { timeRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() } }
      );

      setForensicsResults(forensicsResults);
      setShowForensicsReveal(true);

    } catch (error) {
      console.error('Forensics investigation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, forensics: false }));
    }
  };

  // Handle harmony monitoring
  const handleHarmonyMonitoring = async () => {
    setLoading(prev => ({ ...prev, harmony: true }));

    try {
      const harmonyAnalysis = await harmonyAgent.monitorHarmony(familyId, {
        realTime: true,
        includeInsights: true
      });

      setHarmonyData(harmonyAnalysis);
      setActiveFeature('harmony');

    } catch (error) {
      console.error('Harmony monitoring failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, harmony: false }));
    }
  };

  // Handle family DNA analysis
  const handleFamilyDNAAnalysis = async () => {
    setLoading(prev => ({ ...prev, dna: true }));

    try {
      const dnaAnalysis = await harmonyAgent.explainFamilyDNA(familyId, {
        focus: 'communication_patterns',
        includeEvolution: true
      });

      setFamilyDNA(dnaAnalysis);
      setActiveFeature('dna');

    } catch (error) {
      console.error('Family DNA analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, dna: false }));
    }
  };

  // Start DNA tracking
  const handleStartDNATracking = async () => {
    setLoading(prev => ({ ...prev, dna: true }));

    try {
      const result = await harmonyAgent.startDNATracking(familyId);

      if (result.success) {
        setDnaTrackingActive(true);
        // Refresh DNA data to show tracking is active
        await loadFamilyDNAData();

        // Show success message via chat
        openDrawer({
          initialMessage: "🧬 Amazing! I've started tracking your family's DNA evolution in real-time. I'll notify you when I detect significant pattern changes or growth!",
          context: { type: 'dna_tracking_started' }
        });
      } else {
        console.error('Failed to start DNA tracking:', result.error);
      }
    } catch (error) {
      console.error('DNA tracking failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, dna: false }));
    }
  };

  // Stop DNA tracking
  const handleStopDNATracking = async () => {
    try {
      const result = harmonyAgent.stopDNATracking(familyId);

      if (result.success) {
        setDnaTrackingActive(false);
        await loadFamilyDNAData();
      }
    } catch (error) {
      console.error('Error stopping DNA tracking:', error);
    }
  };

  // Handle DNA evolution celebration
  const handleEvolutionCelebration = async () => {
    if (!evolutionNotification) return;

    try {
      const explanation = await harmonyAgent.explainDNAEvolution(familyId, evolutionNotification);

      openDrawer({
        initialMessage: `🎉 ${explanation.celebration.title}`,
        context: {
          type: 'dna_evolution_celebration',
          evolution: explanation,
          event: evolutionNotification
        }
      });

      // Clear notification after showing
      setEvolutionNotification(null);
    } catch (error) {
      console.error('Error explaining evolution:', error);
      setEvolutionNotification(null);
    }
  };

  // Start intervention monitoring
  const handleStartInterventionMonitoring = async () => {
    setLoading(prev => ({ ...prev, intervention: true }));

    try {
      const result = await harmonyAgent.startInterventionMonitoring(familyId, {
        sensitivity: 'balanced',
        frequency: 60000 // Check every minute
      });

      if (result.success) {
        await loadInterventionStatus();

        openDrawer({
          initialMessage: "🛡️ Excellent! I'm now monitoring your family for stress patterns and will intervene proactively to prevent conflicts before they happen.",
          context: { type: 'intervention_monitoring_started' }
        });
      } else {
        console.error('Failed to start intervention monitoring:', result.error);
      }
    } catch (error) {
      console.error('Intervention monitoring failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, intervention: false }));
    }
  };

  // Stop intervention monitoring
  const handleStopInterventionMonitoring = async () => {
    try {
      const result = harmonyAgent.stopInterventionMonitoring(familyId);

      if (result.success) {
        await loadInterventionStatus();
      }
    } catch (error) {
      console.error('Error stopping intervention monitoring:', error);
    }
  };

  // Handle micro-survey response
  const handleMicroSurveyResponse = async (option, index) => {
    try {
      console.log(`📋 Micro-survey response: ${option.text} (${option.action})`);

      // Generate response from Detective Agent
      const response = await harmonyAgent.generateInterventionResponse(
        familyId,
        'micro_survey',
        {
          selectedOption: option,
          optionIndex: index,
          survey: activeMicroSurvey
        }
      );

      // Show response in chat
      setTimeout(() => {
        openDrawer({
          initialMessage: response.response.acknowledgment || "Thank you for responding! That helps prevent stress from building up.",
          context: {
            type: 'micro_survey_response',
            intervention: response,
            originalSurvey: activeMicroSurvey
          }
        });
      }, 1500); // After thank you screen

      // Update intervention status
      await loadInterventionStatus();

      return { success: true };
    } catch (error) {
      console.error('Error handling micro-survey response:', error);
      return { success: false, error: error.message };
    }
  };

  // Dismiss micro-survey
  const handleMicroSurveyDismiss = () => {
    setShowMicroSurvey(false);
    setActiveMicroSurvey(null);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Share results
  const handleShare = (results, type) => {
    openDrawer({
      initialMessage: `Check out these ${type} insights from our family analysis!`,
      context: { type: 'power_features_share', data: results }
    });
  };

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center">
                <Sparkles className="w-8 h-8 mr-3" />
                Power Features
              </h1>
              <p className="text-blue-100">
                Revolutionary insights that transform invisible family dynamics into compelling discoveries
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">3</div>
              <div className="text-sm text-blue-200">Active Features</div>
            </div>
          </div>
        </div>

        {/* DNA Evolution Notification */}
        <AnimatePresence>
          {evolutionNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-xl p-6 text-white border-2 border-yellow-300 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">🎉 Family DNA Evolution Detected!</h3>
                    <p className="text-blue-100">
                      Your family evolved from {evolutionNotification.fromStage} to {evolutionNotification.toStage}!
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEvolutionCelebration}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    Learn More
                  </button>
                  <button
                    onClick={() => setEvolutionNotification(null)}
                    className="text-white hover:text-yellow-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Invisible Load Forensics */}
          <PowerFeatureCard
            title="Invisible Load Forensics"
            subtitle="AI Detective Investigation"
            icon={Search}
            color="blue"
            description="Uncover hidden cognitive load imbalances with forensic precision"
            status={forensicsResults ? 'Complete' : 'Ready'}
            isExpanded={expandedSections.forensics}
            onToggle={() => toggleSection('forensics')}
            isLoading={loading.forensics}
            onAction={() => handleForensicsInvestigation()}
            actionLabel="Start Investigation"
            data={forensicsResults && {
              evidence: forensicsResults.evidence?.length || 0,
              discrepancies: forensicsResults.discrepancies?.length || 0,
              hiddenLoad: Math.round((forensicsResults.hiddenLoadPercentage || 0)),
              revelations: forensicsResults.revelationMoments?.length || 0
            }}
          />

          {/* Preemptive Harmony Optimization */}
          <PowerFeatureCard
            title="Harmony Monitoring"
            subtitle="Real-time Family Dynamics"
            icon={Heart}
            color="green"
            description="Monitor and optimize family harmony before conflicts arise"
            status={harmonyData?.currentHarmonyLevel ? `${harmonyData.currentHarmonyLevel}% Harmony` : 'Monitoring'}
            isExpanded={expandedSections.harmony}
            onToggle={() => toggleSection('harmony')}
            isLoading={loading.harmony}
            onAction={handleHarmonyMonitoring}
            actionLabel="Analyze Harmony"
            data={harmonyData && {
              harmonyScore: harmonyData.currentHarmonyLevel || 75,
              stressIndicators: harmonyData.stressIndicators?.length || 0,
              recommendations: harmonyData.recommendations?.length || 0,
              cascadeRisk: harmonyData.cascadeRisk || 'Low'
            }}
          />

          {/* Family Rhythm DNA Sequencing */}
          <PowerFeatureCard
            title="Family DNA Sequencing"
            subtitle="Behavioral Pattern Analysis"
            icon={Network}
            color="purple"
            description="Decode your family's unique behavioral and communication DNA"
            status={familyDNA?.dnaSequence ? 'DNA Mapped' : 'Analyzing'}
            isExpanded={expandedSections.dna}
            onToggle={() => toggleSection('dna')}
            isLoading={loading.dna}
            onAction={handleFamilyDNAAnalysis}
            actionLabel="Sequence DNA"
            data={familyDNA && {
              patterns: familyDNA.patterns?.length || 0,
              strengths: familyDNA.strengths?.length || 0,
              opportunities: familyDNA.opportunities?.length || 0,
              evolution: familyDNA.evolutionStage || 'Growing'
            }}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              icon={Search}
              label="Family Investigation"
              onClick={() => handleForensicsInvestigation()}
              variant="primary"
            />
            <ActionButton
              icon={Activity}
              label="Harmony Pulse Check"
              onClick={handleHarmonyMonitoring}
              variant="secondary"
            />
            <ActionButton
              icon={Brain}
              label="DNA Analysis"
              onClick={handleFamilyDNAAnalysis}
              variant="tertiary"
            />
            <ActionButton
              icon={MessageCircle}
              label="Discuss with Allie"
              onClick={() => openDrawer({ context: { type: 'power_features' } })}
              variant="outline"
            />
            <ActionButton
              icon={Activity}
              label="System Health Test"
              onClick={() => setShowTestDashboard(true)}
              variant="accent"
            />
          </div>
        </div>

        {/* Power Features Widgets */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Harmony Monitoring Widget */}
          <HarmonyMonitoringWidget
            harmonyData={harmonyData}
            onRefresh={handleHarmonyMonitoring}
            onViewDetails={(section) => {
              setActiveFeature('harmony');
              if (section === 'recommendations') {
                openDrawer({
                  initialMessage: "Help me implement these harmony recommendations",
                  context: { type: 'harmony_recommendations', data: harmonyData }
                });
              }
            }}
            isLoading={loading.harmony}
          />

          {/* Family DNA Insights Widget */}
          <FamilyDNAInsightsWidget
            dnaData={familyDNA}
            onRefresh={handleFamilyDNAAnalysis}
            onViewDetails={(section) => {
              setActiveFeature('dna');
              if (section === 'evolution') {
                openDrawer({
                  initialMessage: "Tell me more about our family's evolution stage and what comes next",
                  context: { type: 'family_dna_evolution', data: familyDNA }
                });
              }
            }}
            onExplorePattern={(pattern) => {
              openDrawer({
                initialMessage: `Explain our family's ${pattern.name} pattern in detail`,
                context: { type: 'dna_pattern_exploration', data: pattern }
              });
            }}
            onStartTracking={handleStartDNATracking}
            onStopTracking={handleStopDNATracking}
            trackingActive={dnaTrackingActive}
            isLoading={loading.dna}
          />

          {/* Preemptive Intervention Widget */}
          <PreemptiveInterventionWidget
            monitoringData={interventionStatus}
            onStartMonitoring={handleStartInterventionMonitoring}
            onStopMonitoring={handleStopInterventionMonitoring}
            onRefresh={loadInterventionStatus}
            onViewDetails={() => {
              setActiveFeature('intervention');
              openDrawer({
                initialMessage: "Show me details about the intervention system and recent stress patterns",
                context: { type: 'intervention_details', data: interventionStatus }
              });
            }}
            isLoading={loading.intervention}
          />
        </div>

        {/* Recent Insights */}
        {(forensicsResults || harmonyData || familyDNA) && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Recent Insights
            </h3>
            <div className="space-y-3">
              {forensicsResults && (
                <InsightCard
                  type="forensics"
                  title="Cognitive Load Investigation Complete"
                  description={`Found ${forensicsResults.evidence?.length || 0} pieces of evidence revealing hidden load patterns`}
                  timestamp={new Date().toLocaleDateString()}
                  onShare={() => handleShare(forensicsResults, 'forensics')}
                />
              )}
              {harmonyData && (
                <InsightCard
                  type="harmony"
                  title="Harmony Analysis Updated"
                  description={`Current harmony level: ${harmonyData.currentHarmonyLevel || 75}% with ${harmonyData.recommendations?.length || 0} optimization suggestions`}
                  timestamp={new Date().toLocaleDateString()}
                  onShare={() => handleShare(harmonyData, 'harmony')}
                />
              )}
              {familyDNA && (
                <InsightCard
                  type="dna"
                  title="Family DNA Sequencing Complete"
                  description={`Identified ${familyDNA.patterns?.length || 0} key behavioral patterns in your family system`}
                  timestamp={new Date().toLocaleDateString()}
                  onShare={() => handleShare(familyDNA, 'family DNA')}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Forensics Reveal Modal */}
      <AnimatePresence>
        {showForensicsReveal && forensicsResults && (
          <ForensicsRevealScreen
            investigationResults={forensicsResults}
            onClose={() => setShowForensicsReveal(false)}
            onShare={() => handleShare(forensicsResults, 'investigation')}
            onCreatePlan={() => {
              setShowForensicsReveal(false);
              openDrawer({
                initialMessage: "Help me create an action plan based on these forensics results",
                context: { type: 'forensics_action_plan', data: forensicsResults }
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Micro-Survey Modal */}
      <MicroSurveyModal
        survey={activeMicroSurvey}
        isVisible={showMicroSurvey}
        onResponse={handleMicroSurveyResponse}
        onDismiss={handleMicroSurveyDismiss}
        urgency={activeMicroSurvey?.urgency || 'high'}
        timeRemaining={5000}
      />

      {/* Power Features Test Dashboard */}
      {showTestDashboard && (
        <PowerFeaturesTestDashboard />
      )}
    </>
  );
};

// Power Feature Card Component
const PowerFeatureCard = ({
  title, subtitle, icon: Icon, color, description, status,
  isExpanded, onToggle, isLoading, onAction, actionLabel, data
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`bg-white rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Icon className={`w-6 h-6 mr-3 ${iconColors[color]}`} />
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${iconColors[color]} bg-white`}>
              {status}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <p className="text-sm text-gray-700">{description}</p>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 p-4"
          >
            {data && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : `bg-${color}-600 hover:bg-${color}-700 text-white`
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Play className="w-4 h-4 mr-2" />
                  {actionLabel}
                </div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-green-600 hover:bg-green-700 text-white',
    tertiary: 'bg-purple-600 hover:bg-purple-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    accent: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );
};

// Insight Card Component
const InsightCard = ({ type, title, description, timestamp, onShare }) => {
  const typeColors = {
    forensics: 'text-blue-600 bg-blue-100',
    harmony: 'text-green-600 bg-green-100',
    dna: 'text-purple-600 bg-purple-100'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className={`px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`}>
          {type.toUpperCase()}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500">{timestamp}</p>
        </div>
      </div>
      <button
        onClick={onShare}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PowerFeaturesTab;