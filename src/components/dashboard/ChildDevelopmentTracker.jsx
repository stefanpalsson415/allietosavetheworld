import React, { useState, useMemo } from 'react';
import { 
  Baby, Rocket, Target, Star, BookOpen, Heart,
  Brain, Users, Palette, Music, Trophy, TrendingUp,
  Calendar, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { useFamily } from '../../contexts/FamilyContext';

const ChildDevelopmentTracker = () => {
  const { familyMembers, surveyResponses, taskRecommendations, weekHistory } = useFamily();
  const children = useMemo(() => 
    Array.isArray(familyMembers) ? familyMembers.filter(m => m.role === 'child') : []
  , [familyMembers]);
  const [selectedChild, setSelectedChild] = useState(children[0]?.id || null);
  const [viewType, setViewType] = useState('overview'); // overview, milestones, activities

  // Development areas
  const developmentAreas = [
    { id: 'cognitive', label: 'Cognitive', icon: Brain, color: 'purple' },
    { id: 'social', label: 'Social', icon: Users, color: 'blue' },
    { id: 'creative', label: 'Creative', icon: Palette, color: 'pink' },
    { id: 'physical', label: 'Physical', icon: Rocket, color: 'green' },
    { id: 'emotional', label: 'Emotional', icon: Heart, color: 'red' },
    { id: 'academic', label: 'Academic', icon: BookOpen, color: 'indigo' }
  ];

  // Calculate development scores for each child
  const childDevelopmentData = useMemo(() => {
    const data = {};
    
    children.forEach(child => {
      // Get child-specific tasks and survey responses
      const childTasks = taskRecommendations?.filter(t => 
        t.assignedToName === child.name || t.forChild === child.id
      ) || [];
      
      const childSurvey = Array.isArray(surveyResponses) 
        ? surveyResponses.find(r => r.respondentName === child.name)
        : null;
      
      // Calculate development scores from actual task completion and survey data
      const calculateDevelopmentScores = () => {
        const baseScore = 70; // Starting baseline
        
        // Initialize scores
        const scores = {
          cognitive: baseScore,
          social: baseScore,
          creative: baseScore,
          physical: baseScore,
          emotional: baseScore,
          academic: baseScore
        };
        
        // Boost scores based on completed tasks
        childTasks.forEach(task => {
          if (task.completed) {
            // Map task categories to development areas
            if (task.category?.includes('Academic') || task.category?.includes('Homework')) {
              scores.academic = Math.min(100, scores.academic + 3);
              scores.cognitive = Math.min(100, scores.cognitive + 2);
            }
            if (task.category?.includes('Social') || task.category?.includes('Friend')) {
              scores.social = Math.min(100, scores.social + 4);
              scores.emotional = Math.min(100, scores.emotional + 2);
            }
            if (task.category?.includes('Creative') || task.category?.includes('Art')) {
              scores.creative = Math.min(100, scores.creative + 4);
            }
            if (task.category?.includes('Physical') || task.category?.includes('Sport')) {
              scores.physical = Math.min(100, scores.physical + 4);
            }
            if (task.category?.includes('Cognitive') || task.category?.includes('Problem')) {
              scores.cognitive = Math.min(100, scores.cognitive + 4);
            }
            if (task.category?.includes('Emotional') || task.category?.includes('Feeling')) {
              scores.emotional = Math.min(100, scores.emotional + 4);
            }
          }
        });
        
        // Adjust based on survey responses if available
        if (childSurvey && childSurvey.responses) {
          // Look for child-specific questions in survey
          Object.entries(childSurvey.responses).forEach(([question, answer]) => {
            if (question.includes('school') || question.includes('homework')) {
              scores.academic = Math.min(100, scores.academic + 2);
            }
            if (question.includes('friend') || question.includes('play')) {
              scores.social = Math.min(100, scores.social + 2);
            }
          });
        }
        
        // Ensure minimum variance for visual appeal
        Object.keys(scores).forEach(key => {
          scores[key] = Math.max(65, Math.min(95, scores[key]));
        });
        
        return scores;
      };
      
      const scores = calculateDevelopmentScores();
      
      // Generate milestones
      const milestones = generateMilestones(child, scores);
      
      // Generate recommended activities
      const activities = generateActivities(scores);
      
      data[child.id] = {
        name: child.name,
        age: child.age || calculateAge(child.dateOfBirth),
        scores,
        milestones,
        activities,
        overallProgress: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6)
      };
    });
    
    return data;
  }, [children, taskRecommendations, surveyResponses]);

  // Generate age-appropriate milestones
  function generateMilestones(child, scores) {
    const age = child.age || 8; // Default age for demo
    const milestones = [];
    
    if (age >= 6 && age <= 8) {
      milestones.push(
        { id: 1, title: 'Reading Independently', completed: scores.academic > 80, area: 'academic' },
        { id: 2, title: 'Making Friends', completed: scores.social > 75, area: 'social' },
        { id: 3, title: 'Creative Expression', completed: scores.creative > 70, area: 'creative' }
      );
    } else if (age >= 9 && age <= 12) {
      milestones.push(
        { id: 1, title: 'Problem Solving Skills', completed: scores.cognitive > 80, area: 'cognitive' },
        { id: 2, title: 'Team Collaboration', completed: scores.social > 85, area: 'social' },
        { id: 3, title: 'Physical Coordination', completed: scores.physical > 75, area: 'physical' }
      );
    }
    
    return milestones;
  }

  // Generate recommended activities based on scores
  function generateActivities(scores) {
    const activities = [];
    
    // Find areas that need improvement
    Object.entries(scores).forEach(([area, score]) => {
      if (score < 80) {
        switch(area) {
          case 'cognitive':
            activities.push({ 
              title: 'Puzzle Time', 
              description: 'Work on age-appropriate puzzles together',
              duration: '30 mins',
              area 
            });
            break;
          case 'social':
            activities.push({ 
              title: 'Playdate Planning', 
              description: 'Organize a playdate with friends',
              duration: '2 hours',
              area 
            });
            break;
          case 'creative':
            activities.push({ 
              title: 'Art Project', 
              description: 'Create a family art project together',
              duration: '1 hour',
              area 
            });
            break;
          case 'physical':
            activities.push({ 
              title: 'Outdoor Adventure', 
              description: 'Go for a bike ride or nature walk',
              duration: '45 mins',
              area 
            });
            break;
          case 'emotional':
            activities.push({ 
              title: 'Feelings Journal', 
              description: 'Help them express emotions through writing',
              duration: '20 mins',
              area 
            });
            break;
          case 'academic':
            activities.push({ 
              title: 'Reading Together', 
              description: 'Read a chapter book together',
              duration: '30 mins',
              area 
            });
            break;
        }
      }
    });
    
    return activities.slice(0, 3); // Return top 3 activities
  }

  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 8; // Default age
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const selectedChildData = selectedChild ? childDevelopmentData[selectedChild] : null;

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!selectedChildData) return [];
    
    return developmentAreas.map(area => ({
      area: area.label,
      score: selectedChildData.scores[area.id],
      fullMark: 100
    }));
  }, [selectedChildData, developmentAreas]);

  // Progress over time from actual week history
  const progressData = useMemo(() => {
    if (!selectedChildData || !selectedChild) {
      return [{ month: 'Current', overall: selectedChildData?.overallProgress || 75 }];
    }
    
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    if (Array.isArray(weekHistory) && weekHistory.length > 0) {
      // Group weeks by month
      const monthlyData = {};
      
      weekHistory.forEach(week => {
        if (week.date) {
          const weekDate = new Date(week.date);
          const monthIndex = weekDate.getMonth();
          const monthName = months[monthIndex];
          
          // Find child-specific progress in week data
          const childProgress = week.childProgress?.[selectedChild];
          if (childProgress && childProgress.overallScore) {
            if (!monthlyData[monthName]) {
              monthlyData[monthName] = [];
            }
            monthlyData[monthName].push(childProgress.overallScore);
          }
        }
      });
      
      // Calculate monthly averages
      const sortedMonths = Object.keys(monthlyData).sort((a, b) => 
        months.indexOf(a) - months.indexOf(b)
      );
      
      sortedMonths.slice(-5).forEach(month => {
        const scores = monthlyData[month];
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        data.push({ month, overall: avgScore });
      });
    }
    
    // If no historical data, create estimated progression
    if (data.length === 0) {
      const currentScore = selectedChildData.overallProgress;
      const startScore = Math.max(65, currentScore - 20);
      const increment = (currentScore - startScore) / 4;
      
      for (let i = 4; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        data.push({
          month: months[monthIndex].slice(0, 3),
          overall: Math.round(startScore + (4 - i) * increment)
        });
      }
    }
    
    // Ensure current month is included
    const currentMonthShort = months[currentMonth].slice(0, 3);
    if (!data.find(d => d.month === currentMonthShort)) {
      data.push({ month: currentMonthShort, overall: selectedChildData.overallProgress });
    }
    
    return data;
  }, [selectedChildData, selectedChild, weekHistory]);

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center py-8">
          <Baby size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No children in the family yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Baby className="mr-2 text-pink-600" size={20} />
            Child Development
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track growth across key developmental areas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {['overview', 'milestones', 'activities'].map(type => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                viewType === type 
                  ? 'bg-pink-100 text-pink-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Child Selector */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
        {children.map(child => {
          const data = childDevelopmentData[child.id];
          return (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                selectedChild === child.id
                  ? 'bg-pink-100 text-pink-700 border border-pink-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {child.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <span className="font-medium">{child.name}</span>
                <p className="text-xs opacity-75">Age {data?.age || '?'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{data?.overallProgress || 0}%</p>
                <p className="text-xs">Overall</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedChildData && (
        <>
          {viewType === 'overview' && (
            <div className="space-y-6">
              {/* Development Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Development Areas</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <PolarAngleAxis 
                          dataKey="area" 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]}
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                        />
                        <Radar 
                          name="Score" 
                          dataKey="score" 
                          stroke="#ec4899" 
                          fill="#ec4899" 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Progress Over Time</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis domain={[60, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="overall" 
                          stroke="#ec4899" 
                          strokeWidth={2}
                          dot={{ fill: '#ec4899', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Area Breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {developmentAreas.map(area => {
                  const Icon = area.icon;
                  const score = selectedChildData.scores[area.id];
                  
                  return (
                    <div key={area.id} className="p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={18} className={`text-${area.color}-600`} />
                        <span className="text-lg font-bold text-gray-900">{score}%</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{area.label}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${area.color}-500 rounded-full transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewType === 'milestones' && (
            <div className="space-y-4">
              <div className="bg-pink-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy size={20} className="text-pink-600" />
                  <h4 className="font-medium text-pink-900">
                    Age-Appropriate Milestones
                  </h4>
                </div>
                <p className="text-sm text-pink-700 mt-1">
                  Track important developmental achievements for {selectedChildData.name}
                </p>
              </div>

              {selectedChildData.milestones.map(milestone => {
                const area = developmentAreas.find(a => a.id === milestone.area);
                const Icon = area?.icon || Star;
                
                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border transition-all ${
                      milestone.completed 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon size={20} className={
                            milestone.completed ? 'text-green-600' : 'text-gray-600'
                          } />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                          <p className="text-sm text-gray-600">{area?.label} Development</p>
                        </div>
                      </div>
                      {milestone.completed ? (
                        <CheckCircle size={24} className="text-green-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewType === 'activities' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Rocket size={20} className="text-blue-600" />
                  <h4 className="font-medium text-blue-900">
                    Recommended Activities
                  </h4>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Activities to support {selectedChildData.name}'s development
                </p>
              </div>

              {selectedChildData.activities.map((activity, idx) => {
                const area = developmentAreas.find(a => a.id === activity.area);
                const Icon = area?.icon || Star;
                
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${area?.color || 'gray'}-100`}>
                        <Icon size={20} className={`text-${area?.color || 'gray'}-600`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {activity.title}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Calendar size={12} className="mr-1" />
                          <span>{activity.duration}</span>
                          <span className="mx-2">•</span>
                          <span>{area?.label} Skills</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
                    </div>
                  </div>
                );
              })}

              <button className="w-full p-3 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Get More Activity Suggestions</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChildDevelopmentTracker;