import React, { useState, useMemo } from 'react';
import { 
  User, TrendingUp, Award, Target, Clock, 
  Star, ChevronRight, BarChart3, Calendar,
  Zap, Heart, Brain, CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { useFamily } from '../../contexts/FamilyContext';

const MemberJourneys = () => {
  const { familyMembers, taskRecommendations, weekHistory, surveyResponses, currentWeek } = useFamily();
  const [selectedMember, setSelectedMember] = useState(familyMembers?.[0]?.id || null);
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed

  // Calculate member stats
  const memberStats = useMemo(() => {
    const stats = {};
    
    if (Array.isArray(familyMembers)) {
      familyMembers.forEach(member => {
      const memberTasks = taskRecommendations?.filter(t => 
        t.assignedToName === member.name || t.assignedTo === member.roleType
      ) || [];
      
      const completedTasks = memberTasks.filter(t => t.completed);
      const totalWeight = memberTasks.reduce((sum, t) => sum + (t.weight || 1), 0);
      
      // Calculate growth score based on completed tasks over time
      const growthScore = completedTasks.length > 0 
        ? Math.min(100, 50 + (completedTasks.length * 10))
        : 50;
      
      // Calculate contribution types
      const contributions = {
        visible: memberTasks.filter(t => t.category?.includes('Visible')).length,
        invisible: memberTasks.filter(t => t.category?.includes('Invisible')).length,
        cognitive: memberTasks.filter(t => t.category?.includes('Cognitive')).length,
        household: memberTasks.filter(t => t.category?.includes('Household')).length
      };
      
      // Calculate streak days from actual task completion
      const calculateStreak = () => {
        if (completedTasks.length === 0) return 0;
        
        // Sort completed tasks by date
        const sortedTasks = completedTasks
          .filter(t => t.completedAt)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        
        if (sortedTasks.length === 0) return 0;
        
        // Count consecutive days
        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if most recent task was today or yesterday
        const lastTaskDate = new Date(sortedTasks[0].completedAt);
        lastTaskDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - lastTaskDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) return 0; // Streak broken
        
        // Count backwards from most recent task
        for (let i = 1; i < sortedTasks.length; i++) {
          const currentDate = new Date(sortedTasks[i].completedAt);
          currentDate.setHours(0, 0, 0, 0);
          const prevDate = new Date(sortedTasks[i-1].completedAt);
          prevDate.setHours(0, 0, 0, 0);
          
          const daysBetween = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
          if (daysBetween === 1) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak;
      };
      
      stats[member.id] = {
        name: member.name,
        role: member.role,
        tasksTotal: memberTasks.length,
        tasksCompleted: completedTasks.length,
        completionRate: memberTasks.length > 0 
          ? Math.round((completedTasks.length / memberTasks.length) * 100)
          : 0,
        workload: totalWeight,
        growthScore,
        contributions,
        streakDays: calculateStreak(),
        badges: generateBadges(completedTasks.length, growthScore)
      };
    });
    }
    
    return stats;
  }, [familyMembers, taskRecommendations]);

  // Generate badges based on achievements
  function generateBadges(tasksCompleted, growthScore) {
    const badges = [];
    
    if (tasksCompleted >= 5) badges.push({ name: 'Task Master', icon: CheckCircle, color: 'green' });
    if (growthScore >= 80) badges.push({ name: 'Growth Champion', icon: TrendingUp, color: 'blue' });
    if (tasksCompleted >= 10) badges.push({ name: 'Super Helper', icon: Star, color: 'yellow' });
    
    return badges;
  }

  // Get selected member data
  const selectedMemberData = selectedMember ? memberStats[selectedMember] : null;

  // Generate progress data for chart from actual week history
  const progressData = useMemo(() => {
    if (!selectedMemberData || !selectedMember) return [];
    
    const data = [];
    
    // Use weekHistory if available
    if (Array.isArray(weekHistory) && weekHistory.length > 0) {
      // Get last 4 weeks of data
      const recentWeeks = weekHistory.slice(-4);
      
      recentWeeks.forEach((week, index) => {
        // Find member-specific data in week history
        const memberData = week.memberProgress?.[selectedMember] || {};
        const tasksCompleted = memberData.tasksCompleted || 0;
        const growthScore = memberData.growthScore || 50 + (tasksCompleted * 5);
        
        data.push({
          week: `W${week.weekNumber || index + 1}`,
          tasks: tasksCompleted,
          growth: Math.min(100, growthScore)
        });
      });
    } else {
      // Fallback: estimate from current data
      const baseGrowth = 50;
      const tasksPerWeek = Math.max(1, Math.floor(selectedMemberData.tasksCompleted / 4));
      
      for (let i = 0; i < 4; i++) {
        data.push({
          week: `W${i + 1}`,
          tasks: Math.floor(tasksPerWeek * (0.7 + i * 0.1)),
          growth: Math.min(100, baseGrowth + (i * 10))
        });
      }
    }
    
    // Add current week
    data.push({
      week: `W${currentWeek || 'Current'}`,
      tasks: selectedMemberData.tasksCompleted,
      growth: selectedMemberData.growthScore
    });
    
    return data;
  }, [selectedMemberData, selectedMember, weekHistory, currentWeek]);

  // Contribution chart data
  const contributionData = useMemo(() => {
    if (!selectedMemberData) return [];
    
    return Object.entries(selectedMemberData.contributions).map(([type, count]) => ({
      category: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      fullMark: Math.max(...Object.values(selectedMemberData.contributions))
    }));
  }, [selectedMemberData]);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            Member Journeys
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track individual progress and contributions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'overview' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'detailed' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        /* Overview Mode */
        <div className="space-y-4">
          {Array.isArray(familyMembers) && familyMembers.map(member => {
            const stats = memberStats[member.id];
            if (!stats) return null;
            
            return (
              <div
                key={member.id}
                onClick={() => {
                  setSelectedMember(member.id);
                  setViewMode('detailed');
                }}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                      <p className="text-xs text-gray-500">Completion</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.tasksCompleted}</p>
                      <p className="text-xs text-gray-500">Tasks Done</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Zap size={16} className="text-yellow-500" />
                        <p className="text-lg font-bold text-gray-900">{stats.streakDays}</p>
                      </div>
                      <p className="text-xs text-gray-500">Day Streak</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.growthScore}%` }}
                  />
                </div>
                
                {/* Badges */}
                {stats.badges.length > 0 && (
                  <div className="mt-3 flex items-center space-x-2">
                    {stats.badges.slice(0, 3).map((badge, idx) => {
                      const Icon = badge.icon;
                      return (
                        <div
                          key={idx}
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 bg-${badge.color}-100 text-${badge.color}-700`}
                        >
                          <Icon size={12} />
                          <span>{badge.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed View */
        <div className="space-y-6">
          {/* Member selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {Array.isArray(familyMembers) && familyMembers.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                  selectedMember === member.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{member.name}</span>
              </button>
            ))}
          </div>

          {selectedMemberData && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle size={20} className="text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Tasks</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMemberData.tasksCompleted}/{selectedMemberData.tasksTotal}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Completed this week</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp size={20} className="text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Growth</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMemberData.growthScore}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Progress score</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Zap size={20} className="text-yellow-600" />
                    <span className="text-sm text-yellow-600 font-medium">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMemberData.streakDays} days
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Current streak</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Award size={20} className="text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Badges</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMemberData.badges.length}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Earned badges</p>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Weekly Progress</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Tasks Completed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="growth" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Growth Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Contribution Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Task Categories</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contributionData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Achievements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedMemberData.badges.map((badge, idx) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-gray-200 flex items-center space-x-3"
                      >
                        <div className={`p-2 rounded-lg bg-${badge.color}-100`}>
                          <Icon size={24} className={`text-${badge.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{badge.name}</p>
                          <p className="text-xs text-gray-500">Earned this week</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberJourneys;