import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  RotateCw,
  Sparkles,
  ChevronRight,
  User,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EnhancedQuantumKG from '../../services/EnhancedQuantumKG';
import IntelligentDistributionService from '../../services/IntelligentDistributionService';
import { format } from 'date-fns';

/**
 * Workload Balance Dashboard
 * Visualizes mental load distribution and suggests rebalancing opportunities
 */
const WorkloadBalanceDashboard = () => {
  const { familyId, familyMembers } = useFamily();
  const [workloadData, setWorkloadData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, all-time

  useEffect(() => {
    if (familyId) {
      loadWorkloadData();
    }
  }, [familyId, timeRange]);

  const loadWorkloadData = async () => {
    try {
      setLoading(true);

      // Get workload analysis from Enhanced Quantum KG
      const analysis = await EnhancedQuantumKG.analyzeWorkloadDistribution(familyId);
      setWorkloadData(analysis);

      // Get redistribution suggestions
      if (analysis.suggestions) {
        setSuggestions(analysis.suggestions);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading workload data:', error);
      setLoading(false);
    }
  };

  const getLoadColor = (utilization) => {
    if (utilization > 0.8) return 'text-red-600 bg-red-100';
    if (utilization > 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getLoadIcon = (utilization) => {
    if (utilization > 0.8) return <AlertTriangle className="w-5 h-5" />;
    if (utilization > 0.6) return <Activity className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const formatMinutesToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">
          <Brain className="w-12 h-12 mb-2 mx-auto" />
          <p>Analyzing workload distribution...</p>
        </div>
      </div>
    );
  }

  if (!workloadData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mb-4 mx-auto" />
        <p>No workload data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Equality Score */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Mental Load Distribution</h2>
            <p className="opacity-90">
              Track and balance the invisible work across your family
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">
              {workloadData.equalityScore}%
            </div>
            <div className="text-sm opacity-90">Equality Score</div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['week', 'month', 'all-time'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg capitalize ${
              timeRange === range
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(workloadData.workloadAnalysis || {}).map(([memberId, data]) => {
          const utilization = data.total / data.capacity;
          const loadColor = getLoadColor(utilization);
          const LoadIcon = () => getLoadIcon(utilization);

          return (
            <div
              key={memberId}
              onClick={() => setSelectedMember(selectedMember === memberId ? null : memberId)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Member Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${loadColor}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{data.name}</h3>
                    <p className="text-sm text-gray-500">
                      {Math.round(utilization * 100)}% capacity
                    </p>
                  </div>
                </div>
                <LoadIcon />
              </div>

              {/* Load Breakdown */}
              <div className="space-y-3">
                {/* Cognitive Load */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Cognitive</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatMinutesToHours(data.cognitive)}
                  </span>
                </div>

                {/* Physical Load */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Physical</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatMinutesToHours(data.physical)}
                  </span>
                </div>

                {/* Emotional Load */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Emotional</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatMinutesToHours(data.emotional)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Total Load</span>
                    <span>{formatMinutesToHours(data.total)} / week</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        utilization > 0.8
                          ? 'bg-red-600'
                          : utilization > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Domains */}
                {data.domains && data.domains.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Leading Domains</p>
                    <div className="flex flex-wrap gap-1">
                      {data.domains.map((domain) => (
                        <span
                          key={domain}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stress Level from Survey */}
                {data.surveyInsights?.averageStress && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Survey Stress Level</span>
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-6 rounded-sm ${
                              i < data.surveyInsights.averageStress
                                ? 'bg-orange-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expand indicator */}
              {selectedMember === memberId && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="text-sm font-medium text-gray-700">Recent Tasks</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Assigned</span>
                      <span className="font-medium">{data.recentTasks?.assigned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span className="font-medium">{data.recentTasks?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shared</span>
                      <span className="font-medium">{data.recentTasks?.shared || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rotated</span>
                      <span className="font-medium">{data.recentTasks?.rotated || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Redistribution Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Smart Redistribution Suggestions</h3>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-purple-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCw className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {suggestion.type === 'domain_rotation' ? 'Domain Rotation' : 'Task Redistribution'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Move <span className="font-medium">{suggestion.domain}</span> from{' '}
                      <span className="font-medium">
                        {workloadData.workloadAnalysis[suggestion.from]?.name}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {workloadData.workloadAnalysis[suggestion.to]?.name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{suggestion.impact}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <button className="mt-3 px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                  Apply Suggestion
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Most Balanced</span>
          </div>
          <p className="text-xs text-gray-600">
            {Object.entries(workloadData.workloadAnalysis || {})
              .sort((a, b) => {
                const aUtil = a[1].total / a[1].capacity;
                const bUtil = b[1].total / b[1].capacity;
                return Math.abs(0.5 - aUtil) - Math.abs(0.5 - bUtil);
              })[0]?.[1]?.name || 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Total Weekly Hours</span>
          </div>
          <p className="text-xs text-gray-600">
            {formatMinutesToHours(
              Object.values(workloadData.workloadAnalysis || {}).reduce(
                (sum, member) => sum + member.total,
                0
              )
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Optimization Potential</span>
          </div>
          <p className="text-xs text-gray-600">
            {suggestions.length > 0
              ? `${suggestions.length} improvements available`
              : 'Well balanced!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkloadBalanceDashboard;