import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';
import AllieAIService from './AllieAIService';

class SiblingDynamicsService {
  constructor() {
    this.allieService = AllieAIService;
    this.knowledgeGraph = FamilyKnowledgeGraph;
  }

  // Based on NYT Article: Track spillover effects between siblings
  async trackSpilloverEffect(familyId, sourceChildId, targetChildId, effectType, details) {
    const spilloverDoc = {
      familyId,
      sourceChildId,
      targetChildId,
      effectType, // 'academic', 'athletic', 'creative', 'social'
      details,
      magnitude: await this.calculateEffectMagnitude(details),
      timestamp: serverTimestamp(),
      verified: false
    };

    const spilloverRef = doc(collection(db, 'siblingSpilloverEffects'));
    await setDoc(spilloverRef, spilloverDoc);

    // Update knowledge graph with spillover connection
    await this.knowledgeGraph.createRelationship(
      sourceChildId,
      targetChildId,
      'INFLUENCES',
      { type: effectType, strength: spilloverDoc.magnitude }
    );

    return spilloverRef.id;
  }

  // Detect natural differentiation patterns (from NYT research)
  async analyzeSiblingDifferentiation(familyId) {
    const familyRef = doc(db, 'families', familyId);
    const familyData = await getDoc(familyRef);
    const children = familyData.data()?.children || [];

    const differentiationPatterns = {
      domains: {},
      recommendations: [],
      naturalNiches: {}
    };

    for (const child of children) {
      const childData = await this.getChildProfile(child.id);
      const siblings = children.filter(c => c.id !== child.id);

      // Analyze each child's unique strengths
      const strengths = await this.identifyUniqueStrengths(child.id, siblings);
      differentiationPatterns.domains[child.id] = strengths;

      // Identify natural niches based on birth order and existing interests
      const niche = await this.suggestNaturalNiche(child, siblings, childData);
      differentiationPatterns.naturalNiches[child.id] = niche;
    }

    // Generate recommendations to reduce competition and increase harmony
    differentiationPatterns.recommendations = await this.generateDifferentiationRecommendations(
      differentiationPatterns.domains,
      differentiationPatterns.naturalNiches
    );

    return differentiationPatterns;
  }

  // Sibling teaching moments detection
  async detectTeachingOpportunities(familyId) {
    const opportunities = [];
    const familyData = await this.getFamilyData(familyId);
    const children = familyData.children || [];

    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const olderChild = children[i];
        const youngerChild = children[j];

        // Check skill gaps that could create teaching opportunities
        const skillGaps = await this.analyzeSkillGaps(olderChild.id, youngerChild.id);
        
        for (const gap of skillGaps) {
          if (gap.teachable && gap.ageAppropriate) {
            opportunities.push({
              teacherId: olderChild.id,
              learnerId: youngerChild.id,
              skill: gap.skill,
              currentGap: gap.level,
              estimatedBenefit: gap.benefit,
              suggestedActivities: await this.generateTeachingActivities(gap.skill, olderChild.age, youngerChild.age),
              parentalLoadReduction: gap.parentTimesSaved // hours per week
            });
          }
        }
      }
    }

    return opportunities;
  }

  // Track sibling collaboration success
  async recordSiblingCollaboration(familyId, participants, activity, outcome) {
    const collaborationDoc = {
      familyId,
      participants, // array of child IDs
      activity,
      outcome,
      successMetrics: await this.evaluateCollaborationSuccess(outcome),
      timestamp: serverTimestamp(),
      parentalInvolvementLevel: outcome.parentalInvolvement || 'minimal'
    };

    const collabRef = doc(collection(db, 'siblingCollaborations'));
    await setDoc(collabRef, collaborationDoc);

    // Update each child's collaboration score
    for (const childId of participants) {
      await this.updateCollaborationScore(childId, collaborationDoc.successMetrics);
    }

    return collabRef.id;
  }

  // Generate sibling support suggestions based on current family dynamics
  async generateSiblingSupportPlan(familyId) {
    const familyData = await this.getFamilyData(familyId);
    const currentDynamics = await this.analyzeSiblingDifferentiation(familyId);
    const teachingOps = await this.detectTeachingOpportunities(familyId);

    const supportPlan = {
      immediateActions: [],
      weeklyGoals: [],
      monthlyMilestones: [],
      parentalLoadReduction: 0
    };

    // Immediate actions based on spillover opportunities
    for (const child of familyData.children) {
      const spilloverTargets = await this.identifySpilloverTargets(child.id, familyData.children);
      
      for (const target of spilloverTargets) {
        supportPlan.immediateActions.push({
          type: 'spillover_activation',
          sourceChild: child.id,
          targetChild: target.childId,
          action: target.suggestedAction,
          expectedBenefit: target.expectedBenefit,
          implementation: target.implementation
        });
      }
    }

    // Weekly collaboration goals
    const collaborationPairs = await this.optimizeCollaborationPairs(familyData.children);
    supportPlan.weeklyGoals = collaborationPairs.map(pair => ({
      type: 'sibling_collaboration',
      participants: pair.participants,
      activity: pair.suggestedActivity,
      duration: pair.estimatedDuration,
      parentalTimesSaved: pair.parentalTimeSaved
    }));

    // Calculate total parental load reduction
    supportPlan.parentalLoadReduction = this.calculateTotalLoadReduction(
      supportPlan.immediateActions,
      supportPlan.weeklyGoals,
      teachingOps
    );

    return supportPlan;
  }

  // Helper methods
  async calculateEffectMagnitude(details) {
    // Use AI to assess the strength of the spillover effect
    const prompt = `Assess the magnitude of this sibling spillover effect on a scale of 1-10: ${JSON.stringify(details)}`;
    const response = await this.allieService.generateResponse(prompt, { mode: 'analysis' });
    return parseFloat(response.magnitude) || 5;
  }

  async identifyUniqueStrengths(childId, siblings) {
    const childProfile = await this.getChildProfile(childId);
    const siblingProfiles = await Promise.all(siblings.map(s => this.getChildProfile(s.id)));
    
    const strengths = {
      primary: [],
      emerging: [],
      potential: []
    };

    // Analyze areas where child excels compared to siblings
    const domains = ['academic', 'athletic', 'creative', 'social', 'practical'];
    
    for (const domain of domains) {
      const childScore = childProfile.scores?.[domain] || 0;
      const siblingAverage = siblingProfiles.reduce((sum, p) => sum + (p.scores?.[domain] || 0), 0) / siblingProfiles.length;
      
      if (childScore > siblingAverage * 1.2) {
        strengths.primary.push(domain);
      } else if (childScore > siblingAverage) {
        strengths.emerging.push(domain);
      } else if (childProfile.interests?.includes(domain) && childScore < siblingAverage * 0.8) {
        // Area of interest where child could differentiate
        strengths.potential.push(domain);
      }
    }

    return strengths;
  }

  async getChildProfile(childId) {
    const profileRef = doc(db, 'childProfiles', childId);
    const profileDoc = await getDoc(profileRef);
    return profileDoc.exists() ? profileDoc.data() : {};
  }

  async getFamilyData(familyId) {
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    return familyDoc.exists() ? familyDoc.data() : {};
  }

  async suggestNaturalNiche(child, siblings, childData) {
    // Based on birth order research from NYT article
    const birthOrder = siblings.filter(s => s.age > child.age).length + 1;
    const totalSiblings = siblings.length + 1;

    const nicheFactors = {
      birthOrder,
      isYoungest: birthOrder === totalSiblings,
      isOldest: birthOrder === 1,
      currentInterests: childData.interests || [],
      personalityTraits: childData.personality || [],
      siblingDomains: await this.getSiblingDominantDomains(siblings)
    };

    // Use AI to suggest natural niche
    const prompt = `Based on birth order research and sibling differentiation patterns, suggest a natural niche for this child: ${JSON.stringify(nicheFactors)}`;
    const response = await this.allieService.generateResponse(prompt, { mode: 'recommendation' });
    
    return {
      suggestedNiche: response.niche,
      reasoning: response.reasoning,
      activities: response.activities,
      differentiationStrategy: response.strategy
    };
  }

  async generateDifferentiationRecommendations(domains, niches) {
    const recommendations = [];

    for (const [childId, niche] of Object.entries(niches)) {
      recommendations.push({
        childId,
        recommendation: niche.suggestedNiche,
        implementation: niche.activities,
        expectedOutcome: `Reduced sibling competition, increased family harmony`,
        parentalAction: `Support ${childId}'s exploration of ${niche.suggestedNiche}`
      });
    }

    return recommendations;
  }

  async analyzeSkillGaps(olderChildId, youngerChildId) {
    const olderProfile = await this.getChildProfile(olderChildId);
    const youngerProfile = await this.getChildProfile(youngerChildId);

    const gaps = [];
    const skills = ['reading', 'math', 'writing', 'problem-solving', 'social', 'creative', 'physical'];

    for (const skill of skills) {
      const olderLevel = olderProfile.skillLevels?.[skill] || 0;
      const youngerLevel = youngerProfile.skillLevels?.[skill] || 0;
      const gap = olderLevel - youngerLevel;

      if (gap > 2 && gap < 5) { // Teachable range
        gaps.push({
          skill,
          level: gap,
          teachable: true,
          ageAppropriate: this.isAgeAppropriateGap(olderProfile.age, youngerProfile.age, skill),
          benefit: this.calculateTeachingBenefit(skill, gap),
          parentTimeSaved: this.estimateParentTimeSaved(skill, gap)
        });
      }
    }

    return gaps;
  }

  isAgeAppropriateGap(olderAge, youngerAge, skill) {
    const ageDiff = olderAge - youngerAge;
    
    // Different skills have different appropriate age gaps
    const appropriateGaps = {
      'reading': [2, 6],
      'math': [2, 5],
      'social': [1, 4],
      'creative': [1, 8],
      'physical': [2, 5]
    };

    const range = appropriateGaps[skill] || [2, 5];
    return ageDiff >= range[0] && ageDiff <= range[1];
  }

  calculateTeachingBenefit(skill, gap) {
    // Higher gaps in foundational skills provide more benefit
    const skillWeights = {
      'reading': 1.5,
      'math': 1.4,
      'writing': 1.3,
      'problem-solving': 1.6,
      'social': 1.2,
      'creative': 1.1,
      'physical': 1.0
    };

    return (skillWeights[skill] || 1) * gap * 2;
  }

  estimateParentTimeSaved(skill, gap) {
    // Estimate hours per week saved when sibling teaches
    const baseTimeSaved = {
      'reading': 3,
      'math': 2.5,
      'writing': 2,
      'problem-solving': 2,
      'social': 1.5,
      'creative': 2,
      'physical': 2.5
    };

    return (baseTimeSaved[skill] || 2) * (gap / 3);
  }

  async generateTeachingActivities(skill, olderAge, youngerAge) {
    const prompt = `Generate age-appropriate activities where a ${olderAge}-year-old can teach ${skill} to a ${youngerAge}-year-old sibling. Focus on activities that are fun, build connection, and require minimal parent supervision.`;
    
    const response = await this.allieService.generateResponse(prompt, { mode: 'activity_generation' });
    return response.activities || [];
  }

  async updateCollaborationScore(childId, metrics) {
    const profileRef = doc(db, 'childProfiles', childId);
    const profile = await getDoc(profileRef);
    
    if (profile.exists()) {
      const currentScore = profile.data().collaborationScore || 0;
      const newScore = currentScore + metrics.points;
      
      await updateDoc(profileRef, {
        collaborationScore: newScore,
        lastCollaboration: serverTimestamp(),
        collaborationHistory: [...(profile.data().collaborationHistory || []), metrics]
      });
    }
  }

  async identifySpilloverTargets(sourceChildId, allChildren) {
    const sourceProfile = await this.getChildProfile(sourceChildId);
    const targets = [];

    for (const child of allChildren) {
      if (child.id !== sourceChildId) {
        const targetProfile = await this.getChildProfile(child.id);
        
        // Look for areas where source child excels and target could benefit
        for (const [skill, level] of Object.entries(sourceProfile.skillLevels || {})) {
          const targetLevel = targetProfile.skillLevels?.[skill] || 0;
          
          if (level > targetLevel + 2) {
            targets.push({
              childId: child.id,
              skill,
              currentGap: level - targetLevel,
              suggestedAction: await this.generateSpilloverAction(sourceChildId, child.id, skill),
              expectedBenefit: this.calculateSpilloverBenefit(skill, level - targetLevel),
              implementation: await this.generateImplementationPlan(sourceChildId, child.id, skill)
            });
          }
        }
      }
    }

    return targets;
  }

  async generateSpilloverAction(sourceId, targetId, skill) {
    const prompt = `Create a specific action plan for positive spillover effect where child ${sourceId} influences child ${targetId} in ${skill}. Make it natural and peer-based, not formal teaching.`;
    const response = await this.allieService.generateResponse(prompt, { mode: 'action_planning' });
    return response.action || '';
  }

  calculateSpilloverBenefit(skill, gap) {
    return Math.min(gap * 1.5, 10); // Cap at 10
  }

  async generateImplementationPlan(sourceId, targetId, skill) {
    return {
      week1: `Set up shared ${skill} time between siblings`,
      week2: `Encourage natural peer learning through play`,
      week3: `Create collaborative projects`,
      week4: `Celebrate joint achievements`
    };
  }

  async optimizeCollaborationPairs(children) {
    const pairs = [];
    
    // Generate all possible pairs
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const compatibility = await this.assessSiblingCompatibility(children[i], children[j]);
        
        if (compatibility.score > 0.6) {
          pairs.push({
            participants: [children[i].id, children[j].id],
            compatibilityScore: compatibility.score,
            suggestedActivity: compatibility.bestActivity,
            estimatedDuration: compatibility.duration,
            parentalTimeSaved: compatibility.parentTimeSaved
          });
        }
      }
    }

    // Sort by compatibility and return top pairs
    return pairs.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);
  }

  async assessSiblingCompatibility(child1, child2) {
    const profile1 = await this.getChildProfile(child1.id);
    const profile2 = await this.getChildProfile(child2.id);

    const sharedInterests = profile1.interests?.filter(i => profile2.interests?.includes(i)) || [];
    const ageDiff = Math.abs(child1.age - child2.age);
    
    // Calculate compatibility score
    const score = (sharedInterests.length * 0.3) + 
                  (ageDiff < 3 ? 0.4 : 0.2) + 
                  (profile1.personality?.social || 0) * 0.15 +
                  (profile2.personality?.social || 0) * 0.15;

    // Find best collaborative activity
    const bestActivity = await this.findBestCollaborativeActivity(
      sharedInterests,
      child1.age,
      child2.age
    );

    return {
      score: Math.min(score, 1),
      bestActivity,
      duration: 45, // minutes
      parentTimeSaved: 0.75 // hours
    };
  }

  async findBestCollaborativeActivity(interests, age1, age2) {
    if (interests.length === 0) {
      return 'Creative building project';
    }

    const prompt = `Suggest the best collaborative activity for siblings aged ${age1} and ${age2} with shared interests in: ${interests.join(', ')}`;
    const response = await this.allieService.generateResponse(prompt, { mode: 'activity_suggestion' });
    return response.activity || 'Joint creative project';
  }

  calculateTotalLoadReduction(immediateActions, weeklyGoals, teachingOps) {
    let totalHours = 0;

    // Sum up all time savings
    immediateActions.forEach(action => {
      totalHours += action.parentalTimeSaved || 0;
    });

    weeklyGoals.forEach(goal => {
      totalHours += goal.parentalTimesSaved || 0;
    });

    teachingOps.forEach(op => {
      totalHours += op.parentalLoadReduction || 0;
    });

    return totalHours;
  }

  async getSiblingDominantDomains(siblings) {
    const domains = {};
    
    for (const sibling of siblings) {
      const profile = await this.getChildProfile(sibling.id);
      const topDomain = this.findTopDomain(profile);
      if (topDomain) {
        domains[sibling.id] = topDomain;
      }
    }

    return domains;
  }

  findTopDomain(profile) {
    const scores = profile.scores || {};
    let topDomain = null;
    let topScore = 0;

    for (const [domain, score] of Object.entries(scores)) {
      if (score > topScore) {
        topScore = score;
        topDomain = domain;
      }
    }

    return topDomain;
  }

  async evaluateCollaborationSuccess(outcome) {
    const metrics = {
      points: 0,
      skills: []
    };

    if (outcome.completed) metrics.points += 5;
    if (outcome.noConflicts) metrics.points += 3;
    if (outcome.helpedEachOther) metrics.points += 4;
    if (outcome.createdSomethingNew) metrics.points += 5;

    return metrics;
  }
}

export default new SiblingDynamicsService();