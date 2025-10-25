/**
 * Survey to Knowledge Graph Sync Service
 *
 * Week 1 Implementation: Sync survey data from Firestore to Neo4j
 *
 * This service handles the complete sync of survey completion data:
 * 1. Person nodes with cognitive load metrics
 * 2. Survey + SurveyResponse nodes
 * 3. ELO rating nodes
 * 4. All relationships (COMPLETED, MEASURES, CONTAINS, etc.)
 *
 * Triggered by: Cloud Function on surveyResponses/{surveyId} write
 *
 * @author Stefan Palsson
 * @date October 20, 2025
 */

import Neo4jService from './graph/Neo4jService';
import ELORatingService from './ELORatingService';
import { calculateTaskWeight } from '../utils/TaskWeightCalculator';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

class SurveyToKGSync {
  constructor() {
    this.neo4jService = Neo4jService;
    this.eloService = ELORatingService;
    this.syncInProgress = new Set(); // Prevent duplicate syncs
  }

  /**
   * Main sync function - called when survey is completed
   * @param {string} surveyId - Firestore survey document ID
   * @param {string} familyId - Family ID for multi-tenant isolation
   * @returns {Promise<Object>} Sync result with node/relationship counts
   */
  async syncSurveyToKnowledgeGraph(surveyId, familyId) {
    // Prevent duplicate syncs
    const syncKey = `${familyId}_${surveyId}`;
    if (this.syncInProgress.has(syncKey)) {
      console.log(`⏭️  Sync already in progress for ${syncKey}`);
      return { skipped: true, reason: 'sync_in_progress' };
    }

    this.syncInProgress.add(syncKey);

    try {
      console.log(`🔄 Starting Knowledge Graph sync for survey: ${surveyId}`);
      console.log(`   Family: ${familyId}`);

      // Step 1: Load survey data from Firestore
      const surveyData = await this.loadSurveyData(surveyId, familyId);
      if (!surveyData) {
        throw new Error(`Survey not found: ${surveyId}`);
      }

      console.log(`✅ Loaded survey data`);
      console.log(`   Type: ${surveyData.surveyType}`);
      console.log(`   Responses: ${surveyData.responses.length}`);
      console.log(`   Respondents: ${surveyData.respondents.length}`);

      // Step 2: Load ELO ratings
      const eloRatings = await this.eloService.getFamilyRatings(familyId);
      console.log(`✅ Loaded ELO ratings`);

      // Step 3: Calculate cognitive load for each person
      const cognitiveLoadData = await this.calculateCognitiveLoad(surveyData, familyId);
      console.log(`✅ Calculated cognitive load for ${Object.keys(cognitiveLoadData).length} members`);

      // Step 4: Sync to Neo4j (transactional)
      const syncResult = await this.executeNeo4jSync({
        surveyData,
        eloRatings,
        cognitiveLoadData,
        familyId
      });

      console.log(`✅ Survey sync complete!`);
      console.log(`   Nodes created: ${syncResult.nodesCreated}`);
      console.log(`   Relationships created: ${syncResult.relationshipsCreated}`);
      console.log(`   Duration: ${syncResult.duration}ms`);

      return {
        success: true,
        surveyId,
        familyId,
        ...syncResult
      };

    } catch (error) {
      console.error(`❌ Survey sync failed for ${surveyId}:`, error);
      throw error;
    } finally {
      this.syncInProgress.delete(syncKey);
    }
  }

  /**
   * Load survey data from Firestore
   */
  async loadSurveyData(surveyId, familyId) {
    try {
      // Get survey document
      const surveyDoc = await getDoc(doc(db, 'surveyResponses', surveyId));
      if (!surveyDoc.exists()) {
        return null;
      }

      const surveyData = surveyDoc.data();

      // Validate family ID
      if (surveyData.familyId !== familyId) {
        throw new Error(`Family ID mismatch: ${surveyData.familyId} !== ${familyId}`);
      }

      // Get family data for context
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.data();

      // Get all family members
      const familyMembers = familyData.familyMembers || [];

      // Parse responses into structured format
      const responses = [];
      const responsesByMember = {};

      Object.entries(surveyData.responses || {}).forEach(([key, response]) => {
        // Extract member ID from key (format: "memberId_questionId" or just "questionId")
        let memberId, questionId;

        if (key.includes('_')) {
          [memberId, questionId] = key.split('_');
        } else {
          questionId = key;
          memberId = surveyData.userId || surveyData.memberId;
        }

        // Parse response data
        let answer, category, totalWeight, questionText;

        if (typeof response === 'object' && response !== null) {
          // New format: {answer, category, totalWeight, ...}
          answer = response.answer;
          category = response.category;
          totalWeight = response.totalWeight || 5;
          questionText = response.text || response.questionText;
        } else {
          // Old format: just answer string
          answer = response;
          category = 'Unknown';
          totalWeight = 5;
          questionText = questionId;
        }

        const responseData = {
          responseId: `${surveyId}_${questionId}_${memberId}`,
          questionId,
          memberId,
          answer,
          category,
          totalWeight,
          questionText,
          timestamp: surveyData.completedAt || surveyData.createdAt
        };

        responses.push(responseData);

        // Group by member
        if (!responsesByMember[memberId]) {
          responsesByMember[memberId] = [];
        }
        responsesByMember[memberId].push(responseData);
      });

      return {
        surveyId,
        familyId,
        surveyType: surveyData.surveyType || 'initial',
        cycleNumber: surveyData.cycleNumber || 1,
        weekNumber: surveyData.weekNumber,
        completedAt: surveyData.completedAt,
        createdAt: surveyData.createdAt,
        duration: surveyData.duration,
        overallImbalance: surveyData.overallImbalance,
        previousImbalance: surveyData.previousImbalance,
        responses,
        responsesByMember,
        respondents: Object.keys(responsesByMember),
        familyMembers,
        metadata: {
          totalQuestions: responses.length,
          respondentCount: Object.keys(responsesByMember).length
        }
      };

    } catch (error) {
      console.error('Error loading survey data:', error);
      throw error;
    }
  }

  /**
   * Calculate cognitive load for each family member from survey responses
   */
  async calculateCognitiveLoad(surveyData, familyId) {
    const cognitiveLoadByMember = {};

    // Get family members
    const familyMembers = surveyData.familyMembers || [];

    // Initialize cognitive load for each parent
    familyMembers.forEach(member => {
      if (member.role === 'parent') {
        cognitiveLoadByMember[member.id] = {
          userId: member.id,
          name: member.name,
          role: 'parent',
          anticipationScore: 0,
          monitoringScore: 0,
          executionScore: 0,
          totalLoadScore: 0,
          cognitiveLoad: 0,
          responseCount: 0
        };
      }
    });

    // Count tasks by type for each parent
    const taskCounts = {
      Mama: { anticipation: 0, monitoring: 0, execution: 0 },
      Papa: { anticipation: 0, monitoring: 0, execution: 0 }
    };

    surveyData.responses.forEach(response => {
      const { answer, questionText, category } = response;

      if (!answer || answer === 'Neither' || answer === 'Neutral') {
        return;
      }

      // Determine task type from question text
      let taskType = 'execution'; // default
      const lowerText = questionText.toLowerCase();

      if (lowerText.includes('notice') || lowerText.includes('plan') ||
          lowerText.includes('anticipate') || lowerText.includes('decide') ||
          lowerText.includes('remember') || lowerText.includes('schedules')) {
        taskType = 'anticipation';
      } else if (lowerText.includes('monitor') || lowerText.includes('track') ||
                 lowerText.includes('check') || lowerText.includes('oversee') ||
                 lowerText.includes('coordinate')) {
        taskType = 'monitoring';
      }

      // Increment counts
      if (answer === 'Mama' || answer === 'Both') {
        taskCounts.Mama[taskType]++;
      }
      if (answer === 'Papa' || answer === 'Both') {
        taskCounts.Papa[taskType]++;
      }
    });

    // Calculate cognitive load scores
    // Formula: (anticipation × 2.0) + (monitoring × 1.5) + (execution × 1.0)
    const ANTICIPATION_WEIGHT = 2.0;
    const MONITORING_WEIGHT = 1.5;
    const EXECUTION_WEIGHT = 1.0;

    let totalLoad = 0;

    Object.keys(taskCounts).forEach(parent => {
      const counts = taskCounts[parent];
      const loadScore =
        (counts.anticipation * ANTICIPATION_WEIGHT) +
        (counts.monitoring * MONITORING_WEIGHT) +
        (counts.execution * EXECUTION_WEIGHT);

      totalLoad += loadScore;

      // Find matching member
      const member = familyMembers.find(m =>
        m.role === 'parent' && (
          (parent === 'Mama' && (m.name === 'Mama' || m.name.includes('mama') || m.gender === 'female')) ||
          (parent === 'Papa' && (m.name === 'Papa' || m.name.includes('papa') || m.gender === 'male'))
        )
      );

      if (member && cognitiveLoadByMember[member.id]) {
        cognitiveLoadByMember[member.id].anticipationScore = counts.anticipation;
        cognitiveLoadByMember[member.id].monitoringScore = counts.monitoring;
        cognitiveLoadByMember[member.id].executionScore = counts.execution;
        cognitiveLoadByMember[member.id].totalLoadScore = loadScore;
      }
    });

    // Calculate percentages
    if (totalLoad > 0) {
      Object.values(cognitiveLoadByMember).forEach(member => {
        member.cognitiveLoad = member.totalLoadScore / totalLoad;
        member.cognitiveLoadPercentage = Math.round((member.totalLoadScore / totalLoad) * 100);
      });
    }

    return cognitiveLoadByMember;
  }

  /**
   * Execute Neo4j sync in transaction
   */
  async executeNeo4jSync({ surveyData, eloRatings, cognitiveLoadData, familyId }) {
    const startTime = Date.now();
    let nodesCreated = 0;
    let relationshipsCreated = 0;

    try {
      // Create Person nodes with updated metrics
      for (const [userId, cogLoad] of Object.entries(cognitiveLoadData)) {
        const member = surveyData.familyMembers.find(m => m.id === userId);
        if (!member) continue;

        // Get ELO rating for this person
        const eloData = eloRatings.globalRatings[member.name] || {
          rating: 1500,
          uncertainty: 350,
          matchCount: 0
        };

        const personCypher = `
          MERGE (p:Person {userId: $userId, familyId: $familyId})
          SET p.name = $name,
              p.role = $role,
              p.age = $age,
              p.cognitiveLoad = $cognitiveLoad,
              p.anticipationScore = $anticipationScore,
              p.monitoringScore = $monitoringScore,
              p.executionScore = $executionScore,
              p.totalLoadScore = $totalLoadScore,
              p.eloRating = $eloRating,
              p.eloUncertainty = $eloUncertainty,
              p.eloMatchCount = $eloMatchCount,
              p.invisibleLaborScore = $invisibleLaborScore,
              p.lastSurveyDate = datetime($lastSurveyDate),
              p.lastUpdated = datetime()
          RETURN p
        `;

        const result = await this.neo4jService.runQuery(personCypher, {
          userId,
          familyId,
          name: member.name,
          role: member.role,
          age: member.age || null,
          cognitiveLoad: cogLoad.cognitiveLoad,
          anticipationScore: cogLoad.anticipationScore,
          monitoringScore: cogLoad.monitoringScore,
          executionScore: cogLoad.executionScore,
          totalLoadScore: cogLoad.totalLoadScore,
          eloRating: eloData.rating,
          eloUncertainty: eloData.uncertainty,
          eloMatchCount: eloData.matchCount,
          invisibleLaborScore: Math.round(cogLoad.cognitiveLoad * 100),
          lastSurveyDate: surveyData.completedAt?.toDate?.().toISOString() ||
                          new Date().toISOString()
        });

        nodesCreated += result.summary.counters.updates().nodesCreated;
        console.log(`   ✓ Person: ${member.name} (load: ${Math.round(cogLoad.cognitiveLoad * 100)}%)`);
      }

      // Create Survey node
      const surveyCypher = `
        MERGE (s:Survey {surveyId: $surveyId, familyId: $familyId})
        SET s.surveyType = $surveyType,
            s.cycleNumber = $cycleNumber,
            s.weekNumber = $weekNumber,
            s.completedAt = datetime($completedAt),
            s.duration = $duration,
            s.totalQuestions = $totalQuestions,
            s.overallImbalance = $overallImbalance,
            s.previousImbalance = $previousImbalance,
            s.respondents = $respondents,
            s.respondentCount = $respondentCount,
            s.createdAt = datetime()
        RETURN s
      `;

      const surveyResult = await this.neo4jService.runQuery(surveyCypher, {
        surveyId: surveyData.surveyId,
        familyId,
        surveyType: surveyData.surveyType,
        cycleNumber: surveyData.cycleNumber,
        weekNumber: surveyData.weekNumber,
        completedAt: surveyData.completedAt?.toDate?.().toISOString() ||
                     new Date().toISOString(),
        duration: surveyData.duration || 0,
        totalQuestions: surveyData.metadata.totalQuestions,
        overallImbalance: surveyData.overallImbalance || 0,
        previousImbalance: surveyData.previousImbalance || 0,
        respondents: surveyData.respondents,
        respondentCount: surveyData.metadata.respondentCount
      });

      nodesCreated += surveyResult.summary.counters.updates().nodesCreated;
      console.log(`   ✓ Survey: ${surveyData.surveyType} (cycle ${surveyData.cycleNumber})`);

      // Create SurveyResponse nodes and relationships
      for (const response of surveyData.responses) {
        const responseCypher = `
          MERGE (sr:SurveyResponse {
            responseId: $responseId
          })
          SET sr.questionId = $questionId,
              sr.answer = $answer,
              sr.questionText = $questionText,
              sr.category = $category,
              sr.totalWeight = $totalWeight,
              sr.timestamp = datetime($timestamp)

          WITH sr
          MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
          MERGE (s)-[:CONTAINS]->(sr)

          WITH sr
          MATCH (p:Person {userId: $memberId, familyId: $familyId})
          MERGE (sr)-[:ANSWERED_BY {
            answer: $answer,
            timestamp: datetime($timestamp)
          }]->(p)

          RETURN sr
        `;

        const responseResult = await this.neo4jService.runQuery(responseCypher, {
          responseId: response.responseId,
          surveyId: surveyData.surveyId,
          familyId,
          questionId: response.questionId,
          memberId: response.memberId,
          answer: response.answer,
          questionText: response.questionText,
          category: response.category,
          totalWeight: response.totalWeight,
          timestamp: response.timestamp?.toDate?.().toISOString() ||
                     new Date().toISOString()
        });

        nodesCreated += responseResult.summary.counters.updates().nodesCreated;
        relationshipsCreated += responseResult.summary.counters.updates().relationshipsCreated;
      }

      console.log(`   ✓ ${surveyData.responses.length} responses linked`);

      // Create COMPLETED relationships (Person → Survey)
      for (const userId of surveyData.respondents) {
        const member = surveyData.familyMembers.find(m => m.id === userId);
        if (!member) continue;

        const responseCount = surveyData.responsesByMember[userId]?.length || 0;

        const completedCypher = `
          MATCH (p:Person {userId: $userId, familyId: $familyId})
          MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
          MERGE (p)-[:COMPLETED {
            timestamp: datetime($timestamp),
            duration: $duration,
            responseCount: $responseCount
          }]->(s)
        `;

        const completedResult = await this.neo4jService.runQuery(completedCypher, {
          userId,
          familyId,
          surveyId: surveyData.surveyId,
          timestamp: surveyData.completedAt?.toDate?.().toISOString() ||
                     new Date().toISOString(),
          duration: surveyData.duration || 0,
          responseCount
        });

        relationshipsCreated += completedResult.summary.counters.updates().relationshipsCreated;
      }

      console.log(`   ✓ ${surveyData.respondents.length} completion relationships`);

      // Create MEASURES relationships (Survey → Person with cognitive load)
      for (const [userId, cogLoad] of Object.entries(cognitiveLoadData)) {
        const measuresCypher = `
          MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
          MATCH (p:Person {userId: $userId, familyId: $familyId})
          MERGE (s)-[:MEASURES {
            metricName: 'cognitive_load',
            value: $cognitiveLoad,
            anticipationScore: $anticipationScore,
            monitoringScore: $monitoringScore,
            executionScore: $executionScore,
            totalLoadScore: $totalLoadScore,
            timestamp: datetime($timestamp)
          }]->(p)
        `;

        const measuresResult = await this.neo4jService.runQuery(measuresCypher, {
          surveyId: surveyData.surveyId,
          familyId,
          userId,
          cognitiveLoad: cogLoad.cognitiveLoad,
          anticipationScore: cogLoad.anticipationScore,
          monitoringScore: cogLoad.monitoringScore,
          executionScore: cogLoad.executionScore,
          totalLoadScore: cogLoad.totalLoadScore,
          timestamp: surveyData.completedAt?.toDate?.().toISOString() ||
                     new Date().toISOString()
        });

        relationshipsCreated += measuresResult.summary.counters.updates().relationshipsCreated;
      }

      console.log(`   ✓ ${Object.keys(cognitiveLoadData).length} MEASURES relationships`);

      // Create ELO Rating nodes (global, category, task levels)
      const eloSyncResult = await this.syncELORatings(surveyData, eloRatings, familyId);
      nodesCreated += eloSyncResult.nodesCreated;
      relationshipsCreated += eloSyncResult.relationshipsCreated;

      const duration = Date.now() - startTime;

      return {
        nodesCreated,
        relationshipsCreated,
        duration,
        surveyId: surveyData.surveyId,
        respondents: surveyData.respondents.length
      };

    } catch (error) {
      console.error('Error in Neo4j sync:', error);
      throw error;
    }
  }

  /**
   * Sync ELO ratings to Knowledge Graph
   */
  async syncELORatings(surveyData, eloRatings, familyId) {
    let nodesCreated = 0;
    let relationshipsCreated = 0;

    try {
      // Create global ELO rating node
      const globalEloCypher = `
        MERGE (er:ELORating {
          ratingId: $ratingId,
          familyId: $familyId
        })
        SET er.ratingType = 'global',
            er.category = null,
            er.taskName = null,
            er.mamaRating = $mamaRating,
            er.papaRating = $papaRating,
            er.ratingGap = $ratingGap,
            er.mamaUncertainty = $mamaUncertainty,
            er.papaUncertainty = $papaUncertainty,
            er.mamaMatchCount = $mamaMatchCount,
            er.papaMatchCount = $papaMatchCount,
            er.imbalanceScore = $imbalanceScore,
            er.imbalanceSeverity = $imbalanceSeverity,
            er.confidence = $confidence,
            er.snapshotDate = datetime($snapshotDate),
            er.createdAt = datetime()

        WITH er
        MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
        MERGE (s)-[:GENERATED_RATING {
          timestamp: datetime($snapshotDate)
        }]->(er)

        RETURN er
      `;

      const mamaGlobal = eloRatings.globalRatings?.Mama || { rating: 1500, uncertainty: 350, matchCount: 0 };
      const papaGlobal = eloRatings.globalRatings?.Papa || { rating: 1500, uncertainty: 350, matchCount: 0 };
      const ratingGap = Math.abs(mamaGlobal.rating - papaGlobal.rating);
      const avgUncertainty = (mamaGlobal.uncertainty + papaGlobal.uncertainty) / 2;

      const globalResult = await this.neo4jService.runQuery(globalEloCypher, {
        ratingId: `elo_${familyId}_global_${surveyData.surveyId}`,
        familyId,
        surveyId: surveyData.surveyId,
        mamaRating: mamaGlobal.rating,
        papaRating: papaGlobal.rating,
        ratingGap,
        mamaUncertainty: mamaGlobal.uncertainty,
        papaUncertainty: papaGlobal.uncertainty,
        mamaMatchCount: mamaGlobal.matchCount,
        papaMatchCount: papaGlobal.matchCount,
        imbalanceScore: ratingGap,
        imbalanceSeverity: ratingGap > 200 ? 'severe' : (ratingGap > 100 ? 'moderate' : 'mild'),
        confidence: 1 - (avgUncertainty / 350),
        snapshotDate: surveyData.completedAt?.toDate?.().toISOString() ||
                      new Date().toISOString()
      });

      nodesCreated += globalResult.summary.counters.updates().nodesCreated;
      relationshipsCreated += globalResult.summary.counters.updates().relationshipsCreated;

      console.log(`   ✓ Global ELO: Mama ${mamaGlobal.rating} vs Papa ${papaGlobal.rating} (gap: ${ratingGap})`);

      // Create category ELO ratings
      if (eloRatings.categories) {
        for (const [category, ratings] of Object.entries(eloRatings.categories)) {
          const categoryEloCypher = `
            MERGE (er:ELORating {
              ratingId: $ratingId,
              familyId: $familyId
            })
            SET er.ratingType = 'category',
                er.category = $category,
                er.taskName = null,
                er.mamaRating = $mamaRating,
                er.papaRating = $papaRating,
                er.ratingGap = $ratingGap,
                er.mamaUncertainty = $mamaUncertainty,
                er.papaUncertainty = $papaUncertainty,
                er.mamaMatchCount = $mamaMatchCount,
                er.papaMatchCount = $papaMatchCount,
                er.imbalanceScore = $imbalanceScore,
                er.imbalanceSeverity = $imbalanceSeverity,
                er.confidence = $confidence,
                er.snapshotDate = datetime($snapshotDate),
                er.createdAt = datetime()

            WITH er
            MATCH (s:Survey {surveyId: $surveyId, familyId: $familyId})
            MERGE (s)-[:GENERATED_RATING {
              ratingType: 'category',
              category: $category,
              timestamp: datetime($snapshotDate)
            }]->(er)

            RETURN er
          `;

          const mamaRating = ratings.Mama?.rating || 1500;
          const papaRating = ratings.Papa?.rating || 1500;
          const categoryGap = Math.abs(mamaRating - papaRating);
          const categoryAvgUncertainty = ((ratings.Mama?.uncertainty || 350) +
                                          (ratings.Papa?.uncertainty || 350)) / 2;

          const categoryResult = await this.neo4jService.runQuery(categoryEloCypher, {
            ratingId: `elo_${familyId}_category_${category.replace(/\s+/g, '_')}_${surveyData.surveyId}`,
            familyId,
            surveyId: surveyData.surveyId,
            category,
            mamaRating,
            papaRating,
            ratingGap: categoryGap,
            mamaUncertainty: ratings.Mama?.uncertainty || 350,
            papaUncertainty: ratings.Papa?.uncertainty || 350,
            mamaMatchCount: ratings.Mama?.matchCount || 0,
            papaMatchCount: ratings.Papa?.matchCount || 0,
            imbalanceScore: categoryGap,
            imbalanceSeverity: categoryGap > 200 ? 'severe' : (categoryGap > 100 ? 'moderate' : 'mild'),
            confidence: 1 - (categoryAvgUncertainty / 350),
            snapshotDate: surveyData.completedAt?.toDate?.().toISOString() ||
                          new Date().toISOString()
          });

          nodesCreated += categoryResult.summary.counters.updates().nodesCreated;
          relationshipsCreated += categoryResult.summary.counters.updates().relationshipsCreated;
        }

        console.log(`   ✓ ${Object.keys(eloRatings.categories).length} category ELO ratings`);
      }

      return { nodesCreated, relationshipsCreated };

    } catch (error) {
      console.error('Error syncing ELO ratings:', error);
      return { nodesCreated: 0, relationshipsCreated: 0 };
    }
  }

  /**
   * Query Knowledge Graph for smart task assignment
   * Returns person with lowest cognitive load
   */
  async getSuggestedTaskAssignee(familyId) {
    const query = `
      MATCH (p:Person {familyId: $familyId})
      WHERE p.role = 'parent'
        AND p.cognitiveLoad IS NOT NULL

      OPTIONAL MATCH (p)<-[m:MEASURES]-(s:Survey)
      WHERE s.surveyType IN ['initial', 're-assessment']
      WITH p, m
      ORDER BY m.timestamp DESC
      LIMIT 1

      RETURN p.userId as userId,
             p.name as name,
             p.cognitiveLoad as cognitiveLoad,
             p.cognitiveLoadPercentage as loadPercentage,
             p.totalLoadScore as loadScore,
             m.value as latestLoad
      ORDER BY p.cognitiveLoad ASC
      LIMIT 1
    `;

    try {
      const result = await this.neo4jService.runQuery(query, { familyId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        userId: record.get('userId'),
        name: record.get('name'),
        cognitiveLoad: record.get('cognitiveLoad'),
        loadPercentage: record.get('loadPercentage'),
        loadScore: record.get('loadScore'),
        latestLoad: record.get('latestLoad'),
        reason: `${record.get('name')} has the lowest cognitive load (${Math.round((record.get('cognitiveLoad') || 0) * 100)}%)`
      };

    } catch (error) {
      console.error('Error getting suggested assignee:', error);
      return null;
    }
  }
}

export default new SurveyToKGSync();
