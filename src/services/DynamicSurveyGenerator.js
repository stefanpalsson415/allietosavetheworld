// Dynamic Survey Generator - AI-powered personalized questions
import ClaudeService from './ClaudeService';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { surveyConfig } from '../config/surveyConfig';
import LocationService from './LocationService';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

class DynamicSurveyGenerator {
  constructor() {
    this.categories = [
      "Visible Household Tasks",
      "Invisible Household Tasks", 
      "Visible Parental Tasks",
      "Invisible Parental Tasks"
    ];
  }

  // Get contextual data about the family
  async getFamilyContext(familyId, memberId) {
    try {
      // Get family data
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.data();
      
      // Get member data
      const member = familyData.familyMembers.find(m => m.id === memberId);
      
      // Get location data for weather/cultural context
      const location = familyData.location || {};
      
      // Get previous responses to understand patterns
      const responsesQuery = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId)
      );
      const responsesSnap = await getDocs(responsesQuery);
      
      const previousResponses = {};
      responsesSnap.forEach(doc => {
        const data = doc.data();
        if (data.responses) {
          Object.assign(previousResponses, data.responses);
        }
      });

      // Get current date/season
      const now = new Date();
      const month = now.getMonth();
      const season = this.getSeason(month, location.latitude);
      
      // Get family structure
      const parents = familyData.familyMembers.filter(m => m.role === 'parent');
      const children = familyData.familyMembers.filter(m => m.role === 'child');
      
      // Get interview insights for personalized questions
      // Use the singleton instance, not the prototype
      const interviewInsights = await QuantumKnowledgeGraph.getInterviewInsights(familyId);
      const personInsights = await QuantumKnowledgeGraph.getPersonInterviewInsights(familyId, member.name);

      return {
        familyId,
        memberId,
        memberName: member.name,
        memberRole: member.role,
        memberAge: member.age,
        location: {
          city: location.city || 'Unknown',
          country: location.country || 'Unknown',
          latitude: location.latitude,
          longitude: location.longitude
        },
        season,
        currentDate: now.toISOString(),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        familyStructure: {
          parentCount: parents.length,
          parentNames: parents.map(p => p.name),
          childCount: children.length,
          childrenAges: children.map(c => ({ name: c.name, age: c.age || 'Unknown' }))
        },
        previousResponses: Object.keys(previousResponses).length,
        culturalContext: this.getCulturalContext(location.country),
        priorities: Array.isArray(familyData.priorities) ? familyData.priorities : [],
        specialCircumstances: familyData.specialCircumstances || [],

        // Interview insights for personalization
        interviewInsights: {
          invisibleWorkPatterns: interviewInsights?.invisibleWorkPatterns || null,
          stressCapacity: interviewInsights?.stressCapacityData || null,
          decisionMaking: interviewInsights?.decisionMakingStyles || null,
          personSpecific: personInsights || null
        }
      };
    } catch (error) {
      console.error('Error getting family context:', error);
      return null;
    }
  }

  getSeason(month, latitude) {
    // Northern hemisphere
    if (!latitude || latitude >= 0) {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'autumn';
      return 'winter';
    } else {
      // Southern hemisphere - reversed
      if (month >= 2 && month <= 4) return 'autumn';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
  }

  getCulturalContext(country) {
    const contexts = {
      'Sweden': {
        workCulture: 'Strong emphasis on work-life balance, generous parental leave',
        familyNorms: 'Equal parenting expected, fika tradition, outdoor activities valued',
        specificTasks: ['Managing barnvagn (stroller) in snow', 'Coordinating förskola (preschool)', 'Planning semester (vacation)']
      },
      'United States': {
        workCulture: 'Limited parental leave, high work demands',
        familyNorms: 'Varied by region, often one primary caregiver',
        specificTasks: ['Managing school pickup/dropoff', 'Coordinating extracurriculars', 'Healthcare appointments']
      },
      // Add more countries as needed
    };
    
    return contexts[country] || contexts['United States'];
  }

  async generatePersonalizedQuestions(familyId, memberId, targetCount = 72) {
    // Check if dynamic questions are enabled
    if (!surveyConfig.enableDynamicQuestions) {
      throw new Error('Dynamic questions are disabled');
    }

    const context = await this.getFamilyContext(familyId, memberId);

    if (!context) {
      throw new Error('Could not get family context');
    }

    // Check if we have cached questions for this member (valid for 7 days)
    const cacheKey = `survey_questions_${familyId}_${memberId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const isRecent = Date.now() - parsedCache.timestamp < 7 * 24 * 60 * 60 * 1000; // 7 days instead of 24 hours
        if (isRecent && parsedCache.questions && parsedCache.questions.length >= targetCount) {
          console.log(`✅ Using cached personalized questions (${parsedCache.questions.length})`);
          return parsedCache.questions.slice(0, targetCount); // Return exactly the target count
        }
      }
    } catch (e) {
      console.log('No cached questions available');
    }
    
    // Update location if needed
    if (surveyConfig.enableLocationPersonalization && 
        (!context.location.latitude || context.location.city === 'Unknown')) {
      try {
        const newLocation = await LocationService.getCurrentLocation();
        if (newLocation.city !== 'Unknown') {
          await LocationService.updateFamilyLocation(familyId, newLocation);
          context.location = newLocation;
        }
      } catch (error) {
        console.log('Could not update location:', error);
      }
    }

    // Try batch generation for faster loading
    console.log('🚀 Attempting fast batch generation...');
    try {
      const questions = await this.generateQuestionsBatch(context, targetCount);
      if (questions && questions.length >= targetCount) {
        console.log(`✅ Fast batch generation successful: ${questions.length} questions`);
        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify({
          questions: questions,
          timestamp: Date.now()
        }));
        return questions.slice(0, targetCount);
      }
    } catch (error) {
      console.log('⚠️ Batch generation failed, falling back to single request:', error.message);
    }

    const systemPrompt = `You are an expert in family dynamics and parental workload distribution. 
Your task is to generate ${targetCount} highly personalized survey questions that will help identify imbalances in parental workload.

CRITICAL CONTEXT about this family:
- Location: ${context.location.city}, ${context.location.country}
- Current season: ${context.season}
- Day of week: ${context.dayOfWeek}
- Family structure: ${context.familyStructure.parentCount} parents (${context.familyStructure.parentNames.join(', ')}), ${context.familyStructure.childCount} children
- Children ages: ${context.familyStructure.childrenAges.map(c => `${c.name} (${c.age})`).join(', ')}
- Cultural context: ${JSON.stringify(context.culturalContext)}
- Family priorities: ${Array.isArray(context.priorities) ? context.priorities.join(', ') : 'balanced parenting'}

The person taking the survey is: ${context.memberName} (${context.memberRole}${context.memberAge ? `, age ${context.memberAge}` : ''})

CRITICAL: If the person taking the survey is a child (${context.memberRole === 'child' ? 'YES - THIS IS A CHILD' : 'No - this is a parent'}):
- When asking about tasks involving the survey-taker and their siblings, use "you and [sibling names]" NOT "you, [survey-taker name], and [sibling names]"
- Example: "Which parent makes breakfast for you and Kimberly?" (NOT "you, Eric, and Kimberly")
- The child taking the survey should always be referred to as "you" in the questions

REQUIREMENTS:
1. Questions must be distributed across these 4 categories:
   - Visible Household Tasks (18 questions)
   - Invisible Household Tasks (18 questions)
   - Visible Parental Tasks (18 questions)
   - Invisible Parental Tasks (18 questions)

2. Each question should:
   - Be specific to their location/culture/season
   - Reference actual family members by name when appropriate
   - Consider the ages of children
   - Be answerable with: Mama, Papa, Both equally, No one, Not applicable
   - Feel like it was written specifically for THIS family

3. IMPORTANT PHRASING RULES:
   - If the survey taker is a CHILD, refer to them as "you" in questions
   - When asking about tasks for multiple children and the survey taker is one of them:
     * Say "you and [other children]" NOT "you, [child's name], and [other children]"
     * Example for Eric taking survey: "you and Kimberly" NOT "you, Eric, and Kimberly"
   - If the survey taker is a PARENT, you can use children's names normally

4. Question types to include:
   - Season-specific (e.g., "Who manages winter clothing for ${context.familyStructure.childrenAges[0]?.name}?" if winter)
   - Culture-specific (e.g., Swedish families: "Who coordinates fika supplies?")
   - Age-specific (e.g., for families with teens: "Who monitors social media usage?")
   - Day-specific (e.g., weekend vs weekday tasks)
   - Location-specific (city vs rural tasks)

5. Make questions feel natural and conversational, like:
   - "In your family, who typically..."
   - "When it comes to [specific task], who usually..."
   - "During ${context.season}, who handles..."

IMPORTANT: Keep your response under 3500 characters to avoid truncation.
Return ONLY valid JSON (no markdown backticks) with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "category": "Category name",
      "personalizedFor": "${context.memberName}"
    }
  ]
}

Omit 'contextualRelevance' field to save space. Generate EXACTLY ${targetCount} questions.`;

    const userPrompt = `Generate ${targetCount} personalized survey questions for the ${context.memberName} from the ${context.familyStructure.parentNames.join(' and ')} family in ${context.location.city}, ${context.location.country}.

Remember:
- It's currently ${context.season}
- They have ${context.familyStructure.childCount} children: ${context.familyStructure.childrenAges.map(c => `${c.name} (${c.age})`).join(', ')}
- The family's stated priorities are: ${Array.isArray(context.priorities) && context.priorities.length > 0 ? context.priorities.join(', ') : 'balanced parenting'}
${context.specialCircumstances.length > 0 ? `- Special circumstances: ${context.specialCircumstances.join(', ')}` : ''}

Make the questions feel like they were written by someone who knows this family personally.`;

    try {
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: userPrompt }],
        {
          model: 'claude-haiku-4-5-20251001', // Haiku 4.5 for fast, cost-effective survey generation
          system: systemPrompt,
          max_tokens: 8000, // Increased for 72 questions (was defaulting to 1024)
          temperature: 0.7 // IMPORTANT: Haiku 4.5 requires ONLY temperature (not top_p)
        }
      );

      // Clean Claude response - remove markdown wrapper if present
      let cleanedResponse = response;

      // First check if response is a string
      if (typeof response === 'string') {
        // Remove any leading/trailing whitespace
        cleanedResponse = response.trim();

        // Check for markdown code blocks
        if (cleanedResponse.includes('```')) {
          // Try to extract JSON from markdown
          const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedResponse = jsonMatch[1].trim();
          }
        }

        // If it still starts with backticks, remove them
        if (cleanedResponse.startsWith('`')) {
          cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, '').trim();
        }

        // Remove "json" prefix if present (Claude sometimes adds this)
        if (cleanedResponse.startsWith('json\n')) {
          cleanedResponse = cleanedResponse.substring(5).trim();
        } else if (cleanedResponse.startsWith('json')) {
          cleanedResponse = cleanedResponse.substring(4).trim();
        }

        // Remove any other non-JSON prefixes
        const jsonStartIndex = cleanedResponse.search(/^\s*[\{\[]/);
        if (jsonStartIndex > 0) {
          cleanedResponse = cleanedResponse.substring(jsonStartIndex);
        }
      }

      // Parse the cleaned response
      let questions;
      try {
        const parsed = JSON.parse(cleanedResponse);
        questions = parsed.questions || [];
      } catch (parseError) {
        // Log more details about the parsing error
        console.error('Failed to parse cleaned response. Response length:', cleanedResponse.length);
        console.error('First 500 chars:', cleanedResponse.substring(0, 500));
        console.error('Last 500 chars:', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 500)));

        // Try to recover by finding valid JSON portion
        try {
          // Look for a complete JSON object by finding matching braces
          const startIndex = cleanedResponse.indexOf('{');
          if (startIndex >= 0) {
            let braceCount = 0;
            let endIndex = -1;

            for (let i = startIndex; i < cleanedResponse.length; i++) {
              if (cleanedResponse[i] === '{') braceCount++;
              else if (cleanedResponse[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }

            if (endIndex > startIndex) {
              const recoveredJson = cleanedResponse.substring(startIndex, endIndex);
              const parsed = JSON.parse(recoveredJson);
              console.log('✅ Successfully recovered JSON from partial response');
              questions = parsed.questions || [];
            } else {
              throw parseError;
            }
          } else {
            throw parseError;
          }
        } catch (recoveryError) {
          console.error('Could not recover valid JSON from response');
          throw parseError;
        }
      }
      
      // Add metadata to each question
      const processedQuestions = questions.map((q, index) => ({
        ...q,
        id: `q${index + 1}`,
        generatedAt: new Date().toISOString(),
        contextUsed: {
          location: context.location,
          season: context.season,
          familyStructure: context.familyStructure
        }
      }));

      // Cache the questions for future use
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          questions: processedQuestions,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('Could not cache questions');
      }

      return processedQuestions;
      
    } catch (error) {
      console.error('Error generating personalized questions:', error);
      throw error;
    }
  }

  // Generate follow-up questions based on responses
  async generateFollowUpQuestions(familyId, memberId, previousResponses, count = 20) {
    const context = await this.getFamilyContext(familyId, memberId);
    
    // Analyze patterns in previous responses
    const patterns = this.analyzeResponsePatterns(previousResponses);
    
    const systemPrompt = `Based on the survey responses, generate ${count} follow-up questions to dig deeper into identified imbalances.

Family context: ${JSON.stringify(context)}

Response patterns identified:
${JSON.stringify(patterns)}

Generate questions that:
1. Explore WHY certain imbalances exist
2. Understand the impact on family members
3. Identify specific pain points
4. Uncover hidden work that might not be recognized

Make questions empathetic and non-judgmental.`;

    try {
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: `Generate ${count} follow-up questions based on these patterns: ${JSON.stringify(patterns)}` }],
        { system: systemPrompt }
      );

      // Clean Claude response - remove markdown wrapper if present
      let cleanedResponse = response;

      // First check if response is a string
      if (typeof response === 'string') {
        // Remove any leading/trailing whitespace
        cleanedResponse = response.trim();

        // Check for markdown code blocks
        if (cleanedResponse.includes('```')) {
          // Try to extract JSON from markdown
          const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedResponse = jsonMatch[1].trim();
          }
        }

        // If it still starts with backticks, remove them
        if (cleanedResponse.startsWith('`')) {
          cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, '').trim();
        }

        // Remove "json" prefix if present (Claude sometimes adds this)
        if (cleanedResponse.startsWith('json\n')) {
          cleanedResponse = cleanedResponse.substring(5).trim();
        } else if (cleanedResponse.startsWith('json')) {
          cleanedResponse = cleanedResponse.substring(4).trim();
        }

        // Remove any other non-JSON prefixes
        const jsonStartIndex = cleanedResponse.search(/^\s*[\{\[]/);
        if (jsonStartIndex > 0) {
          cleanedResponse = cleanedResponse.substring(jsonStartIndex);
        }
      }

      // Parse and return
      try {
        const parsed = JSON.parse(cleanedResponse);
        return parsed.questions || [];
      } catch (parseError) {
        // Log more details about the parsing error
        console.error('Failed to parse follow-up response. Response length:', cleanedResponse.length);
        console.error('First 500 chars:', cleanedResponse.substring(0, 500));

        // Try to recover by finding valid JSON portion
        try {
          const startIndex = cleanedResponse.indexOf('{');
          if (startIndex >= 0) {
            let braceCount = 0;
            let endIndex = -1;

            for (let i = startIndex; i < cleanedResponse.length; i++) {
              if (cleanedResponse[i] === '{') braceCount++;
              else if (cleanedResponse[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }

            if (endIndex > startIndex) {
              const recoveredJson = cleanedResponse.substring(startIndex, endIndex);
              const parsed = JSON.parse(recoveredJson);
              console.log('✅ Successfully recovered follow-up JSON from partial response');
              return parsed.questions || [];
            }
          }
        } catch (recoveryError) {
          console.error('Could not recover valid JSON from follow-up response');
        }

        throw parseError;
      }
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      throw error;
    }
  }

  analyzeResponsePatterns(responses) {
    const patterns = {
      mamaHeavy: [],
      papaHeavy: [],
      balanced: [],
      noOne: []
    };

    Object.entries(responses).forEach(([questionId, answer]) => {
      if (answer === 'Mama') patterns.mamaHeavy.push(questionId);
      else if (answer === 'Papa') patterns.papaHeavy.push(questionId);
      else if (answer === 'Both equally') patterns.balanced.push(questionId);
      else if (answer === 'No one') patterns.noOne.push(questionId);
    });

    return {
      ...patterns,
      mamaPercentage: (patterns.mamaHeavy.length / Object.keys(responses).length) * 100,
      papaPercentage: (patterns.papaHeavy.length / Object.keys(responses).length) * 100,
      significantImbalance: Math.abs(patterns.mamaHeavy.length - patterns.papaHeavy.length) > 10
    };
  }

  // Fast batch generation method - generates questions in smaller, parallel batches
  async generateQuestionsBatch(context, targetCount = 72) {
    const batchSize = 18; // Generate 18 questions per batch (4 batches for 72 total)
    const numBatches = Math.ceil(targetCount / batchSize);
    const categories = [
      "Visible Household Tasks",
      "Invisible Household Tasks",
      "Visible Parental Tasks",
      "Invisible Parental Tasks"
    ];

    console.log(`🔥 Generating ${targetCount} questions in ${numBatches} batches of ${batchSize}`);

    // Create batch promises for parallel execution
    const batchPromises = [];
    for (let i = 0; i < numBatches; i++) {
      const category = categories[i % categories.length];
      const questionsInBatch = Math.min(batchSize, targetCount - (i * batchSize));

      batchPromises.push(this.generateCategoryBatch(context, category, questionsInBatch, i + 1));
    }

    // Execute all batches in parallel for maximum speed
    const batchResults = await Promise.all(batchPromises);

    // Combine all questions
    const allQuestions = batchResults.flat();
    console.log(`✅ Batch generation complete: ${allQuestions.length} questions generated`);

    return allQuestions;
  }

  // Generate a specific category batch
  async generateCategoryBatch(context, category, count, batchNumber) {
    const systemPrompt = `You are an expert in family dynamics and parental workload distribution.
Generate EXACTLY ${count} survey questions for the "${category}" category.

CRITICAL CONTEXT about this family:
- Location: ${context.location.city}, ${context.location.country}
- Family structure: ${context.familyStructure.parentCount} parents, ${context.familyStructure.childCount} children
- Children ages: ${context.familyStructure.childrenAges.map(c => `${c.name} (${c.age})`).join(', ')}
- Survey taker: ${context.memberName} (${context.memberRole})

REQUIREMENTS:
- Must return valid JSON array format: [{"id": "q1", "text": "Question text", "category": "${category}"}]
- Questions must be specific to ${category}
- Use family-specific details (names, ages, location)
- Make questions feel personal and relevant
- Each question should have unique "id" starting with "batch${batchNumber}_"`;

    const userPrompt = `Generate ${count} personalized survey questions for "${category}" category for this family context.
Return ONLY the JSON array, no other text.`;

    try {
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: userPrompt }],
        {
          system: systemPrompt,
          max_tokens: 2000 // Smaller token limit for faster generation
        }
      );

      // Parse the JSON response
      let cleanedResponse = response.trim();
      if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }

      const questions = JSON.parse(cleanedResponse);
      console.log(`✅ Batch ${batchNumber} (${category}): ${questions.length} questions`);

      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error);
      return [];
    }
  }
}

export default new DynamicSurveyGenerator();