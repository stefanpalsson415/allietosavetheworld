// src/services/AllieProactiveService.js

import AllieTaskWeightService from './AllieTaskWeightService';
import ChatPersistenceService from './ChatPersistenceService';
import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Service for Allie's proactive intelligence capabilities
 * Monitors family state and triggers appropriate proactive interactions
 */
class AllieProactiveService {
  constructor() {
    this.taskWeightService = AllieTaskWeightService;
    this.chatService = ChatPersistenceService;
    this.checkInterval = 12 * 60 * 60 * 1000; // 12 hours
    this.lastChecks = {};
  }

  /**
   * Initialize proactive monitoring for a family
   * @param {string} familyId - Family identifier
   */
  initProactiveMonitoring(familyId) {
    if (!this.lastChecks[familyId]) {
      this.lastChecks[familyId] = Date.now();
      this.scheduleNextCheck(familyId);
      
      console.log(`Initialized proactive monitoring for family ${familyId}`);
    }
  }

  /**
   * Schedule the next proactive check
   * @param {string} familyId - Family identifier
   */
  scheduleNextCheck(familyId) {
    setTimeout(() => {
      this.performProactiveCheck(familyId)
        .then(() => {
          this.lastChecks[familyId] = Date.now();
          this.scheduleNextCheck(familyId);
        })
        .catch(error => {
          console.error(`Error in proactive check for family ${familyId}:`, error);
          this.scheduleNextCheck(familyId);
        });
    }, this.checkInterval);
  }

  /**
   * Perform a complete proactive check for a family
   * @param {string} familyId - Family identifier
   */
  async performProactiveCheck(familyId) {
    try {
      console.log(`Performing proactive check for family ${familyId}`);
      
      // Get family metadata to check if proactive features are enabled
      const familyDoc = await getDoc(doc(db, "families", familyId));
      if (!familyDoc.exists()) {
        throw new Error(`Family ${familyId} not found`);
      }
      
      const familyData = familyDoc.data();
      
      // Skip check if proactive features are disabled
      if (familyData.settings?.disableProactive) {
        console.log(`Proactive features disabled for family ${familyId}`);
        return;
      }
      
      // Get comprehensive family insights
      const insights = await this.taskWeightService.getFamilyInsights(familyId, false);
      
      // Check for various proactive triggers
      await Promise.all([
        this.checkBurnoutTriggers(familyId, insights),
        this.checkLifeStageTriggers(familyId, insights),
        this.checkCulturalContextTriggers(familyId, insights),
        this.checkRelationshipTriggers(familyId, insights)
      ]);
      
      // Update last check timestamp in Firestore
      await updateDoc(doc(db, "families", familyId), {
        lastProactiveCheck: new Date().toISOString()
      });
      
      console.log(`Completed proactive check for family ${familyId}`);
    } catch (error) {
      console.error(`Error in proactive check for family ${familyId}:`, error);
      throw error;
    }
  }

  /**
   * Check for burnout-related proactive triggers
   * @param {string} familyId - Family identifier
   * @param {Object} insights - Family insights
   */
  async checkBurnoutTriggers(familyId, insights) {
    try {
      // Skip if no burnout data
      if (!insights.burnout) {
        return;
      }
      
      // Check for high burnout risk
      if (insights.burnout.hasRisk && 
          (insights.burnout.riskLevel === 'severe' || insights.burnout.riskLevel === 'high')) {
        
        // Check for burnout alert
        const burnoutAlert = await this.taskWeightService.checkBurnoutAlert(familyId);
        
        if (burnoutAlert && !burnoutAlert.hasAlert) {
          // There's burnout risk but no alert has been sent yet - send proactive message
          await this.sendBurnoutMessage(
            familyId, 
            insights.burnout.atRiskParent, 
            insights.burnout.riskLevel,
            insights.burnout.interventions
          );
          
          console.log(`Sent burnout alert for family ${familyId}`);
        }
      }
    } catch (error) {
      console.error(`Error checking burnout triggers for family ${familyId}:`, error);
    }
  }

  /**
   * Check for life stage transition triggers
   * @param {string} familyId - Family identifier
   * @param {Object} insights - Family insights
   */
  async checkLifeStageTriggers(familyId, insights) {
    try {
      // Skip if no life stage data
      if (!insights.lifeStage || !insights.lifeStage.transitions) {
        return;
      }
      
      // Check for significant transitions
      const significantTransitions = insights.lifeStage.transitions.filter(
        t => t.intensityLevel === 'high'
      );
      
      if (significantTransitions.length > 0) {
        // Get last sent transition message
        const sentTransitionsDoc = await getDoc(doc(db, "proactiveMessages", `lifestage-${familyId}`));
        const sentTransitions = sentTransitionsDoc.exists() ? sentTransitionsDoc.data().transitions || [] : [];
        
        // Find transitions we haven't sent messages about yet
        const newTransitions = significantTransitions.filter(
          t => !sentTransitions.includes(t.type)
        );
        
        if (newTransitions.length > 0) {
          // Get recommendations for this transition
          const recommendations = await this.taskWeightService.getLifeStageRecommendations(familyId);
          
          // Send message about the most significant new transition
          await this.sendLifeStageMessage(
            familyId,
            newTransitions[0],
            recommendations
          );
          
          // Update sent transitions in Firestore
          await setDoc(doc(db, "proactiveMessages", `lifestage-${familyId}`), {
            transitions: [...sentTransitions, ...newTransitions.map(t => t.type)],
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          console.log(`Sent life stage transition message for family ${familyId}`);
        }
      }
    } catch (error) {
      console.error(`Error checking life stage triggers for family ${familyId}:`, error);
    }
  }

  /**
   * Check for cultural context triggers
   * @param {string} familyId - Family identifier
   * @param {Object} insights - Family insights
   */
  async checkCulturalContextTriggers(familyId, insights) {
    try {
      // Skip if no cultural context data
      if (!insights.culturalContext) {
        return;
      }
      
      // Check if we've sent a cultural context message in the last month
      const messagesQuery = query(
        collection(db, "chatMessages"),
        where("familyId", "==", familyId),
        where("metadata.type", "==", "cultural_context"),
        where("timestamp", ">=", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      if (messagesSnapshot.empty) {
        // We haven't sent a cultural message in the last month
        // Get relevant cultural suggestions
        const culturalSuggestions = await this.taskWeightService.getCulturalSuggestions(
          familyId,
          'parenting_approach'
        );
        
        if (culturalSuggestions && culturalSuggestions.hasSuggestions) {
          // Send cultural context message
          await this.sendCulturalContextMessage(
            familyId,
            insights.culturalContext.valueSystem,
            culturalSuggestions.suggestions
          );
          
          console.log(`Sent cultural context message for family ${familyId}`);
        }
      }
    } catch (error) {
      console.error(`Error checking cultural context triggers for family ${familyId}:`, error);
    }
  }

  /**
   * Check for relationship style triggers
   * @param {string} familyId - Family identifier
   * @param {Object} insights - Family insights
   */
  async checkRelationshipTriggers(familyId, insights) {
    try {
      // Skip if no relationship style data
      if (!insights.relationshipStyle) {
        return;
      }
      
      // Check for balance data
      const familyDoc = await getDoc(doc(db, "families", familyId));
      if (!familyDoc.exists()) {
        return;
      }
      
      const familyData = familyDoc.data();
      
      // Check if we've seen a substantial imbalance
      if (familyData.weightedScores && 
          familyData.weightedScores.overallBalance && 
          familyData.weightedScores.overallBalance.imbalance > 0.3) {
        
        // Check if we've sent a relationship message in the last 2 weeks
        const messagesQuery = query(
          collection(db, "chatMessages"),
          where("familyId", "==", familyId),
          where("metadata.type", "==", "relationship_style"),
          where("timestamp", ">=", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        
        if (messagesSnapshot.empty) {
          // We haven't sent a relationship message in the last 2 weeks
          // Get relationship recommendations
          const relationshipRecommendations = await this.taskWeightService.getRelationshipRecommendations(
            familyId
          );
          
          if (relationshipRecommendations && relationshipRecommendations.hasRecommendations) {
            // Send relationship style message
            await this.sendRelationshipStyleMessage(
              familyId,
              insights.relationshipStyle.style,
              relationshipRecommendations.recommendations
            );
            
            console.log(`Sent relationship style message for family ${familyId}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking relationship triggers for family ${familyId}:`, error);
    }
  }

  /**
   * Send a proactive burnout prevention message
   * @param {string} familyId - Family identifier
   * @param {string} atRiskParent - Parent at risk (mama/papa)
   * @param {string} riskLevel - Risk level (severe/high)
   * @param {Array} interventions - Intervention recommendations
   */
  async sendBurnoutMessage(familyId, atRiskParent, riskLevel, interventions) {
    try {
      const parentName = atRiskParent === 'mama' ? 'Mama' : 'Papa';
      const riskText = riskLevel === 'severe' ? 'significant signs of burnout' : 'signs of potential burnout';
      
      let message = `I've noticed ${parentName} is showing ${riskText}. This is something many parents experience, and there are ways to help.`;
      
      // Add intervention recommendations
      if (interventions && interventions.length > 0) {
        const topIntervention = interventions[0];
        
        message += `\n\nOne thing that might help: **${topIntervention.message}**\n\n${topIntervention.description}`;
        
        if (topIntervention.suggestedActions && topIntervention.suggestedActions.length > 0) {
          message += '\n\nSome specific steps you could try:';
          topIntervention.suggestedActions.slice(0, 2).forEach(action => {
            message += `\n• ${action}`;
          });
        }
        
        message += '\n\nWould you like to talk more about this? I can provide more suggestions or we can discuss what might work best for your family.';
      }
      
      // Send the message
      await this.chatService.sendAllieMessage(familyId, message, {
        type: 'burnout_alert',
        riskLevel,
        atRiskParent,
        hasInterventions: interventions && interventions.length > 0
      });
      
      // Record that we sent this alert
      await setDoc(doc(db, "burnoutAlerts", familyId), {
        sentAt: new Date().toISOString(),
        riskLevel,
        atRiskParent,
        message
      });
    } catch (error) {
      console.error(`Error sending burnout message for family ${familyId}:`, error);
      throw error;
    }
  }

  /**
   * Send a proactive life stage transition message
   * @param {string} familyId - Family identifier
   * @param {Object} transition - Transition information
   * @param {Object} recommendations - Life stage recommendations
   */
  async sendLifeStageMessage(familyId, transition, recommendations) {
    try {
      const transitionName = transition.type.replace(/_/g, ' ');
      
      let message = `I've noticed your family is going through **${transitionName}**. This is an important transition that many families find both exciting and challenging.`;
      
      // Add child-specific context if available
      if (transition.name) {
        message += `\n\nWith ${transition.name} going through this stage, there are some specific strategies that might be helpful.`;
      }
      
      // Add recommendations if available
      if (recommendations && recommendations.childSpecific && recommendations.childSpecific.length > 0) {
        const childRecs = recommendations.childSpecific.find(rec => 
          rec.childName === transition.name
        );
        
        if (childRecs && childRecs.importantAreas) {
          message += '\n\nSome key areas to focus on during this transition:';
          childRecs.importantAreas.slice(0, 3).forEach(area => {
            message += `\n• ${area}`;
          });
        }
      }
      
      // Add transition-specific recommendations
      if (recommendations && recommendations.transitionSpecific && recommendations.transitionSpecific.length > 0) {
        const transRec = recommendations.transitionSpecific.find(rec => 
          rec.transition === transition.type
        );
        
        if (transRec && transRec.suggestedApproaches) {
          message += '\n\nHere are a couple of strategies that often help:';
          transRec.suggestedApproaches.slice(0, 2).forEach(approach => {
            message += `\n• ${approach}`;
          });
        }
      }
      
      message += '\n\nWould you like to talk more about strategies for this transition, or would you like me to connect you with relevant resources?';
      
      // Send the message
      await this.chatService.sendAllieMessage(familyId, message, {
        type: 'life_stage_transition',
        transition: transition.type,
        childName: transition.name,
        hasRecommendations: recommendations && (
          (recommendations.childSpecific && recommendations.childSpecific.length > 0) ||
          (recommendations.transitionSpecific && recommendations.transitionSpecific.length > 0)
        )
      });
    } catch (error) {
      console.error(`Error sending life stage message for family ${familyId}:`, error);
      throw error;
    }
  }

  /**
   * Send a proactive cultural context message
   * @param {string} familyId - Family identifier
   * @param {string} valueSystem - Cultural value system
   * @param {Array} suggestions - Cultural suggestions
   */
  async sendCulturalContextMessage(familyId, valueSystem, suggestions) {
    try {
      // Format the value system name for display
      const formattedSystem = valueSystem
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      let message = `I've been thinking about how cultural contexts shape our family approaches. Based on your family's patterns, I notice elements of **${formattedSystem}** perspectives in how you approach family life.`;
      
      // Add cultural suggestions
      if (suggestions && suggestions.length > 0) {
        const topSuggestion = suggestions[0];
        
        message += `\n\n**${topSuggestion.title}**\n${topSuggestion.description}`;
        
        if (suggestions.length > 1) {
          message += `\n\nWould you like me to share more insights about how cultural perspectives might be influencing your family dynamics? This could help with creating balance strategies that align well with your values.`;
        }
      }
      
      // Send the message
      await this.chatService.sendAllieMessage(familyId, message, {
        type: 'cultural_context',
        valueSystem,
        hasSuggestions: suggestions && suggestions.length > 0
      });
    } catch (error) {
      console.error(`Error sending cultural context message for family ${familyId}:`, error);
      throw error;
    }
  }

  /**
   * Send a proactive relationship style message
   * @param {string} familyId - Family identifier
   * @param {string} style - Relationship style
   * @param {Array} recommendations - Relationship recommendations
   */
  async sendRelationshipStyleMessage(familyId, style, recommendations) {
    try {
      // Format the style name for display
      const formattedStyle = style
        .charAt(0).toUpperCase() + style.slice(1)
        .replace(/_/g, ' ');
      
      let message = `I've noticed that your relationship has elements of a **${formattedStyle}** approach to family responsibilities. Understanding this pattern can help optimize your family balance strategies.`;
      
      // Add relationship recommendations
      if (recommendations && recommendations.length > 0) {
        const topRecommendation = recommendations[0];
        
        message += `\n\n**${topRecommendation.title}**\n${topRecommendation.description}`;
        
        if (topRecommendation.actionItems && topRecommendation.actionItems.length > 0) {
          message += '\n\nYou might consider:';
          topRecommendation.actionItems.slice(0, 2).forEach(action => {
            message += `\n• ${action}`;
          });
        }
        
        if (recommendations.length > 1) {
          message += `\n\nWould you like to explore more strategies that align with your relationship dynamics? I can suggest approaches that could enhance your family balance in a way that feels natural for your relationship style.`;
        }
      }
      
      // Send the message
      await this.chatService.sendAllieMessage(familyId, message, {
        type: 'relationship_style',
        style,
        hasRecommendations: recommendations && recommendations.length > 0
      });
    } catch (error) {
      console.error(`Error sending relationship style message for family ${familyId}:`, error);
      throw error;
    }
  }
}

export default new AllieProactiveService();