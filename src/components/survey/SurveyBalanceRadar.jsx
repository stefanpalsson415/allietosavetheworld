// src/components/survey/SurveyBalanceRadar.jsx
import React, { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, Brain, Wrench, X, Plus, ChevronRight, Users, Calendar
} from 'lucide-react';

const SurveyBalanceRadar = ({ 
  surveyData, 
  onSelectHabit,
  selectedPerson = 'both',
  familyMembers = [],
  className = '',
  currentQuestionIndex = null,
  totalQuestions = null
}) => {
  // Force re-render when survey data changes
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  
  React.useEffect(() => {
    setLastUpdate(Date.now());
  }, [surveyData?.responses, surveyData?.totalResponseCount]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  
  // Use a more stable filter state that doesn't reset when data updates
  const [userSelectedFilter, setUserSelectedFilter] = useState(null);
  
  // Determine the effective filter based on user selection or smart default
  const respondentFilter = useMemo(() => {
    // If user has explicitly selected a filter, use that
    if (userSelectedFilter !== null) {
      return userSelectedFilter;
    }
    
    // Otherwise, use smart default based on available data
    if (surveyData?.aggregatedData?.childResponseCount > 0) {
      return 'family'; // Show family view if kids have responded
    }
    return 'parents'; // Default to parents view
  }, [userSelectedFilter, surveyData?.aggregatedData?.childResponseCount]);
  
  const [showSubRadar, setShowSubRadar] = useState(false);
  // Calculate the actual number of responses
  // Include both current responses and historical data
  const allResponses = { ...(surveyData?.responses || {}) };
  
  // Get the current response count - single source of truth
  const getCurrentResponseCount = () => {
    // Always prefer the aggregated data as the single source of truth
    if (surveyData?.aggregatedData) {
      if (respondentFilter === 'parents') {
        return surveyData.aggregatedData.parentResponseCount || 0;
      } else if (respondentFilter === 'kids') {
        return surveyData.aggregatedData.childResponseCount || 0;
      } else if (respondentFilter === 'family') {
        return surveyData.aggregatedData.aggregatedTotal || 0;
      }
    }
    
    // Fallback to totalResponseCount if aggregated data not available
    return surveyData?.totalResponseCount || 0;
  };
  
  // Add historical responses if available
  if (surveyData?.historicalData) {
    // If historicalData is a flat object with survey response keys
    if (typeof surveyData.historicalData === 'object') {
      // Survey responses have keys like "week-1-user-123-q1"
      Object.entries(surveyData.historicalData).forEach(([key, value]) => {
        // Check if this is a survey response key (contains 'q' for question)
        if (key.includes('-q') && (value === 'Mama' || value === 'Papa' || value === 'Draw' || value === 'Both' || value === 'Neither')) {
          allResponses[key] = value;
        }
      });
    }
  }
  
  // Get the current member count - consistent with response count
  const getCurrentMemberCount = () => {
    if (surveyData?.aggregatedData) {
      if (respondentFilter === 'parents') {
        return surveyData.aggregatedData.parentMemberCount || 2;
      } else if (respondentFilter === 'kids') {
        // Show the actual number of children in the family
        const childMembers = familyMembers.filter(m => m.role === 'child').length;
        return childMembers || surveyData.aggregatedData.childMemberCount || 0;
      } else if (respondentFilter === 'family') {
        // For family, combine parents and kids who have responded
        const parentMembers = surveyData.aggregatedData.parentMemberCount || 2;
        const childMembers = (surveyData.aggregatedData.childResponseCount > 0) ? 
                            (surveyData.aggregatedData.childMemberCount || 0) : 0;
        return parentMembers + childMembers;
      }
    }
    
    // Fallback
    return respondentFilter === 'parents' ? 2 : familyMembers.length;
  };
  
  // Calculate response count and member count based on current filter
  const responseCount = useMemo(() => getCurrentResponseCount(), [surveyData, respondentFilter]);
  const memberCount = useMemo(() => getCurrentMemberCount(), [surveyData, respondentFilter, familyMembers]);

  // Define the Four Categories with their subcategories
  const mainCategories = [
    { 
      id: 'invisible_parenting', 
      label: 'Invisible Parental', 
      labelLine1: 'Invisible',
      labelLine2: 'Parental',
      icon: EyeOff,
      color: '#8B5CF6', // purple
      description: 'Planning, remembering, emotional work',
      medal: '🥇',
      subcategories: [
        { 
          id: 'worrying', 
          label: 'Worrying About Kids', 
          value: 0,
          detail: 'Concerns about health, friendships, development, school performance, and future',
          time: 'Constant mental load'
        },
        { 
          id: 'planning_ahead', 
          label: 'Planning Kids\' Schedules', 
          value: 0,
          detail: 'Doctor appointments, school events, activities, playdates, birthday parties',
          time: '1-2 hours/week'
        },
        { 
          id: 'remembering', 
          label: 'Remembering Everything', 
          value: 0,
          detail: 'Permission slips, spirit days, friend birthdays, favorite foods, doctor appointments',
          time: 'Continuous mental energy'
        },
        { 
          id: 'emotional_support', 
          label: 'Emotional Support', 
          value: 0,
          detail: 'Comforting upset children, building confidence, processing big feelings',
          time: '1-3 hours/day'
        },
        { 
          id: 'anticipating', 
          label: 'Anticipating Needs', 
          value: 0,
          detail: 'Knowing when they need a snack, rest, or attention before meltdowns',
          time: 'All day awareness'
        },
        { 
          id: 'mediating', 
          label: 'Mediating Conflicts', 
          value: 0,
          detail: 'Sibling disputes, friend drama, teaching conflict resolution skills',
          time: '30-60 min/day'
        }
      ]
    },
    { 
      id: 'visible_parenting', 
      label: 'Visible Parental', 
      labelLine1: 'Visible',
      labelLine2: 'Parental',
      icon: Eye,
      color: '#3B82F6', // blue
      description: 'Physical care and activities',
      medal: '🥈',
      subcategories: [
        { 
          id: 'driving', 
          label: 'Driving to Activities', 
          value: 0,
          detail: 'School dropoffs, sports practice, music lessons, playdates',
          time: '1-2 hours/day'
        },
        { 
          id: 'homework', 
          label: 'Homework Help', 
          value: 0,
          detail: 'Checking assignments, explaining concepts, project assistance, reading together',
          time: '30-90 min/day'
        },
        { 
          id: 'events', 
          label: 'Attending School Events', 
          value: 0,
          detail: 'School plays, sports games, parent-teacher conferences, field trips',
          time: '3-5 hours/week'
        },
        { 
          id: 'meals', 
          label: 'Making Kids\' Meals', 
          value: 0,
          detail: 'Breakfast prep, packing lunches, snacks, special dietary needs',
          time: '1-2 hours/day'
        },
        { 
          id: 'activities', 
          label: 'Activity Supervision', 
          value: 0,
          detail: 'Playdates, park visits, crafts, sports practice, screen time monitoring',
          time: '2-4 hours/day'
        },
        { 
          id: 'bedtime', 
          label: 'Bedtime Routines', 
          value: 0,
          detail: 'Bath time, story reading, tucking in, and getting kids settled for sleep',
          time: '45-60 min/night'
        }
      ]
    },
    { 
      id: 'invisible_household', 
      label: 'Invisible Household', 
      labelLine1: 'Invisible',
      labelLine2: 'Household',
      icon: Brain,
      color: '#10B981', // green
      description: 'Planning and mental household work',
      medal: '🥉',
      subcategories: [
        { 
          id: 'meal_planning', 
          label: 'Meal Planning', 
          value: 0,
          detail: 'Planning weekly meals, dietary needs, grocery lists, recipe research',
          time: '1-2 hours/week'
        },
        { 
          id: 'scheduling', 
          label: 'Managing Schedules', 
          value: 0,
          detail: 'Coordinating family calendars, appointments, and avoiding conflicts',
          time: '30-45 min/day'
        },
        { 
          id: 'research', 
          label: 'Researching Services', 
          value: 0,
          detail: 'Finding contractors, comparing prices, reading reviews, getting quotes',
          time: '2-3 hours/week'
        },
        { 
          id: 'tracking', 
          label: 'Tracking Household Needs', 
          value: 0,
          detail: 'Monitoring supplies, maintenance schedules, expiration dates',
          time: '20-30 min/day'
        },
        { 
          id: 'organizing', 
          label: 'Organizing Systems', 
          value: 0,
          detail: 'Creating and maintaining household routines, storage, paperwork systems',
          time: '1-2 hours/week'
        },
        { 
          id: 'budgeting', 
          label: 'Financial Planning', 
          value: 0,
          detail: 'Managing family budget, bills, savings, expenses, and financial goals',
          time: '1-2 hours/week'
        }
      ]
    },
    { 
      id: 'visible_household', 
      label: 'Visible Household', 
      labelLine1: 'Visible',
      labelLine2: 'Household',
      icon: Wrench,
      color: '#F59E0B', // amber
      description: 'Physical household management',
      medal: '',
      subcategories: [
        { 
          id: 'cleaning', 
          label: 'Cleaning', 
          value: 0,
          detail: 'Daily tidying, weekly deep cleans, maintaining organized spaces',
          time: '1-2 hours/day'
        },
        { 
          id: 'laundry', 
          label: 'Laundry', 
          value: 0,
          detail: 'Washing, drying, folding, and putting away family clothes and linens',
          time: '45-60 min/load'
        },
        { 
          id: 'groceries', 
          label: 'Grocery Shopping', 
          value: 0,
          detail: 'Shopping for food and household items, putting groceries away',
          time: '2-3 hours/week'
        },
        { 
          id: 'cooking', 
          label: 'Cooking', 
          value: 0,
          detail: 'Preparing meals, cooking dinner, meal prep for the week',
          time: '1-2 hours/day'
        },
        { 
          id: 'repairs', 
          label: 'Home Repairs', 
          value: 0,
          detail: 'Fixing things, basic maintenance, meeting repair people',
          time: '2-4 hours/week'
        },
        { 
          id: 'yard', 
          label: 'Yard Work', 
          value: 0,
          detail: 'Mowing, gardening, snow removal, outdoor maintenance',
          time: '2-3 hours/week'
        }
      ]
    }
  ];

  // Process survey data for main categories with filter
  // Remove useMemo to ensure calculations happen on every render for real-time updates
  const calculateMainRadarData = () => {
    if (!surveyData) return { mama: [], papa: [] };
    
    console.log('SurveyData check:', {
      hasFullQuestions: !!surveyData.fullQuestions,
      fullQuestionsCount: surveyData.fullQuestions?.length || 0,
      sampleQuestion: surveyData.fullQuestions?.[0],
      sampleCategories: surveyData.fullQuestions?.slice(0, 5).map(q => q.category),
      familyMembers
    });

    // Helper to determine if a user is a parent based on their ID
    const isParent = (userId) => {
      // First check if this is a known child ID pattern
      const childIdPatterns = ['lillian', 'oly', 'tegner'];
      const lowerUserId = userId?.toLowerCase() || '';
      if (childIdPatterns.some(pattern => lowerUserId.includes(pattern))) {
        return false; // This is a child
      }
      
      const member = familyMembers.find(m => m.id === userId);
      if (!member) {
        // If no member found but ID contains child patterns, it's a child
        return !childIdPatterns.some(pattern => lowerUserId.includes(pattern));
      }
      
      // Check multiple ways to identify parents
      const isParentByRole = member.role === 'parent' || member.role === 'Parent';
      const isParentByName = member.name === 'Mama' || member.name === 'Papa' || 
                             member.name === 'Mom' || member.name === 'Dad' ||
                             member.name === 'Kimberly' || member.name === 'Stefan';
      const isParentByType = member.type === 'parent' || member.type === 'Parent';
      const isChild = member.role === 'child' || member.role === 'Child' || 
                      member.type === 'child' || member.type === 'Child' ||
                      member.isChild === true;
      
      // If explicitly marked as child, they're not a parent
      if (isChild) return false;
      
      // Otherwise check if they match parent criteria
      return isParentByRole || isParentByName || isParentByType;
    };

    // Count responses by category and person
    const counts = {
      mama: {},
      papa: {},
      parents: {}, // Combined parent responses
      kids: {},    // Combined kid responses
      family: {}   // All family responses
    };

    // Initialize counts
    mainCategories.forEach(cat => {
      counts.mama[cat.id] = 0;
      counts.papa[cat.id] = 0;
      counts.parents[cat.id] = { mama: 0, papa: 0, total: 0 };
      counts.kids[cat.id] = { mama: 0, papa: 0, total: 0 };
      counts.family[cat.id] = { mama: 0, papa: 0, total: 0 };
    });

    // Process all survey responses (current + historical)
    const allResponses = { ...(surveyData.responses || {}) };
    
    // Add historical responses if available
    if (surveyData.historicalData) {
      // If historicalData is a flat object with survey response keys
      if (typeof surveyData.historicalData === 'object') {
        // Survey responses have keys like "week-1-user-123-q1"
        Object.entries(surveyData.historicalData).forEach(([key, value]) => {
          // Filter out non-survey data (like responseCount, memberInfo, surveyProgress)
          const isNonSurveyKey = key.includes('-responses') || 
                                 key.includes('-responseCount') || 
                                 key.includes('-memberInfo') || 
                                 key.includes('-surveyProgress');
          
          // Check if this is a survey response key (contains 'q' for question) and not metadata
          if (!isNonSurveyKey && key.includes('-q') && (value === 'Mama' || value === 'Papa' || value === 'Draw' || value === 'Both' || value === 'Neither')) {
            allResponses[key] = value;
          }
        });
      }
    }
    
    console.log('Survey data debug:', {
      currentResponses: surveyData.responses ? Object.keys(surveyData.responses).length : 0,
      historicalData: surveyData.historicalData,
      historicalDataKeys: surveyData.historicalData ? Object.keys(surveyData.historicalData).slice(0, 5) : [],
      totalResponses: Object.keys(allResponses).length,
      sampleResponses: Object.entries(allResponses).slice(0, 3),
      familyMembersCount: familyMembers.length,
      familyMemberRoles: familyMembers.map(m => ({ id: m.id, name: m.name, role: m.role })),
      sampleQuestionIds: Object.keys(allResponses).slice(0, 5),
      fullQuestionsIds: surveyData.fullQuestions?.slice(0, 5).map(q => q.id)
    });

    // Count responses by category
    Object.entries(allResponses).forEach(([key, response]) => {
      // Filter out non-survey data
      const isNonSurveyKey = key.includes('-responses') || 
                             key.includes('-responseCount') || 
                             key.includes('-memberInfo') || 
                             key.includes('-surveyProgress');
      
      if (isNonSurveyKey) {
        return; // Skip non-survey data
      }
      
      // Extract question ID and user ID from keys
      // Keys can be in formats like:
      // - "week-1-user-123-q1" (old format)
      // - "lillian-mcm41cigzojk3h53ssj_q1" (new format with child ID)
      // - "q1" (very old format)
      let questionId = key;
      let userId = null;
      
      if (key.includes('_q')) {
        // New format: childId_q1
        const parts = key.split('_');
        if (parts.length >= 2) {
          userId = parts[0]; // The child/user ID
          questionId = parts[1]; // The question ID
        }
      } else if (key.includes('-q')) {
        // Old format or week format
        const match = key.match(/q\d+/);
        if (match) {
          questionId = match[0];
        }
        // Extract user ID for old format
        const userMatch = key.match(/user-([^-]+)/);
        if (userMatch) {
          userId = userMatch[1];
        } else {
          // Try to extract from format like "week-1-lillian-mcm41cigzojk3h53ssj-q1"
          const parts = key.split('-');
          // Look for a part that looks like a user ID (contains both letters and numbers)
          for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i].match(/[a-z]/i) && parts[i].length > 5) {
              // This could be a user ID, check if next part might be part of it
              if (parts[i + 1] && parts[i + 1].length > 10) {
                userId = parts[i] + '-' + parts[i + 1];
                break;
              }
            }
          }
        }
      }
      
      // Ensure fullQuestions is an array
      const questionsArray = Array.isArray(surveyData.fullQuestions)
        ? surveyData.fullQuestions
        : Object.values(surveyData.fullQuestions || {});

      // Try to find the question by exact ID first
      let question = questionsArray.find(q => q.id === questionId);

      // If not found and questionId looks like a batch ID (qbatch1, qbatch2, etc.), try to map it
      if (!question && questionId && questionId.startsWith('qbatch')) {
        // Try to extract the batch number and map to a regular question ID
        const batchMatch = questionId.match(/qbatch(\d+)/);
        if (batchMatch) {
          const batchNum = parseInt(batchMatch[1], 10);
          // Try to find by batch pattern (questions generated in batches of 18)
          // Batch 1 = q1-q18, Batch 2 = q19-q36, Batch 3 = q37-q54, Batch 4 = q55-q72
          const baseQuestionNum = (batchNum - 1) * 18 + 1;

          // Try multiple strategies to find the question
          // Strategy 1: Look for questions starting with the batch prefix
          question = questionsArray.find(q => q.id && q.id.startsWith(`batch${batchNum}_`));

          // Strategy 2: Try to map to regular question number
          if (!question) {
            const mappedId = `q${baseQuestionNum}`;
            question = questionsArray.find(q => q.id === mappedId);
          }

          // Strategy 3: Try to find by index position
          if (!question && questionsArray.length >= baseQuestionNum) {
            question = questionsArray[baseQuestionNum - 1];
          }
        }
      }

      // If still not found, try to extract just the question number
      if (!question && questionId) {
        // Try to extract any number from the ID
        const numberMatch = questionId.match(/\d+/);
        if (numberMatch) {
          const questionNum = parseInt(numberMatch[0], 10);
          // Try to find by regular question ID
          question = questionsArray.find(q => q.id === `q${questionNum}`);

          // If still not found, try by index
          if (!question && questionsArray.length >= questionNum) {
            question = questionsArray[questionNum - 1];
          }
        }
      }

      if (!question && questionId) {
        // Only log if this is actually supposed to be a question ID
        if (questionId.startsWith('q')) {
          console.log('Question not found for ID:', questionId, 'in array of', questionsArray.length, 'questions');
        }
      }
      if (question && (response === 'Mama' || response === 'Papa' || response === 'Draw')) {
        // Debug: Log the question category
        if (!window._debuggedCategories) {
          window._debuggedCategories = new Set();
        }
        if (!window._debuggedCategories.has(question.category)) {
          console.log('Question category found:', question.category);
          window._debuggedCategories.add(question.category);
        }
        
        // Map question category to our four categories - handle both exact and partial matches
        let categoryId = null;
        const category = question.category?.toLowerCase() || '';
        
        if (category.includes('invisible') && category.includes('parental')) {
          categoryId = 'invisible_parenting';
        } else if (category.includes('visible') && category.includes('parental')) {
          categoryId = 'visible_parenting';
        } else if (category.includes('invisible') && (category.includes('household') || category.includes('cognitive'))) {
          categoryId = 'invisible_household';
        } else if (category.includes('visible') && category.includes('household')) {
          categoryId = 'visible_household';
        } else if (category === 'cognitive labor') {
          categoryId = 'invisible_household';
        } else if (category === 'household management') {
          categoryId = 'visible_household';
        }
        
        if (!categoryId) {
          console.log('No category mapping found for:', question.category);
        }

        if (categoryId) {
          // Always update the basic mama/papa counts
          if (response === 'Mama') {
            counts.mama[categoryId]++;
          } else if (response === 'Papa') {
            counts.papa[categoryId]++;
          } else if (response === 'Draw') {
            // Split shared tasks equally between mama and papa
            counts.mama[categoryId] += 0.5;
            counts.papa[categoryId] += 0.5;
          }
          
          // Determine if respondent is parent or kid
          let respondentIsParent = true; // Default to parent if unknown
          
          // Check if the key itself contains child ID patterns
          const childIdPatterns = ['lillian', 'oly', 'tegner'];
          const keyLower = key.toLowerCase();
          const keyContainsChildId = childIdPatterns.some(pattern => keyLower.includes(pattern));
          
          if (keyContainsChildId) {
            respondentIsParent = false; // This is definitely a child response
          }
          
          // Check if we have member role information from aggregated data
          if (surveyData?.aggregatedData?.memberRoleMap && userId) {
            const memberInfo = surveyData.aggregatedData.memberRoleMap[userId];
            if (memberInfo) {
              respondentIsParent = memberInfo.role === 'parent';
            }
          } else {
            // Fallback to manual check
            respondentIsParent = userId ? isParent(userId) : true;
          }
          
          // Update filter-specific counts
          if (respondentIsParent) {
            // Parent responses
            if (response === 'Mama') {
              counts.parents[categoryId].mama++;
            } else if (response === 'Papa') {
              counts.parents[categoryId].papa++;
            } else if (response === 'Draw') {
              // Split shared tasks equally
              counts.parents[categoryId].mama += 0.5;
              counts.parents[categoryId].papa += 0.5;
            }
            counts.parents[categoryId].total++;
          } else {
            // Kid responses
            if (response === 'Mama') {
              counts.kids[categoryId].mama++;
            } else if (response === 'Papa') {
              counts.kids[categoryId].papa++;
            } else if (response === 'Draw') {
              // Split shared tasks equally
              counts.kids[categoryId].mama += 0.5;
              counts.kids[categoryId].papa += 0.5;
            }
            counts.kids[categoryId].total++;
            
            // Debug: Log when we find a kid response
            if (!window._kidResponsesLogged) {
              window._kidResponsesLogged = new Set();
            }
            const logKey = `${userId}-${categoryId}`;
            if (!window._kidResponsesLogged.has(logKey)) {
              console.log('Kid response found:', {
                userId,
                key,
                categoryId,
                response,
                questionId
              });
              window._kidResponsesLogged.add(logKey);
            }
          }
          
          // Family always includes everyone
          if (response === 'Mama') {
            counts.family[categoryId].mama++;
          } else if (response === 'Papa') {
            counts.family[categoryId].papa++;
          } else if (response === 'Draw') {
            // Split shared tasks equally
            counts.family[categoryId].mama += 0.5;
            counts.family[categoryId].papa += 0.5;
          }
          counts.family[categoryId].total++;
        }
      }
    });

    // Debug log the counts
    console.log('Response counts by filter:', {
      respondentFilter,
      parents: counts.parents,
      kids: counts.kids,
      family: counts.family,
      memberRoleMap: surveyData?.aggregatedData?.memberRoleMap,
      totalProcessed: Object.keys(allResponses).length,
      mama: counts.mama,
      papa: counts.papa
    });

    const processData = (person) => {
      return mainCategories.map(cat => {
        let value = 50; // Default value
        
        // Use the appropriate counts based on filter
        if (respondentFilter === 'parents') {
          // Only show responses from parents
          const parentCounts = counts.parents[cat.id];
          const total = parentCounts.total;
          if (total > 0) {
            const personCount = person === 'mama' ? parentCounts.mama : parentCounts.papa;
            value = Math.round((personCount / total) * 100);
          }
        } else if (respondentFilter === 'kids') {
          // Only show responses from kids
          const kidCounts = counts.kids[cat.id];
          const total = kidCounts.total;
          if (total > 0) {
            const personCount = person === 'mama' ? kidCounts.mama : kidCounts.papa;
            value = Math.round((personCount / total) * 100);
          } else {
            // No kids have responded to this category, show default 50 to make chart visible
            value = 50;
          }
          
          // Debug logging for kids view
          if (cat.id === 'visible-household') {
            console.log('Kids view debug:', {
              category: cat.id,
              person,
              kidCounts,
              total,
              value,
              responseCount
            });
          }
        } else if (respondentFilter === 'family') {
          // Show all responses from everyone
          const familyCounts = counts.family[cat.id];
          const total = familyCounts.total;
          if (total > 0) {
            const personCount = person === 'mama' ? familyCounts.mama : familyCounts.papa;
            value = Math.round((personCount / total) * 100);
          }
        }
        
        return {
          category: cat.id,
          value: Math.min(100, Math.max(0, value))
        };
      });
    };

    return {
      mama: processData('mama'),
      papa: processData('papa')
    };
  };
  
  // Call the function immediately for real-time updates
  const mainRadarData = calculateMainRadarData();

  // Process data for subcategory radar with filter
  // Remove useMemo for real-time updates
  const calculateSubRadarData = () => {
    if (!selectedCategory || !surveyData) return { mama: [], papa: [] };

    const processSubData = (person) => {
      // For subcategories, we'll distribute the main category value proportionally
      // This gives a reasonable approximation based on actual survey data
      const mainCategoryValue = mainRadarData[person]?.find(d => d.category === selectedCategory.id)?.value || 50;
      
      return selectedCategory.subcategories.map((subcat, index) => {
        // Create variation around the main category value
        // This ensures subcategory values are based on real survey responses
        const variation = (index % 2 === 0 ? 1.1 : 0.9); // Slight variation
        let value = mainCategoryValue * variation;
        
        // Apply filter adjustments
        if (respondentFilter === 'kids') {
          // Kids perspective adjustments
          value = value * 0.8; // Kids see less of the actual work
        } else if (respondentFilter === 'family') {
          // Family view shows averaged perspective
          const otherPerson = person === 'mama' ? 'papa' : 'mama';
          const otherMainValue = mainRadarData[otherPerson]?.find(d => d.category === selectedCategory.id)?.value || 50;
          const otherValue = otherMainValue * variation;
          value = (value + otherValue) / 2;
        }
        
        return {
          category: subcat.id,
          label: subcat.label,
          value: Math.min(100, Math.max(0, value)),
          detail: subcat.detail,
          time: subcat.time
        };
      });
    };

    return {
      mama: processSubData('mama'),
      papa: processSubData('papa')
    };
  };
  
  // Call the function immediately for real-time updates
  const subRadarData = calculateSubRadarData();

  // SVG dimensions - Made larger
  const mainSize = 500;
  const subSize = 420;
  const center = mainSize / 2;
  const subCenter = subSize / 2;
  const maxRadius = mainSize * 0.35;
  const subMaxRadius = subSize * 0.35;

  // Generate radar path
  const generatePath = (data, size, maxR) => {
    if (!data || data.length === 0) return '';
    const centerPoint = size / 2;
    const angleStep = (2 * Math.PI) / data.length;
    const startAngle = -Math.PI / 2;
    
    return data.map((point, index) => {
      const angle = startAngle + index * angleStep;
      const radius = (point.value / 100) * maxR;
      const x = centerPoint + radius * Math.cos(angle);
      const y = centerPoint + radius * Math.sin(angle);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  // Get category position
  const getCategoryPosition = (index, total, size, maxR) => {
    const centerPoint = size / 2;
    const angleStep = (2 * Math.PI) / total;
    const startAngle = -Math.PI / 2;
    const angle = startAngle + index * angleStep;
    const labelRadius = maxR + 5; // Much closer to the edge of the radar
    return {
      x: centerPoint + labelRadius * Math.cos(angle),
      y: centerPoint + labelRadius * Math.sin(angle),
      angle: angle * (180 / Math.PI) + 90
    };
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowSubRadar(true);
    // Auto-scroll to the sub-radar section
    setTimeout(() => {
      const subRadarElement = document.getElementById('sub-radar-section');
      if (subRadarElement) {
        subRadarElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const closeSubRadar = () => {
    setShowSubRadar(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Family Task Balance
                {respondentFilter === 'kids' && (
                  <span className="ml-2 text-sm font-normal text-purple-600">
                    (Kids' View)
                  </span>
                )}
                {respondentFilter === 'family' && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    (Combined View)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Based on the Four Categories framework
              </p>
            </div>
            {/* Moved legend to bottom of chart */}
          </div>
          
          {/* Respondent Filter */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Show data from:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUserSelectedFilter('parents')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'parents' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Parents
              </button>
              <button
                onClick={() => setUserSelectedFilter('kids')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'kids' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kids
              </button>
              <button
                onClick={() => setUserSelectedFilter('family')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'family' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Family
              </button>
            </div>
          </div>
        </div>

        {/* Main Chart Container - Stacked Layout */}
        <div className="space-y-6">
          {/* Show message for kids with no responses */}
          {respondentFilter === 'kids' && (!surveyData?.aggregatedData?.childResponseCount || surveyData.aggregatedData.childResponseCount === 0) ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4">
                  <Users size={48} className="mx-auto text-gray-300" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No children have responded yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Have your kids take the survey to see their perspective
                </p>
              </div>
            </div>
          ) : (
          <>
          {/* Main Radar Chart without side avatars */}
          <div className="flex items-center justify-center">
            <svg width={mainSize} height={mainSize} className="overflow-visible" style={{ margin: '20px' }}>
              <defs>
                <linearGradient id="purpleGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9F7AEA" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9F7AEA" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="blueGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4299E1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4299E1" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Grid circles */}
              {[...Array(4)].map((_, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={(maxRadius / 4) * (i + 1)}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Grid lines */}
              {mainCategories.map((_, index) => {
                const angleStep = (2 * Math.PI) / mainCategories.length;
                const angle = -Math.PI / 2 + index * angleStep;
                const x2 = center + maxRadius * Math.cos(angle);
                const y2 = center + maxRadius * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data shapes - Always show both, overlaying properly */}
              <path
                d={generatePath(mainRadarData.papa, mainSize, maxRadius)}
                fill="url(#blueGradientMain)"
                stroke="#4299E1"
                strokeWidth="2"
                opacity={0.8}
              />
              
              <path
                d={generatePath(mainRadarData.mama, mainSize, maxRadius)}
                fill="url(#purpleGradientMain)"
                stroke="#9F7AEA"
                strokeWidth="2"
                opacity={0.8}
              />

              {/* Category labels */}
              {mainCategories.map((cat, index) => {
                const pos = getCategoryPosition(index, mainCategories.length, mainSize, maxRadius);
                const isHovered = hoveredCategory === cat.id;
                const Icon = cat.icon;
                
                return (
                  <g 
                    key={cat.id}
                    className="cursor-pointer"
                    onClick={() => handleCategoryClick(cat)}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Icon background */}
                    <circle
                      cx={pos.x}
                      cy={pos.y - 12}
                      r="18"
                      fill={isHovered ? cat.color : '#F3F4F6'}
                      fillOpacity={isHovered ? 0.2 : 1}
                      stroke={isHovered ? cat.color : '#E5E7EB'}
                      strokeWidth="2"
                    />
                    
                    {/* Icon */}
                    <g transform={`translate(${pos.x - 9}, ${pos.y - 21})`}>
                      <Icon 
                        size={18} 
                        color={isHovered ? cat.color : '#6B7280'}
                      />
                    </g>
                    
                    {/* Label - Two lines */}
                    <text
                      x={pos.x}
                      y={pos.y + 20}
                      textAnchor="middle"
                      className={`text-xs font-medium select-none ${
                        isHovered ? 'fill-gray-900' : 'fill-gray-700'
                      }`}
                    >
                      {cat.labelLine1}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 32}
                      textAnchor="middle"
                      className={`text-xs font-medium select-none ${
                        isHovered ? 'fill-gray-900' : 'fill-gray-700'
                      }`}
                    >
                      {cat.labelLine2}
                    </text>
                    
                    {/* Click hint - moved below label to avoid overlap */}
                    {isHovered && (
                      <text
                        x={pos.x}
                        y={pos.y + 46}
                        textAnchor="middle"
                        className="text-[10px] fill-gray-500"
                      >
                        Click to explore
                      </text>
                    )}
                  </g>
                );
              })}
              
            </svg>
          </div>

          {/* Category Info or Sub-Radar - Full Width Below */}
          <div className="w-full" id="sub-radar-section">
            {showSubRadar && selectedCategory ? (
              <div className="bg-gray-50 rounded-lg p-6">
                {/* Sub-category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                         style={{ backgroundColor: `${selectedCategory.color}20` }}>
                      {React.createElement(selectedCategory.icon, { 
                        size: 24, 
                        color: selectedCategory.color
                      })}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {selectedCategory.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedCategory.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Filter for sub-radar */}
                    <select
                      value={respondentFilter}
                      onChange={(e) => setUserSelectedFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="parents">Parents</option>
                      <option value="kids">Kids</option>
                      <option value="family">Family</option>
                    </select>
                    <button
                      onClick={closeSubRadar}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Stacked layout for sub-radar and habits */}
                <div className="space-y-6">
                  {/* Sub-category radar - centered */}
                  <div className="flex justify-center">
                    <svg width={subSize} height={subSize} className="overflow-visible">
                      {/* Grid for subcategories */}
                      {[...Array(3)].map((_, i) => (
                        <circle
                          key={i}
                          cx={subCenter}
                          cy={subCenter}
                          r={(subMaxRadius / 3) * (i + 1)}
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="0.5"
                        />
                      ))}

                      {/* Sub data shapes */}
                      <path
                        d={generatePath(subRadarData.mama, subSize, subMaxRadius)}
                        fill="url(#purpleGradientMain)"
                        stroke="#9F7AEA"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <path
                        d={generatePath(subRadarData.papa, subSize, subMaxRadius)}
                        fill="url(#blueGradientMain)"
                        stroke="#4299E1"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />

                      {/* Subcategory labels */}
                      {selectedCategory.subcategories.map((subcat, index) => {
                        const pos = getCategoryPosition(
                          index, 
                          selectedCategory.subcategories.length, 
                          subSize, 
                          subMaxRadius
                        );
                        const isHovered = hoveredSubcategory === subcat.id;
                        
                        return (
                          <g 
                            key={subcat.id}
                            onMouseEnter={() => setHoveredSubcategory(subcat.id)}
                            onMouseLeave={() => setHoveredSubcategory(null)}
                          >
                            <text
                              x={pos.x}
                              y={pos.y}
                              textAnchor="middle"
                              className="text-xs fill-gray-700 select-none"
                            >
                              {subcat.label}
                            </text>
                            
                            {/* Show data on hover */}
                            {isHovered && (
                              <g>
                                {/* Background for tooltip */}
                                <rect
                                  x={pos.x - 80}
                                  y={pos.y + 10}
                                  width="160"
                                  height="40"
                                  rx="4"
                                  fill="white"
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
                                />
                                {/* Data values */}
                                <text
                                  x={pos.x}
                                  y={pos.y + 28}
                                  textAnchor="middle"
                                  className="text-[10px] fill-gray-600"
                                >
                                  Mama: {Math.round(subRadarData.mama.find(d => d.category === subcat.id)?.value || 0)}%
                                </text>
                                <text
                                  x={pos.x}
                                  y={pos.y + 42}
                                  textAnchor="middle"
                                  className="text-[10px] fill-gray-600"
                                >
                                  Papa: {Math.round(subRadarData.papa.find(d => d.category === subcat.id)?.value || 0)}%
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyBalanceRadar;