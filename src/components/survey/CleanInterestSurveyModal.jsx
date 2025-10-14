// src/components/survey/CleanInterestSurveyModal.jsx
import React, { useState, useMemo } from 'react';
import { X, ArrowRight, Check, Sparkles, Trophy } from 'lucide-react';

// Category icons as a simple object outside the component
const categoryIcons = {
  toys: "🎁",
  characters: "⭐",
  animals: "🦁",
  sensory: "👐",
  books: "📚",
  lego: "🧱",
  games: "🎮",
  sports: "🏀",
  science: "🔬",
  arts: "🎨",
  tech: "📱",
  coding: "💻",
  fashion: "👕",
  music: "🎵",
  collecting: "🏆",
  default: "🏷️"
};

/**
 * A clean, simplified version of the InterestSurveyModal component
 * 
 * @param {Array} interestPairs - Array of pairs of interests to compare
 * @param {Function} onComplete - Callback when survey is completed
 * @param {Function} onCancel - Callback when survey is cancelled
 * @param {string} childName - Name of the child
 * @param {string} childId - ID of the child
 * @param {Array} questionPrompts - Array of prompts for questions
 */
const CleanInterestSurveyModal = ({ 
  interestPairs, 
  onComplete, 
  onCancel, 
  childName, 
  childId, 
  questionPrompts = []
}) => {
  // State hooks
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState(null);
  
  // Get current pair to compare
  const currentPair = useMemo(() => {
    return (interestPairs && interestPairs.length > currentPairIndex) 
      ? interestPairs[currentPairIndex] 
      : [];
  }, [interestPairs, currentPairIndex]);
  
  // Progress percentage
  const progressPercentage = useMemo(() => {
    return interestPairs && interestPairs.length > 0 
      ? ((currentPairIndex) / interestPairs.length) * 100 
      : 0;
  }, [currentPairIndex, interestPairs]);
  
  // Get current question prompt
  const currentPrompt = useMemo(() => {
    return questionPrompts && questionPrompts.length > currentPairIndex
      ? questionPrompts[currentPairIndex]
      : `Which one does ${childName || 'your child'} like more?`;
  }, [questionPrompts, currentPairIndex, childName]);
  
  // Handle selecting a winner
  const handleSelect = (interestId) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedInterestId(interestId);
    
    // Identify winner and loser
    const winningInterest = currentPair.find(interest => interest.id === interestId);
    const losingInterest = currentPair.find(interest => interest.id !== interestId);
    
    if (!winningInterest || !losingInterest) {
      console.error("Error identifying winner and loser");
      setIsProcessing(false);
      return;
    }
    
    // Record the result
    const result = {
      winnerId: winningInterest.id,
      winnerName: winningInterest.name,
      loserId: losingInterest.id,
      loserName: losingInterest.name,
      timestamp: new Date().toISOString()
    };
    
    // Update results state with the new result
    const updatedResults = [...results, result];
    setResults(updatedResults);
    
    // Delay to show selection before proceeding
    setTimeout(() => {
      if (currentPairIndex < interestPairs.length - 1) {
        // Move to next question
        setCurrentPairIndex(currentPairIndex + 1);
        setSelectedInterestId(null); // Reset selected interest for next pair
      } else {
        // Survey completed
        setIsCompleted(true);
      }
      setIsProcessing(false);
    }, 800);
  };
  
  // Handle completion
  const handleFinish = () => {
    onComplete(results);
  };
  
  // Empty state - no pairs to compare
  if (!interestPairs || interestPairs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">No Interests to Compare</h3>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-start bg-yellow-50 p-4 rounded-lg mb-4">
            <div>
              <p className="text-yellow-800 font-medium mb-1">Not enough interests</p>
              <p className="text-sm text-yellow-700">
                You need at least 2 interests to run a comparison survey. Please add more interests first.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get category icon
  const getCategoryIcon = (category) => {
    return categoryIcons[category] || categoryIcons.default;
  };
  
  // Function to calculate top interests from results
  const getTopInterests = (results, limit = 3) => {
    // Count wins for each interest
    const winCounts = {};
    
    results.forEach(result => {
      winCounts[result.winnerId] = (winCounts[result.winnerId] || 0) + 1;
      // Initialize loser if not present
      if (!winCounts[result.loserId]) {
        winCounts[result.loserId] = 0;
      }
    });
    
    // Create array of interests with their win counts
    const interestWins = [];
    
    Object.entries(winCounts).forEach(([id, wins]) => {
      // Find the name for this ID
      const interestResult = results.find(r => r.winnerId === id || r.loserId === id);
      const name = id === interestResult?.winnerId ? interestResult.winnerName : interestResult?.loserName;
      
      interestWins.push({
        id,
        name,
        wins
      });
    });
    
    // Sort by wins (descending) and take the top 'limit'
    return interestWins
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700 flex items-center">
            {isCompleted 
              ? (
                <span className="flex items-center">
                  <Trophy size={24} className="text-yellow-500 mr-2" />
                  Survey Complete!
                </span>
              ) 
              : (
                <span className="flex items-center">
                  <Sparkles size={24} className="text-yellow-500 mr-2" />
                  {currentPrompt}
                </span>
              )}
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress bar */}
        {!isCompleted && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full text-sm">
                Question {currentPairIndex + 1} of {interestPairs.length}
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round(progressPercentage)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Comparison view */}
        {!isCompleted && currentPair && currentPair.length === 2 && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
            {/* Option 1 */}
            <button
              onClick={() => handleSelect(currentPair[0].id)}
              className={`w-full md:w-1/2 p-6 border-4 rounded-xl text-center transition-all ${
                isProcessing 
                  ? 'opacity-70 cursor-wait' 
                  : 'hover:border-purple-500 hover:shadow-xl hover:scale-105 transform hover:-rotate-1'
              } ${selectedInterestId === currentPair[0].id ? 'bg-purple-50 border-purple-500 shadow-lg' : 'bg-white border-blue-200'}`}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-4 transform transition-all hover:scale-110 hover:rotate-3">
                  {getCategoryIcon(currentPair[0].category)}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-indigo-800">{currentPair[0].name}</h3>
                <div className="text-sm text-gray-600 capitalize bg-gray-100 px-3 py-1 rounded-full">{currentPair[0].category}</div>
                
                {/* Details if available */}
                {currentPair[0].specifics && Object.keys(currentPair[0].specifics).length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {Object.entries(currentPair[0].specifics).map(([key, value]) => (
                      <span 
                        key={key} 
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
            
            {/* Center divider */}
            <div className="flex flex-row md:flex-col items-center">
              <div className="hidden md:block h-32 w-px bg-gray-300"></div>
              <div className="md:hidden w-32 h-px bg-gray-300"></div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl mx-4 my-2 transform rotate-3 shadow-lg">
                <span className="text-white">VS</span>
              </div>
              <div className="hidden md:block h-32 w-px bg-gray-300"></div>
              <div className="md:hidden w-32 h-px bg-gray-300"></div>
            </div>
            
            {/* Option 2 */}
            <button
              onClick={() => handleSelect(currentPair[1].id)}
              className={`w-full md:w-1/2 p-6 border-4 rounded-xl text-center transition-all ${
                isProcessing 
                  ? 'opacity-70 cursor-wait' 
                  : 'hover:border-pink-500 hover:shadow-xl hover:scale-105 transform hover:rotate-1'
              } ${selectedInterestId === currentPair[1].id ? 'bg-pink-50 border-pink-500 shadow-lg' : 'bg-white border-pink-200'}`}
              disabled={isProcessing}
            >
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-4 transform transition-all hover:scale-110 hover:-rotate-3">
                  {getCategoryIcon(currentPair[1].category)}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-pink-700">{currentPair[1].name}</h3>
                <div className="text-sm text-gray-600 capitalize bg-gray-100 px-3 py-1 rounded-full">{currentPair[1].category}</div>
                
                {/* Details if available */}
                {currentPair[1].specifics && Object.keys(currentPair[1].specifics).length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {Object.entries(currentPair[1].specifics).map(([key, value]) => (
                      <span 
                        key={key} 
                        className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full font-medium"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          </div>
        )}
        
        {/* Completion view */}
        {isCompleted && (
          <div className="text-center py-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check size={46} className="text-white" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-green-600">
              Awesome! Survey Completed!
            </h3>
            
            <p className="text-gray-600 mb-6 text-lg">
              {childName ? `${childName}'s` : "Your child's"} interests have been ranked based on {results.length} comparisons.
            </p>
            
            {/* Results summary */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl mb-6 text-left shadow-sm border border-purple-100">
              <h4 className="font-medium text-purple-800 mb-4 flex items-center text-lg">
                <Trophy size={22} className="text-yellow-500 mr-2" />
                Top Choices Based on Survey
              </h4>
              
              <ul className="space-y-3">
                {/* Show top 3 winners based on frequency */}
                {getTopInterests(results).map((interest, index) => (
                  <li key={interest.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                    {index === 0 ? (
                      <span className="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center font-bold mr-3 border-2 border-yellow-300">
                        🥇
                      </span>
                    ) : index === 1 ? (
                      <span className="w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-bold mr-3 border-2 border-gray-300">
                        🥈
                      </span>
                    ) : (
                      <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold mr-3 border-2 border-orange-300">
                        🥉
                      </span>
                    )}
                    <span className="font-medium text-lg">{interest.name}</span>
                    <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {interest.wins} wins
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinish}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium flex items-center shadow-md hover:shadow-lg transition-all"
              >
                Save Results
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        )}
        
        {/* Help text at bottom */}
        {!isCompleted && (
          <div className="mt-6 pt-4 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-purple-100 inline-block">
              <div className="flex items-center justify-center text-sm text-indigo-700 font-medium">
                <Sparkles size={18} className="text-yellow-500 mr-2" />
                <span>
                  Pick the one that {childName || 'your child'} likes better! Tap your favorite!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanInterestSurveyModal;