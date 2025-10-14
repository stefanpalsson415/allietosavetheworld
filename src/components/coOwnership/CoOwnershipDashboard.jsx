import React, { useState } from 'react';
import {
  Brain,
  Users,
  RotateCw,
  Vote,
  ClipboardList,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import WorkloadBalanceDashboard from './WorkloadBalanceDashboard';
import RotationCalendarView from './RotationCalendarView';
import ConsensusVotingInterface from './ConsensusVotingInterface';
import HandoffChecklistManager from './HandoffChecklistManager';

/**
 * Co-Ownership Dashboard
 * Main entry point for mental load redistribution features
 */
const CoOwnershipDashboard = () => {
  const [activeView, setActiveView] = useState('overview');

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Mental load distribution at a glance'
    },
    {
      id: 'workload',
      label: 'Workload Balance',
      icon: Brain,
      description: 'Track and balance invisible work'
    },
    {
      id: 'rotations',
      label: 'Rotation Calendar',
      icon: RotateCw,
      description: 'Domain rotations and schedules'
    },
    {
      id: 'consensus',
      label: 'Family Decisions',
      icon: Vote,
      description: 'Democratic decision making'
    },
    {
      id: 'handoffs',
      label: 'Handoff Checklists',
      icon: ClipboardList,
      description: 'Smooth transition management'
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'workload':
        return <WorkloadBalanceDashboard />;
      case 'rotations':
        return <RotationCalendarView />;
      case 'consensus':
        return <ConsensusVotingInterface />;
      case 'handoffs':
        return <HandoffChecklistManager />;
      case 'overview':
      default:
        return <OverviewPanel setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Co-Ownership</h2>
                <p className="text-xs text-gray-500">Mental Load Sharing</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-purple-50 border-l-4 border-purple-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-purple-600' : 'text-gray-500'
                      }`} />
                      <div>
                        <div className={`font-medium text-sm ${
                          isActive ? 'text-purple-900' : 'text-gray-700'
                        }`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Settings */}
            <div className="mt-8 pt-8 border-t">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Settings</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderActiveView()}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Overview Panel Component
 */
const OverviewPanel = ({ setActiveView }) => {
  const stats = {
    equalityScore: 73,
    activeRotations: 4,
    pendingDecisions: 2,
    upcomingHandoffs: 3
  };

  const insights = [
    {
      type: 'imbalance',
      title: 'Medical appointments imbalanced',
      description: 'Mama handles 92% of medical tasks. Consider rotating.',
      action: 'View Workload',
      actionView: 'workload',
      icon: Brain,
      color: 'orange'
    },
    {
      type: 'rotation',
      title: 'Meal planning rotation due',
      description: 'Time to switch the meal planning lead for next week.',
      action: 'View Calendar',
      actionView: 'rotations',
      icon: RotateCw,
      color: 'blue'
    },
    {
      type: 'decision',
      title: 'Summer camp decision pending',
      description: 'Family vote needed on summer camp enrollment.',
      action: 'Cast Vote',
      actionView: 'consensus',
      icon: Vote,
      color: 'purple'
    },
    {
      type: 'handoff',
      title: 'School coordination handoff',
      description: 'Checklist 60% complete for upcoming handoff.',
      action: 'Complete Checklist',
      actionView: 'handoffs',
      icon: ClipboardList,
      color: 'green'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      green: 'bg-green-100 text-green-700 border-green-300'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">Mental Load Redistribution</h1>
            <p className="text-lg opacity-90">
              Transform invisible work into shared ownership
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">
                Powered by survey insights and AI-driven suggestions
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{stats.equalityScore}%</div>
            <div className="text-sm opacity-90">Family Equality Score</div>
            <div className="mt-2 flex items-center gap-1 justify-center">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">+5% this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <RotateCw className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold">{stats.activeRotations}</span>
          </div>
          <p className="text-sm text-gray-600">Active Rotations</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Vote className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold">{stats.pendingDecisions}</span>
          </div>
          <p className="text-sm text-gray-600">Pending Decisions</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold">{stats.upcomingHandoffs}</span>
          </div>
          <p className="text-sm text-gray-600">Upcoming Handoffs</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold">4</span>
          </div>
          <p className="text-sm text-gray-600">Family Members</p>
        </div>
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Key Insights & Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getColorClasses(insight.color)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {insight.description}
                    </p>
                    <button
                      onClick={() => setActiveView(insight.actionView)}
                      className={`text-sm font-medium flex items-center gap-1 ${
                        insight.color === 'orange' ? 'text-orange-600 hover:text-orange-700' :
                        insight.color === 'blue' ? 'text-blue-600 hover:text-blue-700' :
                        insight.color === 'purple' ? 'text-purple-600 hover:text-purple-700' :
                        'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {insight.action}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveView('workload')}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-center"
          >
            <Brain className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <span className="text-xs">Check Balance</span>
          </button>
          <button
            onClick={() => setActiveView('rotations')}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-center"
          >
            <RotateCw className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <span className="text-xs">View Rotations</span>
          </button>
          <button
            onClick={() => setActiveView('consensus')}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-center"
          >
            <Vote className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <span className="text-xs">Cast Votes</span>
          </button>
          <button
            onClick={() => setActiveView('handoffs')}
            className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-center"
          >
            <ClipboardList className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <span className="text-xs">Manage Handoffs</span>
          </button>
        </div>
      </div>

      {/* Vision Statement */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Co-Ownership by Default</h3>
            <p className="text-gray-600 mb-3">
              No more default parent. Every task is an opportunity for shared ownership,
              learning, and growth. Our AI analyzes survey data to suggest fair distribution,
              automatic rotations, and consensus-based decisions.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Survey-Driven
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                AI-Powered
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Family-Centered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoOwnershipDashboard;