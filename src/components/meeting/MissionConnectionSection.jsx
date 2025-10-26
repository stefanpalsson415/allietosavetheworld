// src/components/meeting/MissionConnectionSection.jsx
import React from 'react';
import { Target, Heart, TrendingUp, Users, Sparkles, CheckCircle } from 'lucide-react';

/**
 * Mission Connection Section
 * Connects weekly family progress to core values and mission
 * Shows alignment between actions and stated family priorities
 */
const MissionConnectionSection = ({
  balanceScoreChange = 0,
  fairPlayCards = [],
  familyValues = [],
  taskDistribution = {},
  eventRoles = [],
  previousGoals = [],
  currentWeek = 1
}) => {
  // Default family values if not set
  const defaultValues = [
    { id: 'equal_partnership', name: 'Equal Partnership', icon: '🤝', description: 'Sharing responsibilities fairly' },
    { id: 'quality_time', name: 'Quality Time', icon: '⏰', description: 'Prioritizing family connection' },
    { id: 'growth_mindset', name: 'Growth Mindset', icon: '🌱', description: 'Learning and improving together' }
  ];

  const values = familyValues.length > 0 ? familyValues : defaultValues;

  // Calculate how well family is living their values
  const valueAlignment = values.map(value => {
    let alignmentScore = 50; // Start at neutral
    const evidence = [];

    switch (value.id) {
      case 'equal_partnership':
        // Check task distribution
        const { parent1Count = 0, parent2Count = 0 } = taskDistribution;
        const total = parent1Count + parent2Count;
        const ratio = total > 0 ? Math.min(parent1Count, parent2Count) / total : 0;

        if (ratio >= 0.45) {
          alignmentScore = 90;
          evidence.push(`Task distribution is ${Math.round(ratio * 100)}% balanced this week`);
        } else if (ratio >= 0.35) {
          alignmentScore = 70;
          evidence.push(`Task distribution improving: ${Math.round(ratio * 100)}% balance`);
        } else {
          alignmentScore = 40;
          evidence.push(`Task distribution needs work: ${Math.round(ratio * 100)}% balance`);
        }

        // Check Fair Play card redistribution
        const redistributedThisWeek = fairPlayCards.filter(
          card => card.redistributedAt === currentWeek
        ).length;

        if (redistributedThisWeek > 0) {
          alignmentScore += 10;
          evidence.push(`Redistributed ${redistributedThisWeek} Fair Play card${redistributedThisWeek > 1 ? 's' : ''} this week`);
        }

        // Check event role distribution
        if (eventRoles && eventRoles.length > 0) {
          const roleDistribution = calculateEventRoleDistribution(eventRoles);
          if (roleDistribution.balance >= 0.4) {
            alignmentScore += 10;
            evidence.push(`Event roles shared fairly (${Math.round(roleDistribution.balance * 100)}% balance)`);
          }
        }

        break;

      case 'quality_time':
        // Check for family events/activities
        const familyEventsCount = eventRoles.filter(e => e.category === 'family_event').length;

        if (familyEventsCount >= 3) {
          alignmentScore = 85;
          evidence.push(`${familyEventsCount} family activities scheduled this week`);
        } else if (familyEventsCount >= 1) {
          alignmentScore = 70;
          evidence.push(`${familyEventsCount} family activity this week`);
        } else {
          alignmentScore = 30;
          evidence.push(`No dedicated family time scheduled`);
        }

        // Check balance score (higher balance = more time for connection)
        if (balanceScoreChange > 10) {
          alignmentScore += 15;
          evidence.push(`Balance improved by ${Math.round(balanceScoreChange)} points - more time freed up`);
        }

        break;

      case 'growth_mindset':
        // Check goal completion
        const completedGoals = previousGoals.filter(g => g.status === 'completed').length;
        const totalGoals = previousGoals.length;

        if (totalGoals > 0) {
          const completionRate = completedGoals / totalGoals;

          if (completionRate >= 0.8) {
            alignmentScore = 90;
            evidence.push(`Achieved ${completedGoals}/${totalGoals} goals from last week`);
          } else if (completionRate >= 0.5) {
            alignmentScore = 70;
            evidence.push(`Made progress: ${completedGoals}/${totalGoals} goals completed`);
          } else {
            alignmentScore = 50;
            evidence.push(`${completedGoals}/${totalGoals} goals completed - room to grow`);
          }
        }

        // Check balance improvement
        if (balanceScoreChange > 5) {
          alignmentScore += 10;
          evidence.push(`Family balance improved ${Math.round(balanceScoreChange)} points - growing together!`);
        }

        break;

      default:
        // Generic value alignment based on overall progress
        alignmentScore = 60;
        evidence.push('Tracking progress on this value');
    }

    return {
      ...value,
      alignmentScore: Math.min(100, alignmentScore),
      evidence
    };
  });

  // Calculate overall mission alignment
  const overallAlignment = valueAlignment.reduce((sum, v) => sum + v.alignmentScore, 0) / valueAlignment.length;

  // Determine alignment level
  let alignmentLevel = 'aligned';
  let alignmentColor = 'green';
  let alignmentMessage = 'Your family is living its values!';

  if (overallAlignment >= 85) {
    alignmentLevel = 'highly_aligned';
    alignmentColor = 'green';
    alignmentMessage = 'Your family is HIGHLY aligned with its values! This is exceptional.';
  } else if (overallAlignment >= 70) {
    alignmentLevel = 'aligned';
    alignmentColor = 'blue';
    alignmentMessage = 'Your family is living its values consistently.';
  } else if (overallAlignment >= 55) {
    alignmentLevel = 'somewhat_aligned';
    alignmentColor = 'yellow';
    alignmentMessage = 'Your family has room to better align actions with values.';
  } else {
    alignmentLevel = 'misaligned';
    alignmentColor = 'red';
    alignmentMessage = 'Your family\'s actions don\'t yet reflect stated values. Let\'s discuss what needs to change.';
  }

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Target className="w-8 h-8 text-indigo-600 mr-2" />
          Our Family's Why
        </h2>
        <p className="text-gray-600 mt-1">
          Connecting this week's progress to what matters most
        </p>
      </div>

      {/* Overall Alignment Score */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Mission Alignment</h3>
          <div className={`text-2xl font-bold ${
            alignmentColor === 'green' ? 'text-green-600' :
            alignmentColor === 'blue' ? 'text-blue-600' :
            alignmentColor === 'yellow' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {Math.round(overallAlignment)}%
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              alignmentColor === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              alignmentColor === 'blue' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              alignmentColor === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${overallAlignment}%` }}
          />
        </div>

        <p className={`text-sm font-medium ${
          alignmentColor === 'green' ? 'text-green-700' :
          alignmentColor === 'blue' ? 'text-blue-700' :
          alignmentColor === 'yellow' ? 'text-yellow-700' :
          'text-red-700'
        }`}>
          {alignmentMessage}
        </p>
      </div>

      {/* Individual Values */}
      <div className="space-y-4">
        {valueAlignment.map((value, index) => (
          <div
            key={value.id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start flex-1">
                <div className="text-3xl mr-3">{value.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 flex items-center">
                    {value.name}
                    {value.alignmentScore >= 80 && (
                      <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{value.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  value.alignmentScore >= 80 ? 'text-green-600' :
                  value.alignmentScore >= 60 ? 'text-blue-600' :
                  value.alignmentScore >= 40 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {Math.round(value.alignmentScore)}%
                </div>
                <p className="text-xs text-gray-500">aligned</p>
              </div>
            </div>

            {/* Evidence */}
            {value.evidence.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">This Week's Evidence:</p>
                <ul className="space-y-1">
                  {value.evidence.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start">
                      <Sparkles className="w-4 h-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    value.alignmentScore >= 80 ? 'bg-green-500' :
                    value.alignmentScore >= 60 ? 'bg-blue-500' :
                    value.alignmentScore >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${value.alignmentScore}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fair Play Progress */}
      {fairPlayCards.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            Fair Play Progress
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Cards</span>
              <span className="font-bold text-purple-600">{fairPlayCards.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Redistributed</span>
              <span className="font-bold text-blue-600">
                {fairPlayCards.filter(c => c.redistributedAt).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Equity Progress</span>
              <span className="font-bold text-green-600">
                {Math.round((fairPlayCards.filter(c => c.redistributedAt).length / fairPlayCards.length) * 100)}%
              </span>
            </div>
          </div>

          {fairPlayCards.filter(c => c.redistributedAt === currentWeek).length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-sm font-medium text-purple-700 mb-2">
                🎉 Redistributed This Week:
              </p>
              <ul className="space-y-1">
                {fairPlayCards
                  .filter(c => c.redistributedAt === currentWeek)
                  .map((card, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {card.cardName}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cognitive Load Reduction Tracker */}
      {balanceScoreChange !== 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            Balance Impact
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">This Week's Change</span>
            <span className={`text-2xl font-bold ${
              balanceScoreChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {balanceScoreChange > 0 ? '+' : ''}{Math.round(balanceScoreChange)} points
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {balanceScoreChange > 10
              ? `Excellent progress! This represents a significant reduction in mental load imbalance.`
              : balanceScoreChange > 0
              ? `Steady improvement. Keep building on this momentum.`
              : balanceScoreChange < -10
              ? `Balance has declined this week. Let's identify what changed and course-correct.`
              : `Balance dipped slightly. Consider what contributed to this.`}
          </p>
        </div>
      )}

      {/* Kids' Values Questions */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <Heart className="w-5 h-5 text-red-500 mr-2" />
          Kids' Corner
        </h3>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            💬 "What did you notice about how we worked as a team this week?"
          </p>
          <p className="text-sm font-medium text-gray-700">
            💬 "What family value did you see us living?"
          </p>
          <p className="text-sm font-medium text-gray-700">
            💬 "What would make our family even better next week?"
          </p>
        </div>
        <p className="text-xs text-gray-600 mt-3 italic">
          These questions help kids understand and internalize family values
        </p>
      </div>
    </div>
  );
};

// Helper function
const calculateEventRoleDistribution = (eventRoles) => {
  if (!eventRoles || eventRoles.length === 0) return { balance: 0 };

  const roleCounts = {};
  eventRoles.forEach(event => {
    if (event.roles) {
      Object.values(event.roles).forEach(person => {
        roleCounts[person] = (roleCounts[person] || 0) + 1;
      });
    }
  });

  const counts = Object.values(roleCounts);
  if (counts.length === 0) return { balance: 0 };

  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const total = counts.reduce((sum, c) => sum + c, 0);

  return {
    balance: total > 0 ? min / total : 0,
    counts: roleCounts
  };
};

export default MissionConnectionSection;
