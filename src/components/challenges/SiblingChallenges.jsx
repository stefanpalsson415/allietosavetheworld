import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Progress } from '../common/Progress';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target,
  Users,
  Gift,
  Sparkles,
  Medal,
  Flag,
  Rocket,
  Heart,
  Camera
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import SiblingDynamicsService from '../../services/SiblingDynamicsService';
import { db } from '../../services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const SiblingChallenges = () => {
  const { currentFamily } = useFamily();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [siblingPoints, setSiblingPoints] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fun challenges designed for sibling collaboration
  const challenges = {
    quick: [
      {
        id: 'compliment_relay',
        name: 'Compliment Relay',
        icon: Heart,
        duration: '5 minutes',
        points: 10,
        category: 'emotional',
        description: 'Take turns giving each other genuine compliments',
        rules: [
          'Each sibling gives 3 compliments',
          'Must be specific and genuine',
          'No repeating what others said'
        ],
        reward: 'Sibling Appreciation Badge'
      },
      {
        id: 'dance_party',
        name: 'Sibling Dance Party',
        icon: Sparkles,
        duration: '10 minutes',
        points: 15,
        category: 'physical',
        description: 'Create a dance routine together',
        rules: [
          'Pick a favorite song',
          'Each sibling adds 2 moves',
          'Perform for the family'
        ],
        reward: 'Dance Duo Trophy'
      },
      {
        id: 'joke_contest',
        name: 'Joke Contest',
        icon: Star,
        duration: '10 minutes',
        points: 10,
        category: 'creative',
        description: 'Tell jokes and make each other laugh',
        rules: [
          'Take turns telling jokes',
          'Count how many laughs you get',
          'Work together to make parents laugh'
        ],
        reward: 'Comedy Team Award'
      }
    ],
    daily: [
      {
        id: 'reading_adventure',
        name: 'Reading Adventure',
        icon: Rocket,
        duration: '20 minutes',
        points: 25,
        category: 'academic',
        description: 'Read a story together and act it out',
        rules: [
          'Older sibling reads, younger follows along',
          'Act out favorite scene together',
          'Draw a picture of the story'
        ],
        reward: 'Story Explorer Badge'
      },
      {
        id: 'lego_challenge',
        name: 'Build Together Challenge',
        icon: Target,
        duration: '30 minutes',
        points: 30,
        category: 'creative',
        description: 'Build something amazing together',
        rules: [
          'Decide on a theme together',
          'Each sibling builds part of it',
          'Combine into one creation'
        ],
        reward: 'Master Builder Trophy'
      },
      {
        id: 'teach_me_something',
        name: 'Teach Me Something New',
        icon: Zap,
        duration: '15 minutes',
        points: 20,
        category: 'learning',
        description: 'Siblings teach each other a new skill',
        rules: [
          'Each sibling teaches one thing',
          'Must be patient and encouraging',
          'Celebrate when you both learn it'
        ],
        reward: 'Teacher & Student Medals'
      }
    ],
    weekly: [
      {
        id: 'sibling_show',
        name: 'Sibling Talent Show',
        icon: Trophy,
        duration: '1 hour',
        points: 50,
        category: 'performance',
        description: 'Plan and perform a show for the family',
        rules: [
          'Plan 3-5 acts together',
          'Practice during the week',
          'Perform on weekend'
        ],
        reward: 'Star Performers Trophy'
      },
      {
        id: 'cooking_together',
        name: 'Junior Chef Team',
        icon: Gift,
        duration: '45 minutes',
        points: 40,
        category: 'life_skills',
        description: 'Cook or bake something delicious together',
        rules: [
          'Choose a simple recipe',
          'Share the tasks fairly',
          'Clean up together after'
        ],
        reward: 'Chef Team Certificate'
      },
      {
        id: 'photo_story',
        name: 'Photo Story Adventure',
        icon: Camera,
        duration: '30 minutes',
        points: 35,
        category: 'creative',
        description: 'Create a photo story together',
        rules: [
          'Take 10 photos that tell a story',
          'Each sibling directs half',
          'Present to family with narration'
        ],
        reward: 'Storyteller Badge'
      }
    ],
    special: [
      {
        id: 'sibling_olympics',
        name: 'Sibling Olympics',
        icon: Medal,
        duration: '2 hours',
        points: 100,
        category: 'physical',
        description: 'Complete 5 team challenges',
        rules: [
          'Three-legged race',
          'Balloon keep-up challenge',
          'Puzzle race',
          'Memory game together',
          'Victory dance creation'
        ],
        reward: 'Olympic Champions Medal'
      },
      {
        id: 'kindness_mission',
        name: 'Secret Kindness Mission',
        icon: Heart,
        duration: '1 week',
        points: 75,
        category: 'emotional',
        description: 'Do secret kind acts for family members',
        rules: [
          'Plan 3 kind acts for parents',
          'Do them secretly during the week',
          'Reveal at weekly family meeting'
        ],
        reward: 'Kindness Heroes Award'
      }
    ]
  };

  useEffect(() => {
    loadChallengeData();
  }, [currentFamily]);

  const loadChallengeData = async () => {
    // Load completed challenges and points from database
    // For now using mock data
    const mockPoints = {};
    currentFamily?.children?.forEach(child => {
      mockPoints[child.id] = Math.floor(Math.random() * 100);
    });
    setSiblingPoints(mockPoints);
  };

  const startChallenge = (challenge) => {
    setActiveChallenge({
      ...challenge,
      startTime: Date.now(),
      participants: currentFamily.children.map(c => c.id)
    });
  };

  const completeChallenge = async () => {
    if (!activeChallenge) return;

    // Award points to all participants
    const updatedPoints = { ...siblingPoints };
    activeChallenge.participants.forEach(childId => {
      updatedPoints[childId] = (updatedPoints[childId] || 0) + activeChallenge.points;
    });
    setSiblingPoints(updatedPoints);

    // Record in database
    await SiblingDynamicsService.recordSiblingCollaboration(
      currentFamily.id,
      activeChallenge.participants,
      `Completed challenge: ${activeChallenge.name}`,
      {
        challengeId: activeChallenge.id,
        points: activeChallenge.points,
        duration: Date.now() - activeChallenge.startTime,
        completed: true
      }
    );

    // Update completed challenges
    setCompletedChallenges([...completedChallenges, activeChallenge.id]);
    setActiveChallenge(null);

    // Show celebration
    celebrate();
  };

  const celebrate = () => {
    // In real app, this would trigger a celebration animation
    console.log('🎉 Challenge completed! Great teamwork!');
  };

  const getChallengesByCategory = () => {
    if (selectedCategory === 'all') {
      return [...challenges.quick, ...challenges.daily, ...challenges.weekly];
    }
    
    const allChallenges = [...challenges.quick, ...challenges.daily, ...challenges.weekly, ...challenges.special];
    return allChallenges.filter(c => c.category === selectedCategory);
  };

  const getTotalPoints = () => {
    return Object.values(siblingPoints).reduce((sum, points) => sum + points, 0);
  };

  if (!currentFamily?.children?.length || currentFamily.children.length < 2) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sibling Challenges</h3>
          <p className="text-gray-600">
            Add multiple children to unlock fun sibling challenges!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Sibling Team Challenges
            </h2>
            <p className="text-gray-600">Work together, earn points, have fun!</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{getTotalPoints()}</div>
            <p className="text-sm text-gray-600">Team Points</p>
          </div>
        </div>

        {/* Individual Points */}
        <div className="flex gap-4 mt-4">
          {currentFamily.children.map(child => (
            <div key={child.id} className="bg-white/70 rounded-lg px-4 py-2">
              <p className="text-sm font-medium">{child.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{siblingPoints[child.id] || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Challenge */}
      {activeChallenge && (
        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <activeChallenge.icon className="w-5 h-5" />
              Active Challenge: {activeChallenge.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{activeChallenge.description}</p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Rules:</h4>
              <ul className="space-y-1">
                {activeChallenge.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className="bg-yellow-100 text-yellow-700">
                  {activeChallenge.points} points
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">
                  {activeChallenge.duration}
                </Badge>
              </div>
              <Button 
                onClick={completeChallenge}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Challenge! 🎉
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'physical', 'creative', 'academic', 'emotional', 'learning'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Challenge Categories */}
      {!activeChallenge && (
        <>
          {/* Quick Challenges */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Challenges (5-10 minutes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {challenges.quick
                .filter(c => selectedCategory === 'all' || c.category === selectedCategory)
                .map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completed={completedChallenges.includes(challenge.id)}
                    onStart={() => startChallenge(challenge)}
                  />
                ))}
            </div>
          </div>

          {/* Daily Challenges */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Daily Challenges (15-30 minutes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {challenges.daily
                .filter(c => selectedCategory === 'all' || c.category === selectedCategory)
                .map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completed={completedChallenges.includes(challenge.id)}
                    onStart={() => startChallenge(challenge)}
                  />
                ))}
            </div>
          </div>

          {/* Weekly Challenges */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              Weekly Challenges (45+ minutes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {challenges.weekly
                .filter(c => selectedCategory === 'all' || c.category === selectedCategory)
                .map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    completed={completedChallenges.includes(challenge.id)}
                    onStart={() => startChallenge(challenge)}
                  />
                ))}
            </div>
          </div>
        </>
      )}

      {/* Rewards Section */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Sibling Team Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RewardMilestone 
              points={100} 
              reward="Movie Night Choice" 
              current={getTotalPoints()}
            />
            <RewardMilestone 
              points={250} 
              reward="Special Outing" 
              current={getTotalPoints()}
            />
            <RewardMilestone 
              points={500} 
              reward="Sibling Sleepover" 
              current={getTotalPoints()}
            />
            <RewardMilestone 
              points={1000} 
              reward="Dream Day Together" 
              current={getTotalPoints()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Challenge Card Component
const ChallengeCard = ({ challenge, completed, onStart }) => {
  const Icon = challenge.icon;
  
  return (
    <Card className={`hover:shadow-md transition-all ${completed ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Icon className="w-8 h-8 text-purple-600" />
          <Badge className="bg-yellow-100 text-yellow-700">
            {challenge.points} pts
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{challenge.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{challenge.duration}</span>
          {completed ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Done!
            </Badge>
          ) : (
            <Button size="sm" onClick={onStart}>
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Reward Milestone Component
const RewardMilestone = ({ points, reward, current }) => {
  const progress = Math.min((current / points) * 100, 100);
  const unlocked = current >= points;
  
  return (
    <div className={`text-center ${unlocked ? 'opacity-100' : 'opacity-60'}`}>
      <div className="relative mb-2">
        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
          {unlocked ? (
            <Trophy className="w-8 h-8 text-yellow-500" />
          ) : (
            <Flag className="w-8 h-8 text-gray-400" />
          )}
        </div>
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-yellow-300"
                strokeDasharray={`${progress * 1.76} 176`}
              />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm font-medium">{points} pts</p>
      <p className="text-xs text-gray-600">{reward}</p>
    </div>
  );
};

export default SiblingChallenges;