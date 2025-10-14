// src/services/SurveyEngineKnowledgeGraphSync.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import familyKnowledgeGraph from './FamilyKnowledgeGraph';
import QuestionEffectivenessAnalyzer from './QuestionEffectivenessAnalyzer';
import ProgressiveSurveyAdapter from './ProgressiveSurveyAdapter';
import CrossFamilyLearningService from './CrossFamilyLearningService';
import PredictiveQuestionEngine from './PredictiveQuestionEngine';
import ContextAwareSurveyEngine from './ContextAwareSurveyEngine';
import MultiModalLearningService from './MultiModalLearningService';

/**
 * Service to sync all survey engine intelligence into the knowledge graph
 * Bridges the gap between the advanced survey features and knowledge representation
 */
class SurveyEngineKnowledgeGraphSync {
  constructor() {
    this.syncInterval = null;
    this.lastSyncTimestamp = new Map();
  }

  /**
   * Initialize automatic syncing for a family
   * @param {string} familyId - Family ID
   * @param {number} intervalMinutes - Sync interval in minutes
   */
  startAutoSync(familyId, intervalMinutes = 60) {
    console.log(`Starting auto-sync for family ${familyId} every ${intervalMinutes} minutes`);
    
    // Initial sync
    this.syncAllSurveyData(familyId);
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncAllSurveyData(familyId);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all survey engine data to knowledge graph
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} Sync results
   */
  async syncAllSurveyData(familyId) {
    try {
      console.log(`Starting comprehensive survey data sync for family ${familyId}`);
      
      const results = await Promise.all([
        this.syncEffectivenessData(familyId),
        this.syncProgressionData(familyId),
        this.syncBehavioralCorrelations(familyId),
        this.syncPredictiveInsights(familyId),
        this.syncContextualFactors(familyId),
        this.syncMultiModalInsights(familyId),
        this.syncCommunityPatterns(familyId)
      ]);

      const syncSummary = {
        familyId,
        timestamp: new Date(),
        effectiveness: results[0],
        progression: results[1],
        correlations: results[2],
        predictions: results[3],
        context: results[4],
        multiModal: results[5],
        community: results[6]
      };

      // Store sync summary
      await this.storeSyncSummary(familyId, syncSummary);
      
      console.log('Survey data sync completed', syncSummary);
      return syncSummary;
    } catch (error) {
      console.error('Error syncing survey data:', error);
      throw error;
    }
  }

  /**
   * Sync question effectiveness data
   * @private
   */
  async syncEffectivenessData(familyId) {
    try {
      // Get historical effectiveness data
      const effectivenessHistory = await QuestionEffectivenessAnalyzer.getHistoricalEffectiveness(
        familyId,
        5 // Last 5 analyses
      );

      let syncedCount = 0;

      for (const analysis of effectivenessHistory) {
        if (analysis.questionEffectiveness) {
          // Create nodes for effective questions
          for (const [questionId, effectiveness] of Object.entries(analysis.questionEffectiveness)) {
            if (effectiveness.effectivenessScore > 50) {
              // Create question effectiveness node
              const effectivenessNode = await familyKnowledgeGraph.addNode(familyId, {
                type: 'question_effectiveness',
                subtype: 'behavioral_driver',
                name: `Question Effectiveness: ${questionId}`,
                metadata: {
                  questionId,
                  questionText: effectiveness.questionText,
                  category: effectiveness.category,
                  effectivenessScore: effectiveness.effectivenessScore,
                  behaviorChange: effectiveness.behaviorChange,
                  taskChanges: effectiveness.taskChanges,
                  impact: effectiveness.impact,
                  surveyId: analysis.surveyId,
                  analysisDate: analysis.timestamp
                }
              });

              // Link to survey
              if (analysis.surveyId) {
                await familyKnowledgeGraph.addEdge(familyId, {
                  from: analysis.surveyId,
                  to: effectivenessNode.id,
                  type: 'has_effectiveness',
                  metadata: {
                    score: effectiveness.effectivenessScore,
                    impact: effectiveness.impact
                  }
                });
              }

              // Link to behavioral changes
              if (effectiveness.taskChanges && effectiveness.taskChanges.length > 0) {
                const behaviorNode = await familyKnowledgeGraph.addNode(familyId, {
                  type: 'behavioral_change',
                  subtype: 'task_redistribution',
                  name: `Behavior Change from ${questionId}`,
                  metadata: {
                    changes: effectiveness.taskChanges,
                    beforeAfter: effectiveness.beforeAfter,
                    improvementMetrics: effectiveness.improvementMetrics
                  }
                });

                await familyKnowledgeGraph.addEdge(familyId, {
                  from: effectivenessNode.id,
                  to: behaviorNode.id,
                  type: 'drives_behavior_change',
                  strength: effectiveness.effectivenessScore / 100,
                  metadata: {
                    changeType: 'task_redistribution',
                    impact: effectiveness.impact
                  }
                });
              }

              syncedCount++;
            }
          }
        }
      }

      return { effectivenessNodesSynced: syncedCount };
    } catch (error) {
      console.error('Error syncing effectiveness data:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync family progression data
   * @private
   */
  async syncProgressionData(familyId) {
    try {
      const progressData = await ProgressiveSurveyAdapter.assessFamilyProgress(familyId);
      
      // Create or update family progression node
      const progressionNode = await familyKnowledgeGraph.addNode(familyId, {
        type: 'family_progression',
        subtype: 'survey_maturity',
        name: `Family Survey Progress Level ${progressData.currentLevel}`,
        metadata: {
          currentLevel: progressData.currentLevel,
          levelName: this.getLevelName(progressData.currentLevel),
          surveysCompleted: progressData.surveysCompleted,
          averageAccuracy: progressData.averageAccuracy,
          improvementRate: progressData.improvementRate,
          readyToProgress: progressData.readyToProgress,
          strengths: progressData.strengths,
          challenges: progressData.challenges,
          lastUpdated: new Date()
        }
      });

      // Link to family node
      try {
        const familyNodes = await familyKnowledgeGraph.getNodesByType(familyId, 'family');
        if (familyNodes.length > 0 && progressionNode && progressionNode.id) {
          await familyKnowledgeGraph.addEdge(familyId, {
            from: familyNodes[0].id,
            to: progressionNode.id,
            type: 'has_progression',
            strength: progressData.currentLevel / 5,
            metadata: {
              progressionType: 'survey_maturity',
              level: progressData.currentLevel
            }
          });
        }
      } catch (edgeError) {
        // Silently skip if entities don't exist yet
        console.debug('Skipping progression edge creation:', edgeError.message);
      }

      // Create milestone nodes for each completed level
      for (let level = 1; level <= progressData.currentLevel; level++) {
        const milestoneNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'milestone',
          subtype: 'progression_level',
          name: `Achieved Level ${level}: ${this.getLevelName(level)}`,
          metadata: {
            level,
            achievedDate: progressData.levelHistory?.[level] || new Date()
          }
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: progressionNode.id,
          to: milestoneNode.id,
          type: 'achieved_milestone',
          metadata: { level }
        });
      }

      return { 
        progressionNodeId: progressionNode.id,
        currentLevel: progressData.currentLevel,
        milestonesCreated: progressData.currentLevel
      };
    } catch (error) {
      console.error('Error syncing progression data:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync behavioral correlations
   * @private
   */
  async syncBehavioralCorrelations(familyId) {
    try {
      // Get recent correlation data
      const correlations = await this.getRecentCorrelations(familyId);
      let syncedCount = 0;

      for (const correlation of correlations) {
        if (correlation.overallAccuracy > 60) {
          // Create correlation node
          const correlationNode = await familyKnowledgeGraph.addNode(familyId, {
            type: 'behavioral_correlation',
            subtype: 'perception_reality',
            name: `Survey-Task Correlation ${correlation.surveyId}`,
            metadata: {
              surveyId: correlation.surveyId,
              overallAccuracy: correlation.overallAccuracy,
              categoryBreakdown: correlation.categoryAccuracy,
              insights: correlation.insights,
              timestamp: correlation.timestamp
            }
          });

          // Link perception gaps
          if (correlation.insights) {
            for (const insight of correlation.insights) {
              if (insight.type === 'perception_gap') {
                const gapNode = await familyKnowledgeGraph.addNode(familyId, {
                  type: 'insight',
                  subtype: 'perception_gap',
                  name: insight.message,
                  metadata: {
                    category: insight.category,
                    gap: insight.gap,
                    recommendation: insight.recommendation
                  }
                });

                await familyKnowledgeGraph.addEdge(familyId, {
                  from: correlationNode.id,
                  to: gapNode.id,
                  type: 'reveals_insight',
                  metadata: {
                    insightType: 'perception_gap',
                    severity: insight.gap > 30 ? 'high' : 'moderate'
                  }
                });
              }
            }
          }

          syncedCount++;
        }
      }

      return { correlationsSynced: syncedCount };
    } catch (error) {
      console.error('Error syncing correlations:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync predictive insights
   * @private
   */
  async syncPredictiveInsights(familyId) {
    try {
      // Get family data for predictions
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = { id: familyId, ...familyDoc.data() };
      
      // Generate predictive insights
      const familyIntelligence = await PredictiveQuestionEngine.gatherFamilyIntelligence(familyData);
      
      // Create prediction nodes
      const predictionNode = await familyKnowledgeGraph.addNode(familyId, {
        type: 'predictive_analysis',
        subtype: 'family_trajectory',
        name: `Family Trajectory: ${familyIntelligence.trajectory.direction}`,
        metadata: {
          direction: familyIntelligence.trajectory.direction,
          velocity: familyIntelligence.trajectory.velocity,
          momentum: familyIntelligence.trajectory.momentum,
          projectedMilestones: familyIntelligence.trajectory.projectedMilestones,
          riskFactors: familyIntelligence.trajectory.riskFactors,
          opportunities: familyIntelligence.trajectory.opportunities,
          readiness: familyIntelligence.readiness,
          analysisDate: new Date()
        }
      });

      // Link risk factors
      for (const risk of familyIntelligence.trajectory.riskFactors || []) {
        const riskNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'risk_factor',
          subtype: 'trajectory_risk',
          name: risk.description || 'Identified Risk',
          metadata: risk
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: predictionNode.id,
          to: riskNode.id,
          type: 'indicates_risk',
          metadata: { severity: risk.severity || 'moderate' }
        });
      }

      // Link opportunities
      for (const opportunity of familyIntelligence.trajectory.opportunities || []) {
        const oppNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'opportunity',
          subtype: 'growth_opportunity',
          name: opportunity.description || 'Growth Opportunity',
          metadata: opportunity
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: predictionNode.id,
          to: oppNode.id,
          type: 'related_to',
          metadata: { 
            relationship: 'identifies_opportunity',
            potential: opportunity.potential || 'high' 
          }
        });
      }

      return {
        predictiveNodeId: predictionNode.id,
        trajectory: familyIntelligence.trajectory.direction,
        risksIdentified: familyIntelligence.trajectory.riskFactors?.length || 0,
        opportunitiesIdentified: familyIntelligence.trajectory.opportunities?.length || 0
      };
    } catch (error) {
      console.error('Error syncing predictive insights:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync contextual factors
   * @private
   */
  async syncContextualFactors(familyId) {
    try {
      // Get family data
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = { id: familyId, ...familyDoc.data() };
      
      // Analyze current context
      const contextAnalysis = await ContextAwareSurveyEngine.analyzeContext(familyData);
      
      // Create context node
      const contextNode = await familyKnowledgeGraph.addNode(familyId, {
        type: 'contextual_analysis',
        subtype: 'current_context',
        name: `Context: ${contextAnalysis.priority.level} priority`,
        metadata: {
          seasonal: contextAnalysis.seasonal,
          lifeEvents: contextAnalysis.lifeEvents,
          stressLevel: contextAnalysis.stress,
          cultural: contextAnalysis.cultural,
          calendarDensity: contextAnalysis.calendar,
          priorityLevel: contextAnalysis.priority.level,
          priorityFactors: contextAnalysis.priority.factors,
          analysisDate: new Date()
        }
      });

      // Link life events
      if (contextAnalysis.lifeEvents.hasRecentEvents) {
        for (const event of contextAnalysis.lifeEvents.events) {
          const eventNode = await familyKnowledgeGraph.addNode(familyId, {
            type: 'life_event',
            subtype: event.type,
            name: `Life Event: ${event.type}`,
            metadata: {
              type: event.type,
              timeAgo: event.timeAgo,
              impact: event.impact,
              date: new Date(Date.now() - event.timeAgo * 24 * 60 * 60 * 1000)
            }
          });

          await familyKnowledgeGraph.addEdge(familyId, {
            from: contextNode.id,
            to: eventNode.id,
            type: 'includes_life_event',
            strength: event.impact === 'high' ? 0.9 : 0.5,
            metadata: { impact: event.impact }
          });
        }
      }

      // Link stress indicators
      if (contextAnalysis.stress.indicators.length > 0) {
        const stressNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'stress_analysis',
          subtype: 'family_stress',
          name: `Stress Level: ${contextAnalysis.stress.level}`,
          metadata: {
            level: contextAnalysis.stress.level,
            score: contextAnalysis.stress.score,
            indicators: contextAnalysis.stress.indicators,
            recommendations: contextAnalysis.stress.recommendations
          }
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: contextNode.id,
          to: stressNode.id,
          type: 'indicates_stress',
          strength: contextAnalysis.stress.score / 10,
          metadata: { level: contextAnalysis.stress.level }
        });
      }

      return {
        contextNodeId: contextNode.id,
        priorityLevel: contextAnalysis.priority.level,
        lifeEventsFound: contextAnalysis.lifeEvents.events?.length || 0,
        stressLevel: contextAnalysis.stress.level
      };
    } catch (error) {
      console.error('Error syncing contextual factors:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync multi-modal insights
   * @private
   */
  async syncMultiModalInsights(familyId) {
    try {
      // Gather unified insights
      const unifiedInsights = await MultiModalLearningService.gatherUnifiedInsights(
        familyId,
        { timeframe: 30 }
      );

      // Create multi-modal synthesis node
      const synthesisNode = await familyKnowledgeGraph.addNode(familyId, {
        type: 'multi_modal_insight',
        subtype: 'unified_analysis',
        name: 'Multi-Modal Family Insights',
        metadata: {
          keyThemes: unifiedInsights.synthesis.keyThemes,
          convergentFindings: unifiedInsights.synthesis.convergentFindings,
          emergentPatterns: unifiedInsights.synthesis.emergentPatterns,
          behavioralPatterns: unifiedInsights.behavioralPatterns,
          recommendations: unifiedInsights.recommendations,
          analysisDate: new Date()
        }
      });

      // Create nodes for key themes
      for (const theme of unifiedInsights.synthesis.keyThemes || []) {
        const themeNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'theme',
          subtype: 'multi_source_theme',
          name: `Theme: ${theme.theme}`,
          metadata: {
            theme: theme.theme,
            sources: theme.sources,
            strength: theme.strength
          }
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: synthesisNode.id,
          to: themeNode.id,
          type: 'identifies_theme',
          strength: theme.sources / 5, // Normalize by max possible sources
          metadata: { strength: theme.strength }
        });
      }

      // Create nodes for behavioral patterns
      for (const pattern of unifiedInsights.behavioralPatterns || []) {
        const patternNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'behavioral_pattern',
          subtype: pattern.type,
          name: `Pattern: ${pattern.type}`,
          metadata: pattern
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: synthesisNode.id,
          to: patternNode.id,
          type: 'reveals_pattern',
          strength: pattern.strength === 'strong' ? 0.9 : 0.6,
          metadata: { patternType: pattern.type }
        });
      }

      // Create recommendation nodes
      for (const rec of unifiedInsights.recommendations || []) {
        const recNode = await familyKnowledgeGraph.addNode(familyId, {
          type: 'recommendation',
          subtype: rec.type,
          name: `Recommendation: ${rec.area}`,
          metadata: rec
        });

        await familyKnowledgeGraph.addEdge(familyId, {
          from: synthesisNode.id,
          to: recNode.id,
          type: 'suggests_action',
          strength: rec.priority === 'critical' ? 1.0 : rec.priority === 'high' ? 0.8 : 0.6,
          metadata: { 
            priority: rec.priority,
            basedOn: rec.basedOn
          }
        });
      }

      return {
        synthesisNodeId: synthesisNode.id,
        themesIdentified: unifiedInsights.synthesis.keyThemes?.length || 0,
        patternsFound: unifiedInsights.behavioralPatterns?.length || 0,
        recommendationsGenerated: unifiedInsights.recommendations?.length || 0
      };
    } catch (error) {
      console.error('Error syncing multi-modal insights:', error);
      return { error: error.message };
    }
  }

  /**
   * Sync community patterns (anonymized)
   * @private
   */
  async syncCommunityPatterns(familyId) {
    try {
      // Get family profile
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (!familyDoc.exists()) {
        console.warn(`Family ${familyId} not found in database`);
        return;
      }
      const familyData = familyDoc.data();
      
      const familyProfile = {
        memberCount: familyData?.members?.length || familyData?.familyMembers?.length || 4,
        childrenAges: familyData?.children?.map(c => c.age) || [],
        location: familyData?.location || 'general',
        priorities: [
          familyData?.priorities?.highestPriority,
          familyData?.priorities?.secondaryPriority
        ].filter(Boolean)
      };

      // Get aggregated insights
      const crossFamilyInsights = await CrossFamilyLearningService.getAggregatedInsights(
        familyProfile,
        'all'
      );

      if (!crossFamilyInsights.available) {
        return { message: 'Not enough families for pattern analysis' };
      }

      // Create community insights node
      const communityNode = await familyKnowledgeGraph.addNode(familyId, {
        type: 'community_pattern',
        subtype: 'cross_family_learning',
        name: 'Community Insights',
        metadata: {
          basedOnFamilies: crossFamilyInsights.basedOnFamilies,
          confidence: crossFamilyInsights.confidence,
          patterns: crossFamilyInsights.insights.patterns,
          recommendations: crossFamilyInsights.insights.recommendations,
          privacyPreserved: true,
          analysisDate: new Date()
        }
      });

      // Link applicable patterns
      if (crossFamilyInsights.insights.patterns) {
        for (const [patternName, patternData] of Object.entries(crossFamilyInsights.insights.patterns)) {
          if (patternData.prevalence && parseFloat(patternData.prevalence) > 30) {
            const patternNode = await familyKnowledgeGraph.addNode(familyId, {
              type: 'shared_pattern',
              subtype: 'community_trend',
              name: `Community Pattern: ${patternName}`,
              metadata: {
                pattern: patternName,
                prevalence: patternData.prevalence,
                confidence: patternData.confidence,
                anonymized: true
              }
            });

            await familyKnowledgeGraph.addEdge(familyId, {
              from: communityNode.id,
              to: patternNode.id,
              type: 'shares_pattern',
              metadata: {
                prevalence: patternData.prevalence,
                applicability: 'potential'
              }
            });
          }
        }
      }

      return {
        communityNodeId: communityNode.id,
        patternsShared: Object.keys(crossFamilyInsights.insights.patterns || {}).length,
        basedOnFamilies: crossFamilyInsights.basedOnFamilies
      };
    } catch (error) {
      console.error('Error syncing community patterns:', error);
      return { error: error.message };
    }
  }

  /**
   * Helper methods
   * @private
   */
  getLevelName(level) {
    const names = {
      1: 'Awareness',
      2: 'Recognition',
      3: 'Planning',
      4: 'Implementation',
      5: 'Optimization'
    };
    return names[level] || 'Unknown';
  }

  async getRecentCorrelations(familyId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'surveyTaskCorrelations'),
        where('familyId', '==', familyId),
        where('timestamp', '>=', thirtyDaysAgo),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const correlations = [];
      snapshot.forEach(doc => correlations.push({ id: doc.id, ...doc.data() }));
      
      return correlations;
    } catch (error) {
      console.error('Error getting correlations:', error);
      return [];
    }
  }

  async storeSyncSummary(familyId, summary) {
    try {
      await addDoc(collection(db, 'knowledgeGraphSyncs'), {
        familyId,
        type: 'survey_engine_sync',
        summary,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error storing sync summary:', error);
    }
  }
}

export default new SurveyEngineKnowledgeGraphSync();