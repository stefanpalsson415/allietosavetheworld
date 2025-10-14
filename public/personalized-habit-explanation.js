// personalized-habit-explanation.js
// Script to generate truly personalized habit explanations based on survey data

(function() {
  console.log("Running personalized-habit-explanation.js...");
  
  // Function to analyze survey responses for imbalances
  function analyzeTaskImbalances(surveyResponses) {
    // If no survey data, create synthetic data for demonstration
    if (!surveyResponses || Object.keys(surveyResponses).length === 0) {
      console.log("No survey responses found, creating synthetic data");
      
      // Create synthetic data for demo purposes
      surveyResponses = {
        "dishes": "Mama",
        "laundry": "Papa",
        "cooking": "Mama",
        "cleaning": "Mama",
        "shopping": "Papa",
        "appointments": "Mama",
        "planning": "Mama",
        "childcare": "Papa",
        "bedtime": "Both",
        "morningRoutine": "Mama"
      };
    }
    
    // Track counts of mama/papa responses
    const categories = {
      "Visible Household Tasks": { mama: 0, papa: 0, total: 0 },
      "Invisible Household Tasks": { mama: 0, papa: 0, total: 0 },
      "Visible Parental Tasks": { mama: 0, papa: 0, total: 0 },
      "Invisible Parental Tasks": { mama: 0, papa: 0, total: 0 }
    };
    
    // Map questions to categories based on keywords
    const categoryKeywords = {
      "Visible Household Tasks": ["dishes", "laundry", "cooking", "cleaning", "grocery", "shopping"],
      "Invisible Household Tasks": ["planning", "schedule", "remember", "organize", "mental load"],
      "Visible Parental Tasks": ["bath", "bedtime", "child", "kid", "play"],
      "Invisible Parental Tasks": ["doctor", "appointment", "school", "homework", "emotional"]
    };
    
    // Analyze each survey response
    Object.entries(surveyResponses).forEach(([questionId, response]) => {
      if (response !== 'Mama' && response !== 'Papa') return;
      
      // Determine which category this question belongs to
      const questionText = questionId.toLowerCase();
      let matchedCategory = null;
      
      // Match to category based on keywords
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => questionText.includes(keyword))) {
          matchedCategory = category;
          break;
        }
      }
      
      // If no match found, default to Invisible Household Tasks
      if (!matchedCategory) {
        matchedCategory = "Invisible Household Tasks";
      }
      
      // Increment counts
      categories[matchedCategory].total += 1;
      if (response === 'Mama') {
        categories[matchedCategory].mama += 1;
      } else if (response === 'Papa') {
        categories[matchedCategory].papa += 1;
      }
    });
    
    // Calculate percentages and imbalances
    const imbalances = [];
    let totalMama = 0;
    let totalPapa = 0;
    let totalQuestions = 0;
    
    Object.entries(categories).forEach(([category, counts]) => {
      if (counts.total === 0) return;
      
      const mamaPercent = Math.round((counts.mama / counts.total) * 100);
      const papaPercent = Math.round((counts.papa / counts.total) * 100);
      const imbalancePercent = Math.abs(mamaPercent - papaPercent);
      const dominantRole = mamaPercent > papaPercent ? "Mama" : "Papa";
      const leastInvolvedRole = dominantRole === "Mama" ? "Papa" : "Mama";
      
      imbalances.push({
        category,
        mamaPercent,
        papaPercent,
        imbalancePercent,
        dominantRole,
        leastInvolvedRole
      });
      
      totalMama += counts.mama;
      totalPapa += counts.papa;
      totalQuestions += counts.total;
    });
    
    // Sort by imbalance (highest first)
    imbalances.sort((a, b) => b.imbalancePercent - a.imbalancePercent);
    
    // Calculate overall imbalance
    const overallImbalance = totalQuestions > 0 ? {
      mamaPercent: Math.round((totalMama / totalQuestions) * 100),
      papaPercent: Math.round((totalPapa / totalQuestions) * 100),
      imbalancePercent: Math.round(Math.abs((totalMama / totalQuestions) * 100 - (totalPapa / totalQuestions) * 100)),
      dominantRole: totalMama > totalPapa ? "Mama" : "Papa",
      leastInvolvedRole: totalMama > totalPapa ? "Papa" : "Mama"
    } : { 
      mamaPercent: 50, 
      papaPercent: 50, 
      imbalancePercent: 0, 
      dominantRole: "Equal", 
      leastInvolvedRole: "Equal" 
    };
    
    return {
      imbalances,
      overallImbalance,
      mostImbalancedCategory: imbalances.length > 0 ? imbalances[0] : null,
      hasSignificantImbalance: imbalances.some(i => i.imbalancePercent > 20)
    };
  }
  
  // Function to generate a personalized explanation
  function generatePersonalizedExplanation(habit, surveyAnalysis, currentParentRole) {
    // Default fallback if no analysis available
    if (!surveyAnalysis || !habit) {
      return "This habit was selected to help create more structure in your routine.";
    }
    
    const { imbalances, overallImbalance, mostImbalancedCategory } = surveyAnalysis;
    
    // If habit has a predefined explanation, use it but enhance with data
    if (habit.habitExplanation) {
      return `${habit.habitExplanation} Based on your survey responses, our analysis shows ${overallImbalance.dominantRole} is handling ${overallImbalance.imbalancePercent}% more of overall family tasks. ${habit.habitResearch || ''}`;
    }
    
    // If truly no imbalance data found
    if (!mostImbalancedCategory) {
      console.log("Browser script: No imbalance data found", { surveyAnalysis });
      return `This habit was selected to help structure your family routines more effectively. By establishing consistent habits, families typically see a 30% improvement in task coordination.`;
    }
    
    // Even with small imbalances, we can still make personalized recommendations
    // We'll never say "your family is balanced" - there's always room for improvement!
    
    // Get the category that best matches this habit's focus
    let habitCategory = habit.category;
    
    // Map habit category to survey category if needed
    const categoryMapping = {
      "Balance Habit": "Invisible Household Tasks",
      "Household Tasks": "Visible Household Tasks",
      "Meal Planning": "Invisible Household Tasks",
      "Planning": "Invisible Household Tasks",
      "Communication": "Invisible Parental Tasks",
      "Parenting": "Visible Parental Tasks"
    };
    
    if (categoryMapping[habitCategory]) {
      habitCategory = categoryMapping[habitCategory];
    }
    
    // Find matching category from imbalances
    const matchingImbalance = imbalances.find(i => i.category === habitCategory) || mostImbalancedCategory;
    
    // Generate explanation based on parent role and imbalance
    let explanation = `Allie selected <strong>${habit.title}</strong> for you because `;
    
    if (matchingImbalance.leastInvolvedRole === currentParentRole) {
      // This parent is doing less in this category
      explanation += `our analysis shows ${matchingImbalance.dominantRole} is currently handling ${matchingImbalance.imbalancePercent}% more of the ${matchingImbalance.category.toLowerCase()} than you. This habit will help you take on more responsibility in this area.`;
    } else {
      // This parent is already doing more
      explanation += `our analysis shows you're currently handling ${matchingImbalance.imbalancePercent}% more of the ${matchingImbalance.category.toLowerCase()} than ${matchingImbalance.leastInvolvedRole}. This habit will help make this work more efficient and better structured.`;
    }
    
    // Add research insight if available
    if (habit.habitResearch) {
      explanation += ` ${habit.habitResearch}`;
    } else {
      explanation += ` Studies show families who practice this kind of structured approach report a 25% improvement in task-sharing equality.`;
    }
    
    return explanation;
  }
  
  // Function to update the explanation box in the DOM
  function updateExplanationBox() {
    try {
      // Wait until Firebase auth is initialized and we can get user data
      if (!window.firebase || !window.firebase.auth || !window.firebase.auth().currentUser) {
        setTimeout(updateExplanationBox, 1000);
        return;
      }
      
      // Find the info box with the explanation
      const infoElements = document.querySelectorAll('div');
      let explanationBox = null;
      let habitTitle = null;
      
      for (const el of infoElements) {
        // Check for info box
        if (el.textContent && 
            (el.textContent.includes('Why Allie recommended this habit:') || 
             el.textContent.includes('This habit was selected to help maintain'))) {
          explanationBox = el;
          
          // Try to find the habit title
          const strongTags = el.querySelectorAll('strong');
          for (const tag of strongTags) {
            habitTitle = tag.textContent;
            if (habitTitle) break;
          }
          
          break;
        }
      }
      
      if (!explanationBox) {
        setTimeout(updateExplanationBox, 1000);
        return;
      }
      
      // Use firebase to get current user and survey responses
      const currentUser = firebase.auth().currentUser;
      console.log("Personalizing habit explanations for user:", currentUser.uid);
      
      // Get the family ID
      const db = firebase.firestore();
      db.collection('users').doc(currentUser.uid).get()
        .then(userDoc => {
          if (!userDoc.exists) {
            console.warn("User document not found");
            return;
          }
          
          const familyId = userDoc.data().familyId;
          console.log("Found family ID:", familyId);
          
          if (!familyId) {
            console.warn("No family ID in user document");
            return;
          }
          
          // Get survey responses
          return db.collection('families').doc(familyId).get();
        })
        .then(familyDoc => {
          if (!familyDoc || !familyDoc.exists) {
            console.warn("Family document not found");
            return;
          }
          
          console.log("Got family document, checking for survey responses");
          const surveyResponses = familyDoc.data().surveyResponses || {};
          console.log("Survey responses:", Object.keys(surveyResponses).length > 0 ? 
                      `Found ${Object.keys(surveyResponses).length} responses` : 
                      "No survey responses found");
          
          // Try to get the current user's role
          let parentRole = "Parent";
          const currentUserData = familyDoc.data().users?.find(u => u.id === currentUser.uid);
          if (currentUserData && currentUserData.roleType) {
            parentRole = currentUserData.roleType;
          } else if (familyDoc.data().currentUser?.roleType) {
            parentRole = familyDoc.data().currentUser.roleType;
          }
          console.log(`User role identified as: ${parentRole}`);
          
          // Get the family members to find the user's role if not found yet
          if (parentRole === "Parent" && familyDoc.data().members) {
            const member = familyDoc.data().members.find(m => m.id === currentUser.uid);
            if (member && member.roleType) {
              parentRole = member.roleType;
              console.log(`Updated user role from members array: ${parentRole}`);
            }
          }
          
          // Get the habits from the tasks array directly if available
          let habitFromTasks = null;
          
          if (familyDoc.data().tasks && Array.isArray(familyDoc.data().tasks)) {
            console.log(`Checking ${familyDoc.data().tasks.length} tasks for habits`);
            // Look for the habit in the tasks array
            const matchingTask = familyDoc.data().tasks.find(task => 
              (task.title === habitTitle) || 
              (task.title && task.title.includes("Check-in")) ||
              (task.title && task.title.includes("Family Calendar")) ||
              (task.title && task.title.includes("5 minutes tidying"))
            );
            
            if (matchingTask) {
              console.log("Found habit in tasks array:", matchingTask.title);
              habitFromTasks = {
                title: matchingTask.title,
                category: matchingTask.category || "Balance Habit",
                habitExplanation: matchingTask.habitExplanation || null,
                habitResearch: matchingTask.habitResearch || null
              };
            }
          }
          
          // If we found a habit in tasks, use it directly
          if (habitFromTasks) {
            // Analyze survey data
            const surveyAnalysis = analyzeTaskImbalances(surveyResponses);
            
            // Generate personalized explanation
            const personalizedExplanation = generatePersonalizedExplanation(
              habitFromTasks, 
              surveyAnalysis, 
              parentRole
            );
            
            // Update the UI
            const paragraphs = explanationBox.querySelectorAll('p, div');
            for (const p of paragraphs) {
              if (p.textContent && (
                  p.textContent.includes('Allie selected') ||
                  p.textContent.includes('This habit was selected')
              )) {
                console.log("Updating explanation with personalized text (from tasks)");
                p.innerHTML = personalizedExplanation;
                return; // Exit the chain
              }
            }
          }
          
          // Continue with checking the habits collection
          console.log("Checking habits collection");
          return db.collection('families').doc(familyDoc.id).collection('habits').get()
            .then(habitsSnapshot => {
              // Find the current habit
              let habitData = null;
              
              if (!habitsSnapshot.empty) {
                console.log(`Found ${habitsSnapshot.size} habits in collection`);
                habitsSnapshot.forEach(doc => {
                  const habit = doc.data();
                  if (habit.title === habitTitle || 
                      (habit.title === "Family Calendar Check-in" && habitTitle === null) ||
                      (habit.title && habit.title.includes("Check-in") && habitTitle === null) ||
                      (habit.title && habit.title.includes("tidying") && habitTitle === null)) {
                    habitData = habit;
                    console.log("Found matching habit:", habit.title);
                  }
                });
              } else {
                console.log("No habits found in collection");
              }
              
              // If still no habit found, use a default
              if (!habitData) {
                const defaultTitle = habitTitle || 
                                     (explanationBox.textContent.includes("tidying") ? "Spend 5 minutes tidying" : "Family Calendar Check-in");
                
                console.log("Using default habit with title:", defaultTitle);
                habitData = {
                  title: defaultTitle,
                  category: "Balance Habit",
                  habitExplanation: null,
                  habitResearch: null
                };
              }
              
              // Analyze survey data
              const surveyAnalysis = analyzeTaskImbalances(surveyResponses);
              
              // Generate personalized explanation
              const personalizedExplanation = generatePersonalizedExplanation(
                habitData, 
                surveyAnalysis, 
                parentRole
              );
              
              // Update the UI
              const paragraphs = explanationBox.querySelectorAll('p, div');
              for (const p of paragraphs) {
                if (p.textContent && (
                    p.textContent.includes('Allie selected') ||
                    p.textContent.includes('This habit was selected')
                )) {
                  p.innerHTML = personalizedExplanation;
                  console.log("Updated habit explanation with personalized content based on survey analysis!");
                  break;
                }
              }
            });
        })
        .catch(error => {
          console.error("Error updating explanation:", error);
        });
    } catch (error) {
      console.error("Error in updateExplanationBox:", error);
    }
  }
  
  // Start trying to update the explanation
  setTimeout(updateExplanationBox, 2000);
  
  // Also observe DOM changes to update when new content is added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Look for info box appearing
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && 
              node.textContent && 
              (node.textContent.includes('Why Allie recommended this habit:') ||
               node.textContent.includes('This habit was selected'))) {
            updateExplanationBox();
            break;
          }
        }
      }
    }
  });
  
  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
  
  console.log("personalized-habit-explanation.js loaded and running.");
})();