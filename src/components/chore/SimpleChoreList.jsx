import React, { useState, useEffect, useRef } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useChore } from '../../contexts/ChoreContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import BucksService from '../../services/BucksService';
import ChoreService from '../../services/ChoreService';
import { cleanupExcessiveChoreInstances, needsCleanup } from '../../utils/choreCleanup';
import { RefreshCw, Sun, Sunset, Moon, Star, DollarSign, Check, Heart, Camera, Smile, Frown, Meh, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SimpleChoreList = () => {
  const { selectedUser, familyMembers, familyId } = useFamily();
  const { loadChildChores, choresByTimeOfDay, selectedChildId: contextChildId } = useChore();
  const [chores, setChores] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(selectedUser?.id || contextChildId);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [balance, setBalance] = useState(0);
  const [selectedDate] = useState(new Date());
  const [completedChores, setCompletedChores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingChore, setPendingChore] = useState(null);
  const [feedback, setFeedback] = useState({
    sentiment: null,
    effort: 3,
    enjoyment: 3,
    photo: null,
    notes: ''
  });
  const fileInputRef = useRef(null);

  // Get only children from family members
  const children = familyMembers.filter(member => member.role === 'child');

  // Update selectedChildId when selectedUser changes
  useEffect(() => {
    if (selectedUser?.role === 'child' && selectedUser?.id !== selectedChildId) {
      setSelectedChildId(selectedUser.id);
    }
  }, [selectedUser]);

  // Load chores when child changes
  useEffect(() => {
    if (selectedChildId && familyId) {
      loadChoresForChild();
    } else {
      setIsLoading(false);
    }
  }, [selectedChildId, familyId]);

  // State for grouped chores
  const [choresByTime, setChoresByTime] = useState({
    morning: [],
    afternoon: [],
    evening: [],
    anytime: []
  });

  const loadChoresForChild = async () => {
    setIsLoading(true);
    try {
      // Skip cleanup check on every load - it's too slow
      // Only run cleanup when user explicitly clicks the button
      
      // Load chores for the specific child
      // Since we can't change the selected child in context, we'll load chores directly
      // Skip default creation for performance - pass true as last parameter
      const choreInstances = await ChoreService.getChoreInstancesForChild(familyId, selectedChildId, selectedDate, true);
      // Remove debug logging for performance
      
      // Deduplicate chores - keep only unique template IDs
      const uniqueChores = [];
      const seenTemplateIds = new Set();
      
      choreInstances.forEach(chore => {
        const templateId = chore.templateId || chore.template?.id;
        if (templateId && !seenTemplateIds.has(templateId)) {
          seenTemplateIds.add(templateId);
          uniqueChores.push(chore);
        } else if (!templateId && uniqueChores.length < 20) {
          // Include chores without templates up to a limit
          uniqueChores.push(chore);
        }
      });
      
      // Removed logging for performance
      
      // Group by time of day
      const groupedChores = {
        morning: [],
        afternoon: [],
        evening: [],
        anytime: []
      };
      
      uniqueChores.forEach(chore => {
        const timeOfDay = chore.timeOfDay || chore.template?.timeOfDay || 'anytime';
        groupedChores[timeOfDay].push(chore);
      });
      
      // Set the grouped chores and flat list
      setChoresByTime(groupedChores);
      setChores(uniqueChores);
      
      // Get balance
      const childBalance = await BucksService.getChildBalance(familyId, selectedChildId);
      setBalance(childBalance);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteChore = async (chore) => {
    if (!chore || !selectedChildId) return;
    
    // Show feedback modal instead of completing immediately
    setPendingChore(chore);
    setShowFeedbackModal(true);
    setFeedback({
      sentiment: null,
      effort: 3,
      enjoyment: 3,
      photo: null,
      notes: ''
    });
  };

  const submitChoreCompletion = async () => {
    if (!pendingChore || !selectedChildId) return;

    console.log('[SIMPLE CHORES] Completing chore with feedback:', pendingChore.id);

    try {
      setLoading(true);
      
      // Update UI immediately for both flat list and grouped view
      setChores(prev => prev.map(c => 
        c.id === pendingChore.id ? { ...c, status: 'completed' } : c
      ));
      
      // Also update grouped chores immediately
      setChoresByTime(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(timeOfDay => {
          updated[timeOfDay] = updated[timeOfDay].map(c => 
            c.id === pendingChore.id ? { ...c, status: 'completed' } : c
          );
        });
        return updated;
      });

      // Update in database with feedback
      await updateDoc(doc(db, 'choreInstances', pendingChore.id), {
        status: 'completed',
        completedAt: new Date(),
        completedBy: selectedChildId,
        feedback: {
          sentiment: feedback.sentiment,
          effort: feedback.effort,
          enjoyment: feedback.enjoyment,
          photoUrl: feedback.photo,
          notes: feedback.notes,
          submittedAt: new Date()
        }
      });

      // Award bucks
      const bucksAmount = pendingChore.bucksReward || pendingChore.template?.bucksReward || 1;
      await BucksService.rewardChore(
        familyId,
        selectedChildId,
        pendingChore.id,
        bucksAmount,
        selectedUser?.id
      );

      // Update balance immediately
      setBalance(prev => prev + bucksAmount);

      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Close modal
      setShowFeedbackModal(false);
      setPendingChore(null);
      
      // Show success feedback
      setCompletedChores([...completedChores, pendingChore.id]);
      setTimeout(() => {
        setCompletedChores(prev => prev.filter(id => id !== pendingChore.id));
      }, 2000);

      console.log('[SIMPLE CHORES] Chore completed with feedback successfully');
    } catch (error) {
      console.error('Error completing chore:', error);
      // Revert UI on error
      setChores(prev => prev.map(c => 
        c.id === pendingChore.id ? { ...c, status: pendingChore.status } : c
      ));
      setChoresByTime(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(timeOfDay => {
          updated[timeOfDay] = updated[timeOfDay].map(c => 
            c.id === pendingChore.id ? { ...c, status: pendingChore.status } : c
          );
        });
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedback({ ...feedback, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      console.log('[SIMPLE CHORES] Starting duplicate cleanup...');
      // First cleanup excessive instances
      await cleanupExcessiveChoreInstances(familyId, selectedDate);
      
      // Force a fresh reload after cleanup
      setTimeout(async () => {
        await loadChoresForChild();
        alert('Duplicates cleaned up successfully! Chores have been refreshed.');
      }, 1000);
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert('Failed to clean duplicates: ' + error.message);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // No need to group again - we already have choresByTime from state

  const timeIcons = {
    morning: { icon: Sun, color: 'text-yellow-500', emoji: '🌅' },
    afternoon: { icon: Sunset, color: 'text-orange-500', emoji: '☀️' },
    evening: { icon: Moon, color: 'text-purple-500', emoji: '🌙' },
    anytime: { icon: Star, color: 'text-blue-500', emoji: '⭐' }
  };

  if (selectedUser?.role !== 'child' && !selectedChildId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Select a Child</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className="p-4 border-2 rounded-lg hover:border-purple-500 transition-colors"
            >
              <div className="text-4xl mb-2">{child.avatar || '👤'}</div>
              <div className="font-medium">{child.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentChild = children.find(c => c.id === selectedChildId) || selectedUser;
  const completedCount = chores.filter(c => c.status === 'completed').length;
  const totalCount = chores.length;
  const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {currentChild?.name}'s Chores
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <DollarSign size={16} className="text-green-600" />
              <span className="font-semibold text-green-600">{balance} Bucks</span>
            </div>
            <button
              onClick={handleCleanupDuplicates}
              disabled={isCleaningUp}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isCleaningUp ? 'animate-spin' : ''} />
              Fix Duplicates
            </button>
          </div>
        </div>

        {/* Child Switcher (for parents) */}
        {selectedUser?.role === 'parent' && children.length > 1 && (
          <div className="flex gap-2 mb-4">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedChildId === child.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedCount} of {totalCount} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chores List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chores...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No chores assigned!</h3>
          <p className="text-blue-700">Ask your parents to create some chores for you.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(choresByTime).map(([timeOfDay, timeChores]) => {
            const { emoji, color } = timeIcons[timeOfDay] || timeIcons.anytime;
            
            return (
              <div key={timeOfDay} className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <span className="capitalize">{timeOfDay} Chores</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {timeChores.filter(c => c.status === 'completed').length}/{timeChores.length}
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {timeChores.map(chore => {
                    const isCompleted = chore.status === 'completed';
                    const title = chore.title || chore.template?.title || 'Chore';
                    const description = chore.description || chore.template?.description || '';
                    const bucks = chore.bucksReward || chore.template?.bucksReward || 1;
                    // Check multiple possible image field locations
                    const imageUrl = chore.template?.customIconUrl || 
                                   chore.template?.imageUrl || 
                                   chore.template?.iconUrl ||
                                   chore.customIconUrl || 
                                   chore.imageUrl ||
                                   chore.iconUrl;
                    
                    // Also check if icon field exists (might be emoji or icon name)
                    const icon = chore.template?.icon || chore.icon;
                    
                    // Removed debug logging for performance
                    
                    return (
                      <motion.div 
                        key={chore.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden rounded-lg border transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                        onClick={() => !isCompleted && handleCompleteChore(chore)}
                      >
                        <div className="flex items-center gap-3 p-4">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-400 hover:border-purple-500'
                          }`}>
                            {isCompleted && <Check size={20} className="text-white" />}
                          </div>
                        
                        {/* Add chore image or icon */}
                        {(imageUrl || icon) && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  // Show icon as fallback if image fails
                                  if (icon && e.target.parentElement) {
                                    e.target.parentElement.innerHTML = `<span class="text-2xl">${icon}</span>`;
                                  }
                                }}
                              />
                            ) : icon ? (
                              <span className="text-2xl">{icon}</span>
                            ) : null}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {title}
                          </h4>
                          {description && (
                            <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {description}
                            </p>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                          isCompleted ? 'bg-gray-100' : 'bg-yellow-100'
                        }`}>
                          <DollarSign size={14} className={isCompleted ? 'text-gray-400' : 'text-yellow-600'} />
                          <span className={`text-sm font-medium ${
                            isCompleted ? 'text-gray-400' : 'text-yellow-600'
                          }`}>
                            +{bucks}
                          </span>
                        </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-center mb-6">
                Great job completing your chore! 🎉
              </h3>
              
              {/* Sentiment Selection */}
              <div className="mb-6">
                <p className="text-center text-gray-700 mb-4">How did it feel?</p>
                <div className="flex justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFeedback({ ...feedback, sentiment: 'loved' })}
                    className={`p-4 rounded-2xl transition-all ${
                      feedback.sentiment === 'loved'
                        ? 'bg-pink-100 ring-2 ring-pink-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Heart size={40} className={feedback.sentiment === 'loved' ? 'text-pink-500 fill-pink-500' : 'text-gray-600'} />
                    <p className="text-sm mt-2">I loved it!</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFeedback({ ...feedback, sentiment: 'ok' })}
                    className={`p-4 rounded-2xl transition-all ${
                      feedback.sentiment === 'ok'
                        ? 'bg-yellow-100 ring-2 ring-yellow-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Meh size={40} className={feedback.sentiment === 'ok' ? 'text-yellow-500' : 'text-gray-600'} />
                    <p className="text-sm mt-2">Just OK</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFeedback({ ...feedback, sentiment: 'hated' })}
                    className={`p-4 rounded-2xl transition-all ${
                      feedback.sentiment === 'hated'
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Frown size={40} className={feedback.sentiment === 'hated' ? 'text-blue-500' : 'text-gray-600'} />
                    <p className="text-sm mt-2">I hated it</p>
                  </motion.button>
                </div>
              </div>
              
              {/* Effort Rating */}
              <div className="mb-6">
                <p className="text-center text-gray-700 mb-2">How much effort did it take?</p>
                <div className="px-8">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedback.effort}
                    onChange={(e) => setFeedback({ ...feedback, effort: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Easy</span>
                    <span>Hard</span>
                  </div>
                </div>
              </div>
              
              {/* Enjoyment Rating */}
              <div className="mb-6">
                <p className="text-center text-gray-700 mb-2">How fun was it?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setFeedback({ ...feedback, enjoyment: rating })}
                      className="transition-all"
                    >
                      <Heart
                        size={32}
                        className={`${
                          rating <= feedback.enjoyment
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Photo Capture */}
              <div className="mb-6">
                <p className="text-center text-gray-700 mb-2">Add a photo (optional)</p>
                <div className="flex justify-center">
                  {feedback.photo ? (
                    <div className="relative">
                      <img src={feedback.photo} alt="Chore completion" className="w-32 h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setFeedback({ ...feedback, photo: null })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Camera size={32} className="text-gray-600" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={submitChoreCompletion}
                disabled={!feedback.sentiment}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  feedback.sentiment
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Complete Chore & Earn Bucks!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleChoreList;