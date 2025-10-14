// src/services/KidQuestionSimplifier.js
import ClaudeService from './ClaudeService';

class KidQuestionSimplifier {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Main function to simplify questions for children
   * @param {Object} question - The question object
   * @param {number} childAge - The child's age
   * @param {string} childName - The child's name (optional, for personalization)
   * @returns {string} - Simplified question text
   */
  simplifyQuestionForChild(question, childAge, childName = '') {
    if (!question || !question.text) return "Which parent does this in your family?";
    
    const cacheKey = `${question.id}-${childAge}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Determine age group
    const ageGroup = this.getAgeGroup(childAge);
    
    // Get simplified question based on age group
    let simplifiedText = '';
    switch (ageGroup) {
      case 'toddler': // 3-5
        simplifiedText = this.simplifyForToddler(question);
        break;
      case 'young': // 6-8
        simplifiedText = this.simplifyForYoungChild(question);
        break;
      case 'preteen': // 9-12
        simplifiedText = this.simplifyForPreteen(question);
        break;
      case 'teen': // 13+
        simplifiedText = this.simplifyForTeen(question);
        break;
      default:
        simplifiedText = this.simplifyForYoungChild(question);
    }

    // Personalize if name provided
    if (childName) {
      simplifiedText = simplifiedText.replace('your family', `your family, ${childName}`);
    }

    this.cache.set(cacheKey, simplifiedText);
    return simplifiedText;
  }

  getAgeGroup(age) {
    if (age <= 5) return 'toddler';
    if (age <= 8) return 'young';
    if (age <= 12) return 'preteen';
    return 'teen';
  }

  /**
   * Simplify for toddlers (ages 3-5)
   * Use very simple words and concrete concepts
   */
  simplifyForToddler(question) {
    const text = question.text.toLowerCase();
    const category = question.category || '';

    // Common household tasks
    if (text.includes('clean') && text.includes('floor')) {
      return "Which parent cleans the floor?";
    }
    if (text.includes('dishes')) {
      return "Which parent washes the dishes?";
    }
    if (text.includes('cook') || text.includes('meal')) {
      return "Which parent makes your food?";
    }
    if (text.includes('laundry')) {
      return "Which parent washes your clothes?";
    }
    if (text.includes('grocery') || text.includes('shopping')) {
      return "Which parent goes to the store to buy food?";
    }
    if (text.includes('trash')) {
      return "Which parent takes out the garbage?";
    }
    if (text.includes('bed') && text.includes('make')) {
      return "Which parent makes the beds?";
    }
    if (text.includes('pet')) {
      return "Which parent feeds your pets?";
    }
    if (text.includes('homework')) {
      return "Which parent helps you learn?";
    }
    if (text.includes('drive') || text.includes('school')) {
      return "Which parent takes you to school?";
    }
    if (text.includes('bedtime')) {
      return "Which parent puts you to bed?";
    }
    if (text.includes('bath')) {
      return "Which parent gives you a bath?";
    }
    if (text.includes('sick') || text.includes('doctor')) {
      return "Which parent takes care of you when you're sick?";
    }
    if (text.includes('birthday')) {
      return "Which parent plans your birthday party?";
    }
    if (text.includes('emotional')) {
      return "Which parent hugs you when you're sad?";
    }

    // Default: just replace "Who" with "Which parent"
    return text.replace(/^who\s+/i, "Which parent ");
  }

  /**
   * Simplify for young children (ages 6-8)
   * Use simple language but can handle slightly more complex concepts
   */
  simplifyForYoungChild(question) {
    const text = question.text;
    const category = question.category || '';

    // Map of complex phrases to simple ones
    const replacements = {
      'is responsible for': 'does',
      'typically': 'usually',
      'handles': 'does',
      'manages': 'takes care of',
      'coordinates': 'plans',
      'oversees': 'watches over',
      'maintains': 'keeps up',
      'anticipates': 'thinks ahead about',
      'monitors': 'watches',
      'provides emotional support': 'helps when you feel sad',
      'extracurricular activities': 'after-school activities',
      'troubleshooting': 'fixing',
      'malfunction': 'break',
      'digital security': 'keeping computers safe',
      'household': 'home',
      'appointments': 'doctor visits',
      'schedules': 'plans'
    };

    let simplified = text;
    
    // Apply replacements
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(complex, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Replace "Who" with "Which parent"
    simplified = simplified.replace(/^Who\s+/i, "Which parent ");

    // Specific simplifications
    if (text.includes('mental load')) {
      return "Which parent remembers all the things your family needs to do?";
    }
    if (text.includes('invisible') && category.includes('Parental')) {
      return "Which parent thinks about what you need before you ask?";
    }
    if (text.includes('emotional labor')) {
      return "Which parent helps everyone feel better?";
    }
    if (text.includes('developmental needs')) {
      return "Which parent thinks about what you'll need as you grow up?";
    }

    return simplified;
  }

  /**
   * Simplify for preteens (ages 9-12)
   * Can understand more concepts but still need clarity
   */
  simplifyForPreteen(question) {
    const text = question.text;
    
    // Map of complex phrases to preteen-friendly ones
    const replacements = {
      'is responsible for': 'usually handles',
      'primary responsibility': 'main job',
      'coordinates': 'organizes',
      'anticipates': 'plans ahead for',
      'mental load': 'keeping track of everything',
      'emotional labor': 'emotional support',
      'developmental needs': 'what you need as you grow',
      'extracurricular': 'after-school',
      'maintains social relationships': 'keeps in touch with friends and family',
      'oversees': 'manages',
      'troubleshooting': 'fixing problems with',
      'digital security': 'online safety'
    };

    let simplified = text;
    
    // Apply replacements
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(complex, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Replace "Who" with "Which parent"
    simplified = simplified.replace(/^Who\s+/i, "Which parent ");

    // Specific cases that need more context
    if (text.includes('invisible') && text.includes('household')) {
      return "Which parent does the planning and organizing that you might not see?";
    }
    if (text.includes('invisible') && text.includes('parental')) {
      return "Which parent thinks about and plans for what you need?";
    }

    return simplified;
  }

  /**
   * Simplify for teenagers (ages 13+)
   * Keep most concepts but clarify jargon
   */
  simplifyForTeen(question) {
    const text = question.text;
    
    // Minimal replacements for clarity
    const replacements = {
      'is responsible for': 'usually handles',
      'mental load': 'mental work of planning and remembering',
      'emotional labor': 'emotional support work',
      'anticipates developmental needs': 'plans for your future needs',
      'primary responsibility': 'main responsibility'
    };

    let simplified = text;
    
    // Apply replacements
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(complex, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Replace "Who" with "Which parent"
    simplified = simplified.replace(/^Who\s+/i, "Which parent ");

    return simplified;
  }

  /**
   * Use AI to generate even better kid-friendly versions
   * This is an async method that calls Claude for more natural simplifications
   */
  async generateAISimplifiedQuestion(question, childAge, childName = '') {
    try {
      const ageGroup = this.getAgeGroup(childAge);
      const ageDescription = {
        'toddler': '3-5 year old',
        'young': '6-8 year old', 
        'preteen': '9-12 year old',
        'teen': '13-17 year old'
      }[ageGroup];

      const prompt = `Please rewrite this survey question for a ${ageDescription} child. The question is asking which parent does this task in their family.

Original question: "${question.text}"
Category: ${question.category}

Requirements:
1. Start with "Which parent" instead of "Who"
2. Use age-appropriate vocabulary
3. Make it concrete and relatable to a child's experience
4. Keep it short and clear
5. Avoid abstract concepts for younger children
6. For household tasks, use words like "mom" and "dad" naturally if it helps clarity

Just provide the rewritten question, nothing else.`;

      const response = await ClaudeService.sendMessage(prompt, 'user-system');
      
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (error) {
      console.error('Error generating AI simplified question:', error);
    }
    
    // Fallback to non-AI simplification
    return this.simplifyQuestionForChild(question, childAge, childName);
  }

  /**
   * Batch process questions with AI for better performance
   */
  async batchSimplifyQuestions(questions, childAge) {
    const ageGroup = this.getAgeGroup(childAge);
    const ageDescription = {
      'toddler': '3-5 year old',
      'young': '6-8 year old', 
      'preteen': '9-12 year old',
      'teen': '13-17 year old'
    }[ageGroup];

    const prompt = `Please rewrite these survey questions for a ${ageDescription} child. These questions ask which parent does various tasks in their family.

Requirements for each question:
1. Start with "Which parent" instead of "Who"
2. Use age-appropriate vocabulary
3. Make it concrete and relatable to a child's experience
4. Keep it short and clear
5. Avoid abstract concepts for younger children

Here are the questions to rewrite:

${questions.map((q, i) => `${i + 1}. "${q.text}" (Category: ${q.category})`).join('\n')}

Please provide the rewritten questions in the same numbered format.`;

    try {
      const response = await ClaudeService.sendMessage(prompt, 'user-system');
      
      if (response && response.text) {
        // Parse the response to extract individual questions
        const lines = response.text.split('\n');
        const simplifiedQuestions = new Map();
        
        lines.forEach(line => {
          const match = line.match(/^(\d+)\.\s*(.+)$/);
          if (match) {
            const index = parseInt(match[1]) - 1;
            if (index >= 0 && index < questions.length) {
              simplifiedQuestions.set(questions[index].id, match[2].trim());
            }
          }
        });
        
        return simplifiedQuestions;
      }
    } catch (error) {
      console.error('Error batch simplifying questions:', error);
    }
    
    // Fallback to individual simplification
    const fallbackMap = new Map();
    questions.forEach(q => {
      fallbackMap.set(q.id, this.simplifyQuestionForChild(q, childAge));
    });
    return fallbackMap;
  }
}

export default new KidQuestionSimplifier();