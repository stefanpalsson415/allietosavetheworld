import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const InterviewLauncher = ({ onLaunchInterview }) => {
  const { currentUser, familyData } = useAuth();
  const [availableInterviews, setAvailableInterviews] = useState([]);
  const [interviewProgress, setInterviewProgress] = useState({}); // Track progress per member per interview

  // Extract family data - handle different data structures
  const familyId = familyData?.id || familyData?.familyId;

  // Try different ways to get family members
  const familyMembers = familyData?.members ||
                        familyData?.familyMembers ||
                        familyData?.parents?.concat(familyData?.children || []) ||
                        [];

  // If still empty, create mock data for testing
  const members = familyMembers.length > 0 ? familyMembers : [
    { id: 'parent1', name: 'Parent 1', isParent: true, role: 'parent' },
    { id: 'parent2', name: 'Parent 2', isParent: true, role: 'parent' },
    { id: 'child1', name: 'Child 1', isParent: false, role: 'child', age: 10 },
    { id: 'child2', name: 'Child 2', isParent: false, role: 'child', age: 8 }
  ];

  const interviewTypes = [
    {
      id: 'invisible_work_discovery',
      title: 'Invisible Work Discovery',
      subtitle: 'Uncover hidden mental load and invisible tasks',
      icon: '🔍',
      duration: '15-20 min',
      participants: 'Individual Parent',
      description: 'Explore the work that happens behind the scenes in your family - the planning, coordinating, and mental energy that keeps everything running.',
      eligibleRoles: ['parent'],
      maxParticipants: 1, // Individual sessions
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      questions: [
        "Walk me through your morning routine - what are you thinking about before anyone else wakes up?",
        "When you're grocery shopping, what decisions are you making beyond just buying food?",
        "Tell me about a time when something 'just happened' in your family - like clean clothes appearing or a birthday being remembered.",
        "What would happen if you didn't do [specific task] for a week?",
        "What family responsibilities do you think about but never actually discuss?"
      ]
    },
    {
      id: 'stress_capacity',
      title: 'Stress & Capacity',
      subtitle: 'Understand child stress indicators and emotional capacity',
      icon: '💫',
      duration: '10-12 min',
      participants: 'Kids (8-12)',
      description: 'Help Allie learn how to recognize when your children are feeling overwhelmed and what helps them feel calm and supported.',
      eligibleRoles: ['child'],
      ageRange: [8, 12],
      maxParticipants: 1,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      questions: [
        "What does it feel like in your body when the house gets really busy?",
        "If your family was a weather forecast, what would today look like?",
        "When grown-ups are stressed, how can you tell? What do they do differently?",
        "What's something that helps you feel calm when everything feels too much?",
        "If you could give your parents a magic button to make one thing easier, what would it do?"
      ]
    },
    {
      id: 'decision_making_styles',
      title: 'Decision-Making Styles',
      subtitle: 'Map how family decisions get made and identify bottlenecks',
      icon: '⚖️',
      duration: '20-25 min',
      participants: 'Both Parents Together',
      description: 'Understand your family\'s decision-making patterns, from daily choices to big life decisions, and discover ways to make the process smoother.',
      eligibleRoles: ['parent'],
      maxParticipants: 2, // Both parents together
      requiresBoth: true,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      questions: [
        "Walk me through the last big decision you made together. Who brought it up? How did it evolve?",
        "What decisions do you each 'own' without needing to discuss?",
        "Tell me about a time when you thought you agreed on something but realized you had different expectations.",
        "What family decisions tend to get stuck or delayed?",
        "How do you handle disagreements when kids are watching?"
      ]
    },
    {
      id: 'family_rules_archaeology',
      title: 'Family Rules Archaeology',
      subtitle: 'Uncover unspoken family rules and expectations',
      icon: '📜',
      duration: '15-20 min',
      participants: 'Whole Family',
      description: 'Discover the unspoken rules that guide your family - the traditions, expectations, and cultural patterns that everyone knows but rarely discusses.',
      eligibleRoles: ['parent', 'child'],
      maxParticipants: 6, // Whole family
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      questions: [
        "What's a rule in your family that you've never actually said out loud?",
        "If a new family moved in and wanted to fit in with your family, what would they need to know?",
        "What happens in your family when someone breaks an unspoken rule?",
        "What family traditions or habits would you be sad to lose?",
        "If your family had a motto, what would it be?"
      ]
    },
    {
      id: 'future_selves_visioning',
      title: 'Future Selves Visioning',
      subtitle: 'Understand individual goals and family trajectory',
      icon: '🔮',
      duration: '12-15 min',
      participants: 'Individual Parent',
      description: 'Explore where your family is headed - your hopes, dreams, and vision for who you\'re becoming together over the next few years.',
      eligibleRoles: ['parent'],
      maxParticipants: 1,
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      questions: [
        "Fast-forward 5 years - what does a perfect Saturday look like for your family?",
        "What skills are you hoping your kids develop that you didn't have growing up?",
        "What family pattern from your childhood do you want to break or continue?",
        "If you could wave a magic wand and change one thing about your family dynamic, what would it be?",
        "What does 'family success' mean to you?"
      ]
    },
    {
      id: 'personal_profile',
      title: 'Personal Profile Interview',
      subtitle: 'Tell Allie about your preferences and routines',
      icon: '👤',
      duration: '10 min',
      participants: 'Individual (Anyone)',
      description: 'Help Allie understand your unique preferences, daily routines, communication style, and what makes you feel supported in family life.',
      eligibleRoles: ['parent', 'child'],
      maxParticipants: 1,
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
      questions: [
        "What time of day do you feel most energized? When do you need quiet time?",
        "How do you prefer to receive information - detailed plans or quick summaries?",
        "What does a perfect morning routine look like for you?",
        "How do you like to be reminded about things - texts, calendar notifications, or in-person?",
        "What helps you feel appreciated in the family?"
      ]
    }
  ];

  useEffect(() => {
    if (members && members.length > 0) {
      const filteredInterviews = interviewTypes.map(interview => {
        const eligibleMembers = getEligibleParticipants(interview);
        return {
          ...interview,
          eligibleMembers,
          canStart: eligibleMembers.length >= (interview.requiresBoth ? 2 : 1)
        };
      });
      setAvailableInterviews(filteredInterviews);
    }
  }, [members]);

  // Load interview progress from Firestore
  useEffect(() => {
    const loadInterviewProgress = async () => {
      if (!familyId || !members.length) return;

      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');

        const sessionsRef = collection(db, 'interviewSessions');
        const sessionsQuery = query(
          sessionsRef,
          where('familyId', '==', familyId)
        );

        const snapshot = await getDocs(sessionsQuery);
        const progress = {};

        snapshot.forEach(doc => {
          const session = doc.data();
          const sessionId = doc.id;

          // Extract interview type from session ID
          // Format: interview_{timestamp}_{type}_{familyId}
          const parts = sessionId.split('_');
          if (parts.length >= 4) {
            const interviewType = parts.slice(2, -1).join('_');

            // Calculate progress for each participant
            session.participants?.forEach(participant => {
              const totalQuestions = session.totalQuestions || 5;
              const currentQuestion = session.currentQuestionIndex || 0;
              const isCompleted = session.status === 'completed';

              const progressPercent = isCompleted
                ? 100
                : Math.round((currentQuestion / totalQuestions) * 100);

              const key = `${interviewType}_${participant.userId}`;
              progress[key] = {
                percent: progressPercent,
                status: session.status,
                completed: isCompleted
              };
            });
          }
        });

        setInterviewProgress(progress);
      } catch (error) {
        console.warn('Could not load interview progress:', error);
      }
    };

    loadInterviewProgress();
  }, [familyId, members]);

  const getEligibleParticipants = (interview) => {
    if (!members || members.length === 0) return [];

    return members.filter(member => {
      // Check role eligibility
      if (!interview.eligibleRoles.includes(member.role || (member.isParent ? 'parent' : 'child'))) {
        return false;
      }

      // Check age range for children
      if (interview.ageRange && member.age) {
        const [minAge, maxAge] = interview.ageRange;
        if (member.age < minAge || member.age > maxAge) {
          return false;
        }
      }

      return true;
    });
  };

  const handleInterviewLaunch = (interview, selectedParticipants) => {
    if (onLaunchInterview) {
      onLaunchInterview({
        interviewType: interview.id,
        interviewData: interview,
        participants: selectedParticipants,
        familyId: familyId
      });
    }
  };

  const InterviewCard = ({ interview }) => {
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    const toggleParticipant = (member) => {
      setSelectedParticipants(prev => {
        const isSelected = prev.find(p => p.id === member.id);
        if (isSelected) {
          return prev.filter(p => p.id !== member.id);
        } else {
          // Handle single vs multiple participant selection
          if (interview.maxParticipants === 1) {
            return [member];
          } else if (interview.requiresBoth) {
            return prev.length < 2 ? [...prev, member] : prev;
          } else {
            return [...prev, member];
          }
        }
      });
    };

    const canLaunch = () => {
      if (interview.requiresBoth) {
        return selectedParticipants.length === 2;
      }
      return selectedParticipants.length >= 1 && selectedParticipants.length <= interview.maxParticipants;
    };

    return (
      <div className={`p-6 rounded-lg border-2 transition-all duration-200 ${interview.color}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="text-3xl mr-3">{interview.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
              <p className="text-sm text-gray-600">{interview.subtitle}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>{interview.duration}</div>
            <div>{interview.participants}</div>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">{interview.description}</p>

        {/* Sample Questions Preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Sample Questions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {interview.questions.slice(0, 2).map((question, index) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>"{question}"</span>
              </li>
            ))}
            {interview.questions.length > 2 && (
              <li className="text-gray-400 italic">...and {interview.questions.length - 2} more</li>
            )}
          </ul>
        </div>

        {/* Participant Selection - Always Visible */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-800 mb-2">
            Select Participants ({selectedParticipants.length})
          </div>

          <div className="space-y-2">
            {interview.eligibleMembers.map(member => {
              const progressKey = `${interview.id}_${member.id}`;
              const memberProgress = interviewProgress[progressKey];
              const isSelected = !!selectedParticipants.find(p => p.id === member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => toggleParticipant(member)}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <UserAvatar user={member} size={32} className="mr-3" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name}</div>
                    {memberProgress && memberProgress.completed && (
                      <div className="text-xs text-green-600 font-medium">✓ Done</div>
                    )}
                    {memberProgress && !memberProgress.completed && memberProgress.percent > 0 && (
                      <div className="text-xs text-blue-600">{memberProgress.percent}% complete</div>
                    )}
                    {!memberProgress && member.age && (
                      <div className="text-xs text-gray-500">{member.age} years old</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="text-blue-600 text-lg">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={() => canLaunch() && handleInterviewLaunch(interview, selectedParticipants)}
          disabled={!canLaunch()}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            canLaunch()
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canLaunch() ? 'Start Interview' : 'Select Participants First'}
        </button>

        {/* Helpful hints */}
        {!canLaunch() && interview.requiresBoth && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            This interview works best with both parents participating together
          </p>
        )}
      </div>
    );
  };

  if (!familyId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to begin interviews.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🎙️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Allie's Family Discovery Sessions
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help Allie learn about your family's unique dynamics through personalized conversations
          that uncover patterns, reduce stress, and optimize your collective wellbeing.
        </p>
      </div>

      {/* Statistics Bar */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="flex justify-center space-x-8 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Interviews Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-600">Discovery Types Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{members?.length || 0}</div>
            <div className="text-sm text-gray-600">Family Members</div>
          </div>
        </div>
      </div>

      {/* Interview List - Full width horizontal cards */}
      <div className="space-y-4">
        {availableInterviews.map(interview => (
          <InterviewCard key={interview.id} interview={interview} />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="text-2xl mr-3">💡</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose an interview type that interests you</li>
              <li>• Select which family members will participate</li>
              <li>• Have a natural conversation with Allie (voice or text)</li>
              <li>• Receive personalized insights and actionable recommendations</li>
              <li>• Watch your family patterns evolve over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewLauncher;