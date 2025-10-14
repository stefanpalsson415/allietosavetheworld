/**
 * Kid Dashboard
 *
 * Age-appropriate view of family balance for children
 * Makes invisible work visible to kids in a way they can understand
 *
 * Philosophy: "Children as partners in transformation"
 * - Kids observe and replicate patterns
 * - Make cognitive load distribution explicit
 * - Teach equity through participation
 * - Children provide feedback and hold parents accountable
 *
 * Research basis: Intergenerational transmission of partnership patterns
 * Impact: Kids who see equitable load sharing replicate it as adults
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Star, Users, Trophy, Eye, Lightbulb,
  ThumbsUp, MessageCircle, HelpCircle, Smile,
  TrendingUp, Award, Sparkles, Target, Book
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useAuth } from '../../contexts/AuthContext';

const KidDashboard = () => {
  const { familyMembers, surveyResponses } = useFamily();
  const { currentUserProfile } = useAuth();
  const { openDrawer } = useChatDrawer();

  const [balanceScore, setBalanceScore] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [kidsObservations, setKidsObservations] = useState([]);

  // Check if current user is a kid
  const isKid = currentUserProfile && !currentUserProfile.isParent;
  const kidName = currentUserProfile?.name || 'Friend';
  const kidAge = currentUserProfile?.age || 8;

  // Get parents for visualization
  const parents = familyMembers?.filter(m => m.role === 'parent') || [];
  const parent1 = parents[0]; // Usually primary parent
  const parent2 = parents[1]; // Usually secondary parent

  useEffect(() => {
    if (surveyResponses && Object.keys(surveyResponses).length > 0) {
      calculateKidFriendlyBalance();
    }
  }, [surveyResponses]);

  /**
   * Calculate balance in kid-friendly terms
   */
  const calculateKidFriendlyBalance = () => {
    let parent1Tasks = 0;
    let parent2Tasks = 0;
    let bothTasks = 0;

    Object.values(surveyResponses).forEach(answer => {
      const normalized = answer.toString().toLowerCase().trim();
      if (normalized.includes('mama') || normalized.includes('mother') || normalized.includes('mom')) {
        parent1Tasks++;
      } else if (normalized.includes('papa') || normalized.includes('father') || normalized.includes('dad')) {
        parent2Tasks++;
      } else if (normalized.includes('both')) {
        bothTasks++;
      }
    });

    const total = parent1Tasks + parent2Tasks + bothTasks;
    const parent1Percentage = Math.round((parent1Tasks / total) * 100);
    const parent2Percentage = Math.round((parent2Tasks / total) * 100);
    const bothPercentage = Math.round((bothTasks / total) * 100);

    // Kid-friendly assessment
    let fairnessLevel, emoji, message;

    const difference = Math.abs(parent1Percentage - parent2Percentage);

    if (difference <= 20 && bothPercentage >= 20) {
      fairnessLevel = 'Super Fair!';
      emoji = '🌟';
      message = `${parent1?.name} and ${parent2?.name} share the family work really well together!`;
    } else if (difference <= 30) {
      fairnessLevel = 'Pretty Fair';
      emoji = '👍';
      message = `${parent1?.name} and ${parent2?.name} are working on sharing things more evenly.`;
    } else if (difference <= 45) {
      fairnessLevel = 'Getting Better';
      emoji = '💪';
      message = `${parent1?.name} does more right now, but the family is working to balance it out.`;
    } else {
      fairnessLevel = 'Working On It';
      emoji = '🔧';
      message = `Right now ${parent1?.name} does a lot more, but everyone's trying to make it fairer!`;
    }

    setBalanceScore({
      parent1: { name: parent1?.name || 'Parent 1', percentage: parent1Percentage },
      parent2: { name: parent2?.name || 'Parent 2', percentage: parent2Percentage },
      both: bothPercentage,
      fairnessLevel,
      emoji,
      message,
      difference
    });
  };

  /**
   * Get age-appropriate explanation text
   */
  const getAgeAppropriateText = () => {
    if (kidAge <= 6) {
      return {
        title: "How Your Family Works Together",
        explanation: `In every family, there are lots of jobs to do - like cooking dinner, helping with homework, driving to activities, and much more! This shows how ${parent1?.name} and ${parent2?.name} share all these jobs.`
      };
    } else if (kidAge <= 10) {
      return {
        title: "Understanding Family Teamwork",
        explanation: `Every family has tons of tasks - some visible (like cooking) and some invisible (like remembering appointments). This dashboard shows how fairly your parents share all the family work. When it's balanced, everyone feels happier!`
      };
    } else {
      return {
        title: "Family Balance & Mental Load",
        explanation: `This shows the distribution of cognitive load in your family. Mental load includes planning, organizing, remembering, and coordinating - not just physical tasks. Research shows that when one parent carries most of this invisible work, it creates stress and relationship strain. You're seeing transparency that most families don't have!`
      };
    }
  };

  const ageText = getAgeAppropriateText();

  // Example observations kids can learn from
  const exampleObservations = [
    {
      emoji: '🍳',
      task: 'Making Breakfast',
      observation: `I noticed ${parent1?.name} makes breakfast most mornings`,
      learning: 'In fair families, parents take turns with daily tasks'
    },
    {
      emoji: '🚗',
      task: 'Driving to Activities',
      observation: `${parent2?.name} drives me to practice a lot`,
      learning: 'Transportation is a big job that should be shared'
    },
    {
      emoji: '📚',
      task: 'Homework Help',
      observation: 'Sometimes both parents help with homework',
      learning: 'When both parents are involved, kids feel supported'
    },
    {
      emoji: '🧹',
      task: 'Cleaning Up',
      observation: 'I see the whole family cleaning together on weekends',
      learning: 'Everyone in the family can help, not just parents!'
    }
  ];

  if (!balanceScore) {
    return (
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8 text-center">
        <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Your Family's Balance Dashboard
        </h3>
        <p className="text-gray-700">
          We're gathering information about how your family works together. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Hey {kidName}! 👋
            </h2>
            <p className="text-purple-100">
              Welcome to your family's balance dashboard
            </p>
          </div>
          <Award className="w-16 h-16 text-white opacity-50" />
        </div>
      </motion.div>

      {/* What This Is About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200"
      >
        <div className="flex items-start">
          <Lightbulb className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {ageText.title}
            </h3>
            <p className="text-gray-700 mb-4">
              {ageText.explanation}
            </p>

            {!showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Learn More
              </button>
            )}

            {showExplanation && kidAge >= 10 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-blue-50 rounded-lg"
              >
                <h4 className="font-semibold text-blue-900 mb-2">Why This Matters</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    • <strong>You're learning about equity:</strong> Seeing how work is shared teaches you what healthy partnerships look like.
                  </p>
                  <p>
                    • <strong>Your voice matters:</strong> Kids who notice imbalances can help families become more fair.
                  </p>
                  <p>
                    • <strong>Breaking cycles:</strong> When you grow up seeing balanced partnerships, you'll create them too.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Balance Scorecard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{balanceScore.emoji}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {balanceScore.fairnessLevel}
          </h3>
          <p className="text-gray-700">
            {balanceScore.message}
          </p>
        </div>

        {/* Visual Balance Bar */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-900">{balanceScore.parent1.name}</span>
              <span className="text-2xl font-bold text-purple-600">
                {balanceScore.parent1.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${balanceScore.parent1.percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-900">{balanceScore.parent2.name}</span>
              <span className="text-2xl font-bold text-blue-600">
                {balanceScore.parent2.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${balanceScore.parent2.percentage}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full"
              />
            </div>
          </div>

          {balanceScore.both > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">Both Together</span>
                <span className="text-2xl font-bold text-green-600">
                  {balanceScore.both}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${balanceScore.both}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* What Can YOU Notice? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center mb-4">
          <Eye className="w-6 h-6 text-purple-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">
            What Do YOU Notice?
          </h3>
        </div>

        <p className="text-gray-700 mb-4">
          You see your family every day. What do you notice about who does what?
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {exampleObservations.map((obs, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200"
            >
              <div className="text-3xl mb-2">{obs.emoji}</div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                {obs.task}
              </h4>
              <p className="text-xs text-gray-700 mb-2">
                "{obs.observation}"
              </p>
              <div className="bg-white rounded p-2 text-xs text-gray-600">
                💡 {obs.learning}
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => {
            openDrawer({
              initialMessage: `Hey Allie! I want to share what I've noticed about how my family shares work.`,
              context: {
                type: 'kid_observation',
                kidAge,
                balanceScore
              }
            });
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all inline-flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Share My Observations with Allie
        </button>
      </motion.div>

      {/* Fun Facts for Kids */}
      {kidAge >= 8 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center mb-4">
            <Book className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">
              Did You Know?
            </h3>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <Star className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
              <p>
                <strong>You're a scientist!</strong> By noticing who does what in your family,
                you're gathering data just like a scientist would. Your observations help make your family stronger.
              </p>
            </div>

            <div className="flex items-start">
              <Heart className="w-5 h-5 text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Families work best together.</strong> When everyone helps and shares the work fairly,
                families are happier and less stressed. You're learning what that looks like!
              </p>
            </div>

            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <p>
                <strong>You're building your future.</strong> The way you see your parents share work now
                is how you'll share work when you grow up. You're learning important life skills!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Encouragement Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl"
      >
        <Smile className="w-12 h-12 text-purple-600 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">
          Your family is working on being more balanced and fair.
          That's something to be proud of! 💜
        </p>
      </motion.div>
    </div>
  );
};

export default KidDashboard;
