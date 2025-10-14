import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import ClaudeService from '../../services/ClaudeService';
import VoiceInterface from '../voice/VoiceInterface';
import { UserCircle, Mic, MicOff, Volume2, VolumeX, SkipForward, X } from 'lucide-react';

const ProfileBuilderInterview = ({ onClose, onComplete }) => {
  const { currentUser } = useAuth();
  const { familyId, selectedUser } = useFamily();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const voiceInterfaceRef = useRef(null);

  // Profile interview questions
  const profileQuestions = [
    {
      id: 'morning_routine',
      question: "Let's start with your mornings. What does your typical morning routine look like? What time do you usually wake up?",
      category: 'routines'
    },
    {
      id: 'work_schedule',
      question: "Tell me about your work schedule. Do you work from home or commute? What are your typical working hours?",
      category: 'work'
    },
    {
      id: 'dietary_preferences',
      question: "Do you have any dietary preferences or restrictions I should know about? Any favorite foods or things you absolutely won't eat?",
      category: 'food'
    },
    {
      id: 'health_wellness',
      question: "How do you like to stay healthy? Do you have any regular exercise routines or wellness practices?",
      category: 'health'
    },
    {
      id: 'hobbies_interests',
      question: "What do you enjoy doing in your free time? Any hobbies or interests you're passionate about?",
      category: 'interests'
    },
    {
      id: 'stress_relief',
      question: "Everyone needs to unwind. How do you prefer to relax or deal with stress?",
      category: 'wellness'
    },
    {
      id: 'communication_style',
      question: "How do you prefer to receive reminders or important information? Text, email, or something else?",
      category: 'communication'
    },
    {
      id: 'pet_peeves',
      question: "What are some things that really bother you or pet peeves I should be aware of?",
      category: 'preferences'
    },
    {
      id: 'ideal_weekend',
      question: "Describe your ideal weekend. How do you like to spend your time off?",
      category: 'lifestyle'
    },
    {
      id: 'important_dates',
      question: "Are there any important dates or anniversaries I should remember for you?",
      category: 'dates'
    },
    {
      id: 'energy_levels',
      question: "When do you feel most energetic during the day? Are you a morning person or night owl?",
      category: 'energy'
    },
    {
      id: 'household_preferences',
      question: "When it comes to household tasks, what do you enjoy doing and what do you absolutely hate?",
      category: 'household'
    }
  ];

  const currentQuestion = profileQuestions[currentQuestionIndex];

  useEffect(() => {
    // Start with the first question
    if (isVoiceEnabled && voiceInterfaceRef.current) {
      setTimeout(() => {
        voiceInterfaceRef.current.speak(currentQuestion.question);
      }, 500);
    }
  }, []);

  const handleResponse = async (response, responseType = 'text') => {
    if (!response.trim()) return;

    // Save the response
    const updatedResponses = {
      ...responses,
      [currentQuestion.id]: {
        question: currentQuestion.question,
        answer: response,
        category: currentQuestion.category,
        timestamp: new Date().toISOString()
      }
    };
    setResponses(updatedResponses);

    // Move to next question or complete
    if (currentQuestionIndex < profileQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTextInput('');

      // Speak next question
      const nextQuestion = profileQuestions[currentQuestionIndex + 1];
      if (isVoiceEnabled && voiceInterfaceRef.current) {
        // Add a brief acknowledgment before next question
        const acknowledgments = [
          "Great, thanks for sharing that.",
          "Got it, that's helpful.",
          "Perfect, I'll remember that.",
          "Wonderful, thank you.",
          "That's really helpful to know."
        ];
        const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];

        setTimeout(() => {
          voiceInterfaceRef.current.speak(`${ack} ${nextQuestion.question}`);
        }, 500);
      }
    } else {
      // Interview complete
      await saveProfileData(updatedResponses);
    }
  };

  const saveProfileData = async (finalResponses) => {
    setIsProcessing(true);
    try {
      const userId = selectedUser?.id || currentUser.uid;

      // Process responses with Claude to extract structured data
      const prompt = `Based on this profile interview, extract key information about this person:

${Object.entries(finalResponses).map(([key, data]) =>
  `Q: ${data.question}\nA: ${data.answer}`
).join('\n\n')}

Please provide a structured summary with:
1. Daily routines and schedule
2. Preferences and interests
3. Communication style
4. Important dates to remember
5. Household preferences
6. Health and wellness habits`;

      const analysis = await ClaudeService.sendMessage(prompt, null, familyId);

      // Save to user's profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'enhancedProfile': {
          completed: true,
          completedAt: serverTimestamp(),
          responses: finalResponses,
          analysis: analysis,
          lastUpdated: serverTimestamp()
        },
        'interviews.profile': {
          completed: true,
          completedAt: serverTimestamp()
        }
      });

      // Also update in family member record
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        [`members.${userId}.enhancedProfile`]: {
          completed: true,
          completedAt: new Date().toISOString()
        },
        [`members.${userId}.interviews.profile`]: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      });

      if (onComplete) {
        onComplete(finalResponses);
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < profileQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTextInput('');

      const nextQuestion = profileQuestions[currentQuestionIndex + 1];
      if (isVoiceEnabled && voiceInterfaceRef.current) {
        setTimeout(() => {
          voiceInterfaceRef.current.speak(nextQuestion.question);
        }, 300);
      }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleResponse(textInput);
    }
  };

  const progress = ((currentQuestionIndex + 1) / profileQuestions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold">Personal Profile Interview</h2>
                <p className="text-gray-600">Help Allie understand you better</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {profileQuestions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Display */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Category: {currentQuestion.category}
            </p>
            <h3 className="text-xl font-semibold text-gray-800">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Voice Interface */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <VoiceInterface
              ref={voiceInterfaceRef}
              onTranscript={(transcript) => {
                if (transcript && transcript.length > 5) {
                  handleResponse(transcript, 'voice');
                }
              }}
              autoSpeak={false}
              showTranscript={true}
            />
          </div>

          {/* Text Input Alternative */}
          <form onSubmit={handleTextSubmit} className="mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={skipQuestion}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isProcessing || !textInput.trim()}
              >
                Next
              </button>
            </div>
          </form>

          {/* Voice Toggle */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {isVoiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  Voice enabled
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  Voice disabled
                </>
              )}
            </button>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Saving your profile...</p>
              <p className="text-gray-600">This will help Allie personalize your experience</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileBuilderInterview;