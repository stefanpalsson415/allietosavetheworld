import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, Plus, Heart, ThumbsUp, ThumbsDown, Meh, AlertCircle } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import ClaudeService from '../../services/ClaudeService';
import ChildInterestService from '../../services/ChildInterestService';

const AIKidInterestSurvey = ({ childId, onComplete, onCancel }) => {
  const { familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState(null);
  const [responses, setResponses] = useState({});
  const [customItem, setCustomItem] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [accessError, setAccessError] = useState(null);

  const child = familyMembers?.find(m => m.id === childId);
  const currentUserProfile = familyMembers?.find(m => m.userId === currentUser?.uid);

  // Check access permissions
  useEffect(() => {
    if (!child || !currentUserProfile) return;

    // Check if current user is a parent or the child themselves
    const isParent = currentUserProfile.role === 'parent';
    const isChildUser = currentUserProfile.id === childId;

    if (isParent) {
      setAccessError('This survey is for kids only! Please have your child take this survey.');
    } else if (!isChildUser) {
      setAccessError(`This survey is for ${child.name}. Please log in as ${child.name} to take their survey.`);
    }
  }, [child, currentUserProfile, childId]);

  // Generate personalized survey based on child data
  useEffect(() => {
    const generateSurvey = async () => {
      if (!child || accessError) return;

      setLoading(true);
      try {
        // Get existing interests if any
        let existingInterests = { loves: [], likes: [], passes: [] };
        try {
          const interests = await ChildInterestService.getChildInterests(familyId, childId);
          // Ensure the structure is correct
          if (interests) {
            existingInterests = {
              loves: Array.isArray(interests.loves) ? interests.loves : [],
              likes: Array.isArray(interests.likes) ? interests.likes : [],
              passes: Array.isArray(interests.passes) ? interests.passes : []
            };
          }
        } catch (error) {
          console.log('No existing interests found, using empty arrays');
        }

        // Calculate child's age
        const age = child.birthdate ?
          Math.floor((new Date() - new Date(child.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) :
          7; // Default age if not specified

        // Build context for AI
        const context = {
          childName: child.name,
          age: age,
          location: child.location || 'United States',
          existingInterests: existingInterests,
          siblings: familyMembers.filter(m => m.role === 'child' && m.id !== childId).map(s => ({
            name: s.name,
            age: s.birthdate ? Math.floor((new Date() - new Date(s.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null
          }))
        };

        const prompt = `Create a personalized interest survey for ${context.childName}, age ${context.age} from ${context.location}.

Existing interests they love: ${existingInterests.loves?.length > 0 ? existingInterests.loves.map(i => i.name || i).join(', ') : 'none yet'}
Siblings: ${context.siblings.map(s => `${s.name}${s.age ? ` (age ${s.age})` : ''}`).join(', ') || 'none'}

Create a kid interest survey for ${context.name}, age ${context.age}.

Generate exactly 5 categories with 4 items each. Keep descriptions SHORT (max 5 words).

IMPORTANT: Include pirates, dinosaurs, robots in the Themes category.

Categories:
1. Toys & Games
2. Themes (include: pirates, dinosaurs, robots, superheroes)
3. Entertainment
4. Activities
5. Technology

Return ONLY valid JSON, no markdown:
{
  "categories": [
    {
      "name": "Category Name",
      "emoji": "emoji",
      "items": [
        {"id": "unique-id", "name": "Item Name", "description": "Brief fun description"}
      ]
    }
  ]
}`;

        // Add timeout for API call - increased to 45 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Survey generation timed out')), 45000)
        );

        const response = await Promise.race([
          ClaudeService.sendMessage(prompt, null, familyId),
          timeoutPromise
        ]);

        // Handle different response formats
        let surveyData;
        let responseText = '';

        // Extract text from various response formats
        if (typeof response === 'string') {
          responseText = response;
        } else if (response && response.text) {
          responseText = response.text;
        } else if (response && response.content) {
          responseText = response.content;
        } else {
          throw new Error('Unexpected response format from Claude');
        }

        // Clean the response text
        responseText = responseText.trim();

        // Remove markdown code blocks if present
        if (responseText.startsWith('```json')) {
          responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        // Try to parse the JSON
        try {
          surveyData = JSON.parse(responseText);
        } catch (e) {
          console.error('Initial JSON parse failed:', e);

          // Try to extract JSON using regex (find first complete JSON object)
          const jsonMatch = responseText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          if (jsonMatch) {
            try {
              // Try to fix common JSON issues
              let fixedJson = jsonMatch[0]
                .replace(/,\s*\]/, ']')  // Remove trailing commas in arrays
                .replace(/,\s*\}/, '}')  // Remove trailing commas in objects
                .replace(/([\w]+):/g, '"$1":')  // Add quotes to unquoted keys
                .replace(/'([^']*)'/g, '"$1"');  // Replace single quotes with double

              surveyData = JSON.parse(fixedJson);
            } catch (e2) {
              console.error('Fixed JSON parse failed:', e2);
              throw new Error('Could not parse survey data from response');
            }
          } else {
            throw new Error('No valid JSON found in response');
          }
        }

        // Validate the survey data structure
        if (!surveyData || !surveyData.categories || !Array.isArray(surveyData.categories)) {
          console.warn('Invalid survey structure, using fallback');
          throw new Error('Invalid survey data structure');
        }

        // Ensure we have at least 3 categories with items
        if (surveyData.categories.length < 3) {
          console.warn('Too few categories, using fallback');
          throw new Error('Insufficient categories in survey');
        }

        setSurveyData(surveyData);
      } catch (error) {
        console.error('Error generating survey:', error);
        console.log('Using comprehensive fallback survey');

        // Always use fallback survey data when generation fails
        setSurveyData({
          categories: [
            {
              name: "Toys & Games",
              emoji: "🎮",
              items: [
                { id: "lego", name: "LEGO Sets", description: "Build creations!" },
                { id: "pokemon", name: "Pokemon", description: "Cards & games" },
                { id: "boardgames", name: "Board Games", description: "Family fun" },
                { id: "action-figures", name: "Action Figures", description: "Hero play" },
                { id: "dolls", name: "Dolls", description: "Nurture play" }
              ]
            },
            {
              name: "Themes & Interests",
              emoji: "🦖",
              items: [
                { id: "pirates", name: "Pirates", description: "Treasure & adventure!" },
                { id: "dinosaurs", name: "Dinosaurs", description: "Prehistoric creatures" },
                { id: "robots", name: "Robots", description: "Tech & AI" },
                { id: "princesses", name: "Princesses", description: "Royal adventures" },
                { id: "superheroes", name: "Superheroes", description: "Save the world!" },
                { id: "space", name: "Space", description: "Explore universe" },
                { id: "animals", name: "Animals", description: "Wildlife & pets" }
              ]
            },
            {
              name: "Entertainment",
              emoji: "📺",
              items: [
                { id: "disney", name: "Disney", description: "Movies & shows" },
                { id: "youtube", name: "YouTube", description: "Videos & channels" },
                { id: "netflix", name: "Netflix", description: "TV series" },
                { id: "music", name: "Music", description: "Songs & bands" }
              ]
            },
            {
              name: "Activities",
              emoji: "⚽",
              items: [
                { id: "sports", name: "Sports", description: "Active play" },
                { id: "arts", name: "Art & Crafts", description: "Create things" },
                { id: "science", name: "Science", description: "Experiments" },
                { id: "outdoor", name: "Outdoor", description: "Nature fun" },
                { id: "cooking", name: "Cooking", description: "Make food" }
              ]
            },
            {
              name: "Books & Characters",
              emoji: "📚",
              items: [
                { id: "harry-potter", name: "Harry Potter", description: "Magic books" },
                { id: "comics", name: "Comics", description: "Hero stories" },
                { id: "picture-books", name: "Picture Books", description: "Story time" },
                { id: "chapter-books", name: "Chapter Books", description: "Long stories" }
              ]
            },
            {
              name: "Technology",
              emoji: "💻",
              items: [
                { id: "minecraft", name: "Minecraft", description: "Build worlds" },
                { id: "roblox", name: "Roblox", description: "Create games" },
                { id: "tablets", name: "Apps", description: "Fun learning" },
                { id: "coding", name: "Coding", description: "Programming" }
              ]
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    generateSurvey();
  }, [child, familyId, childId, familyMembers, accessError]);

  const handleResponse = (itemId, rating) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: rating
    }));
  };

  const handleAddCustom = () => {
    if (!customItem.trim()) return;
    
    const customId = `custom-${Date.now()}`;
    const currentCategory = surveyData.categories[currentStep];
    
    // Add to current category
    setSurveyData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, idx) => 
        idx === currentStep 
          ? {
              ...cat,
              items: [...cat.items, {
                id: customId,
                name: customItem,
                description: "Added by you!",
                isCustom: true
              }]
            }
          : cat
      )
    }));
    
    // Auto-love custom items
    setResponses(prev => ({
      ...prev,
      [customId]: 'love'
    }));
    
    setCustomItem('');
    setShowCustomInput(false);
  };

  const handleNext = () => {
    if (currentStep < surveyData.categories.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    
    try {
      // Process responses into loves, likes, and passes
      const processedData = {
        loves: [],
        likes: [],
        passes: []
      };

      surveyData.categories.forEach(category => {
        category.items.forEach(item => {
          const rating = responses[item.id];
          if (rating) {
            const interestData = {
              id: item.id,
              name: item.name,
              category: category.name.toLowerCase().replace(/\s+/g, '-'),
              isCustom: item.isCustom || false
            };

            if (rating === 'love') {
              processedData.loves.push(interestData);
            } else if (rating === 'like') {
              processedData.likes.push(interestData);
            } else if (rating === 'pass') {
              processedData.passes.push(interestData);
            }
          }
        });
      });

      // Save to database - add each interest individually
      for (const interest of processedData.loves) {
        await ChildInterestService.addInterest(familyId, childId, {
          ...interest,
          rating: 'love',
          elo: 1400, // Higher starting ELO for loved items
          comparisons: 0,
          uncertainty: 0.5
        });
      }

      for (const interest of processedData.likes) {
        await ChildInterestService.addInterest(familyId, childId, {
          ...interest,
          rating: 'like',
          elo: 1200, // Normal starting ELO for liked items
          comparisons: 0,
          uncertainty: 0.5
        });
      }

      for (const interest of processedData.passes) {
        await ChildInterestService.addInterest(familyId, childId, {
          ...interest,
          rating: 'pass',
          elo: 1000, // Lower starting ELO for passed items
          comparisons: 0,
          uncertainty: 0.5
        });
      }
      
      // Mark survey as completed
      await ChildInterestService.recordSurveyCompleted(familyId, childId);

      // Show success message before completing
      setSaving(false);

      // Create success notification
      const successMessage = document.createElement('div');
      successMessage.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center z-50" style="animation: slideIn 0.3s ease-out">
          <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-semibold">Survey Completed!</p>
            <p class="text-sm opacity-90">${processedData.loves.length} loves, ${processedData.likes.length} likes saved</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);

      // Add animation styles if not present
      if (!document.getElementById('survey-animations')) {
        const style = document.createElement('style');
        style.id = 'survey-animations';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      // Remove success message and complete after delay
      setTimeout(() => {
        // Safely animate the success message
        try {
          const messageDiv = successMessage.querySelector('div');
          if (messageDiv) {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
          }
        } catch (animError) {
          console.warn('Could not animate success message:', animError);
        }

        setTimeout(() => {
          try {
            if (successMessage && document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          } catch (removeError) {
            console.warn('Could not remove success message:', removeError);
          }

          // Always complete, even if animation fails
          onComplete(processedData);

          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('survey-completed', {
            detail: { childId, processedData }
          }));
        }, 300);
      }, 2000);

      return; // Exit early to prevent double completion
    } catch (error) {
      console.error('Error saving survey:', error);
      setSaving(false);

      // Show error notification
      const errorMessage = document.createElement('div');
      errorMessage.innerHTML = `
        <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center z-50" style="animation: slideIn 0.3s ease-out">
          <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p class="font-semibold">Couldn't Save Survey</p>
            <p class="text-sm opacity-90">Please try again</p>
          </div>
        </div>
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        try {
          const messageDiv = errorMessage.querySelector('div');
          if (messageDiv) {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
          }
        } catch (animError) {
          console.warn('Could not animate error message:', animError);
        }

        setTimeout(() => {
          try {
            if (errorMessage && document.body.contains(errorMessage)) {
              document.body.removeChild(errorMessage);
            }
          } catch (removeError) {
            console.warn('Could not remove error message:', removeError);
          }
        }, 300);
      }, 3000);

      return; // Don't close the survey on error
    }
  };

  // Show access error if user is not authorized
  if (accessError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">{accessError}</p>
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="relative mb-6">
            <Sparkles className="mx-auto h-16 w-16 text-purple-600 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-3">Creating Your Personalized Survey</h3>
          <p className="text-gray-600 mb-2">Getting ready to discover what {child?.name} loves...</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">This may take up to 30 seconds</p>
        </div>
      </div>
    );
  }

  // Show saving animation
  if (saving) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="relative mb-6">
            <Heart className="mx-auto h-16 w-16 text-pink-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-3">Saving Your Interests!</h3>
          <p className="text-gray-600 mb-2">Recording what {child?.name} loves...</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-pink-500 h-full rounded-full" style={{
              width: '100%',
              animation: 'pulse 1s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!surveyData) return null;

  const currentCategory = surveyData.categories[currentStep];
  const progress = ((currentStep + 1) / surveyData.categories.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-2 text-3xl">{currentCategory.emoji}</span>
              {currentCategory.name}
            </h2>
            <button onClick={onCancel} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-2 text-white/80">
            Step {currentStep + 1} of {surveyData.categories.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <p className="text-center text-gray-600 mb-6">
            How does {child?.name} feel about these {currentCategory.name.toLowerCase()}?
          </p>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentCategory.items.map(item => {
              const rating = responses[item.id];
              
              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    rating ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg flex items-center">
                        {item.name}
                        {item.isCustom && (
                          <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                            Custom
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Rating buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResponse(item.id, 'love')}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        rating === 'love'
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 hover:bg-pink-100 text-gray-700'
                      }`}
                    >
                      <Heart size={18} className={rating === 'love' ? 'fill-current' : ''} />
                      Love it!
                    </button>
                    
                    <button
                      onClick={() => handleResponse(item.id, 'like')}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        rating === 'like'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
                      }`}
                    >
                      <ThumbsUp size={18} />
                      Like it
                    </button>
                    
                    <button
                      onClick={() => handleResponse(item.id, 'pass')}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        rating === 'pass'
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Meh size={18} />
                      Not for me
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom item */}
          <div className="border-t pt-4">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add your own {currentCategory.name.toLowerCase()}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  placeholder={`Enter your favorite ${currentCategory.name.toLowerCase()}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customItem.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomItem('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {currentStep === surveyData.categories.length - 1 ? (
                <>
                  {saving ? 'Saving...' : 'Complete Survey'}
                  <Sparkles size={18} />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIKidInterestSurvey;