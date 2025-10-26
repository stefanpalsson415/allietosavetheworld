import React, { useState, useEffect } from 'react';
import {
  ROLE_CATEGORIES,
  EVENT_ROLES,
  getRolesByCategory,
  getKidAppropriateRoles,
  calculateRoleCognitiveLoad,
  detectRoleImbalance
} from '../../types/eventRoles';
import UserAvatar from '../common/UserAvatar';
import eventRoleIntelligenceService from '../../services/EventRoleIntelligenceService';

/**
 * EventRoleAssignment - Two-level role selection
 *
 * Level 1: Select category (Transportation, Preparation, etc.)
 * Level 2: Optionally expand to select specific roles within category
 *
 * Makes invisible labor VISIBLE by tracking who does what before/during/after events!
 */
const EventRoleAssignment = ({
  familyMembers,
  attendees = [],  // Array of userIds attending event
  roleAssignments = [],
  onRoleAssignmentsChange,
  event = {},      // Full event object for AI suggestions
  familyId = null  // Family ID for AI suggestions
}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get family members who are attending this event
  const attendingMembers = familyMembers.filter(m =>
    attendees.includes(m.id) || attendees.includes(m.userId)
  );

  if (attendingMembers.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        💡 Add attendees first to assign event roles
      </div>
    );
  }

  /**
   * Toggle a category for a person (Level 1)
   * If category is assigned, it means they're doing SOMETHING in that category
   * (can optionally expand to specify exact role)
   */
  const toggleCategory = (userId, categoryId) => {
    const updated = [...roleAssignments];
    const personIndex = updated.findIndex(ra => ra.userId === userId);
    const member = familyMembers.find(m => m.id === userId || m.userId === userId);

    if (personIndex === -1) {
      // Add new person with this category
      updated.push({
        userId,
        userName: member.name,
        userRole: member.role,
        categories: [categoryId],
        specificRoles: [],  // No specific roles yet
        assignedAt: new Date(),
        assignedBy: 'current_user_id', // TODO: Get from AuthContext
        wasAutoAssigned: false,
        confirmedByUser: true
      });
    } else {
      // Toggle category
      const hasCategory = updated[personIndex].categories.includes(categoryId);
      if (hasCategory) {
        // Remove category and all specific roles from that category
        updated[personIndex].categories = updated[personIndex].categories.filter(c => c !== categoryId);
        updated[personIndex].specificRoles = updated[personIndex].specificRoles.filter(roleName => {
          const role = EVENT_ROLES.find(r => r.name === roleName);
          return role?.category !== categoryId;
        });

        // Remove person if no categories left
        if (updated[personIndex].categories.length === 0) {
          updated.splice(personIndex, 1);
        }
      } else {
        // Add category
        updated[personIndex].categories.push(categoryId);
      }
    }

    onRoleAssignmentsChange(updated);
  };

  /**
   * Toggle a specific role for a person (Level 2)
   */
  const toggleSpecificRole = (userId, roleName, categoryId) => {
    const updated = [...roleAssignments];
    let personIndex = updated.findIndex(ra => ra.userId === userId);
    const member = familyMembers.find(m => m.id === userId || m.userId === userId);

    // If person doesn't have ANY roles yet, create entry
    if (personIndex === -1) {
      updated.push({
        userId,
        userName: member.name,
        userRole: member.role,
        categories: [categoryId],
        specificRoles: [roleName],
        assignedAt: new Date(),
        assignedBy: 'current_user_id',
        wasAutoAssigned: false,
        confirmedByUser: true
      });
      onRoleAssignmentsChange(updated);
      return;
    }

    // Ensure category is in their list
    if (!updated[personIndex].categories.includes(categoryId)) {
      updated[personIndex].categories.push(categoryId);
    }

    // Toggle specific role
    const hasRole = updated[personIndex].specificRoles.includes(roleName);
    if (hasRole) {
      updated[personIndex].specificRoles = updated[personIndex].specificRoles.filter(r => r !== roleName);
    } else {
      updated[personIndex].specificRoles.push(roleName);
    }

    onRoleAssignmentsChange(updated);
  };

  /**
   * Check if person has category assigned
   */
  const hasCategory = (userId, categoryId) => {
    const assignment = roleAssignments.find(ra => ra.userId === userId);
    return assignment?.categories.includes(categoryId) || false;
  };

  /**
   * Check if person has specific role assigned
   */
  const hasSpecificRole = (userId, roleName) => {
    const assignment = roleAssignments.find(ra => ra.userId === userId);
    return assignment?.specificRoles.includes(roleName) || false;
  };

  /**
   * Get roles for category, filtered by kid-appropriateness
   */
  const getRolesForCategory = (categoryId) => {
    const roles = getRolesByCategory(categoryId);

    // Filter by whether attending members include kids
    const hasKids = attendingMembers.some(m => m.role === 'child');
    if (!hasKids) return roles;

    // Include kid-appropriate roles + all roles (parents can do kid roles too)
    return roles;
  };

  /**
   * Check if role is appropriate for this person
   */
  const isRoleAppropriate = (role, member) => {
    if (member.role === 'parent') return true; // Parents can do anything

    if (!role.isKidAppropriate) return false;
    if (role.minAge && member.age < role.minAge) return false;

    return true;
  };

  /**
   * Get AI-powered role suggestions
   */
  const fetchSuggestions = async () => {
    if (!familyId || !event) {
      console.warn('⚠️ Cannot fetch suggestions: missing familyId or event');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const result = await eventRoleIntelligenceService.suggestRolesForEvent(
        { ...event, attendees },
        familyId
      );

      if (result.success) {
        setSuggestions(result);
        setShowSuggestions(true);
      } else {
        console.error('❌ Failed to get suggestions:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  /**
   * Apply suggested roles (user confirmation)
   */
  const applySuggestions = () => {
    if (!suggestions || !suggestions.suggestions) return;

    const newAssignments = suggestions.suggestions.map(s => {
      const member = familyMembers.find(m => m.id === s.userId || m.userId === s.userId);
      const specificRoles = s.suggestedRoles.map(r => r.roleName);
      const categories = [...new Set(s.suggestedRoles.map(r => r.category))];

      return {
        userId: s.userId,
        userName: member?.name || 'Unknown',
        userRole: member?.role || 'parent',
        categories,
        specificRoles,
        assignedAt: new Date(),
        assignedBy: 'ai',
        wasAutoAssigned: true,
        confirmedByUser: true
      };
    });

    onRoleAssignmentsChange(newAssignments);
    setShowSuggestions(false);
  };

  // Calculate summary
  const imbalanceCheck = detectRoleImbalance(roleAssignments);
  const totalCognitiveLoad = roleAssignments.reduce((sum, ra) =>
    sum + calculateRoleCognitiveLoad(ra.specificRoles), 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Event Roles - Make Invisible Labor Visible 🔥
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Track who does what before, during, and after this event
          </p>
        </div>
        <div className="flex items-center gap-2">
          {familyId && event && (
            <button
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSuggestions ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Get AI Suggestions</span>
                </>
              )}
            </button>
          )}
          {imbalanceCheck.hasImbalance && (
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
              ⚠️ Imbalance detected
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                <span>🤖</span>
                <span>Allie's Smart Suggestions</span>
                <span className="text-xs font-normal text-purple-600">
                  ({Math.round(suggestions.confidence * 100)}% confident)
                </span>
              </h4>
              <p className="text-xs text-purple-700 mt-1">
                Based on {suggestions.dataSources.surveyResponses} surveys, {suggestions.dataSources.historicalEvents} similar events, and Knowledge Graph analysis
              </p>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-purple-400 hover:text-purple-600"
            >
              ✕
            </button>
          </div>

          {suggestions.imbalanceWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
              {suggestions.imbalanceWarning}
            </div>
          )}

          <div className="space-y-2">
            {suggestions.suggestions.map(s => {
              const member = familyMembers.find(m => m.id === s.userId || m.userId === s.userId);
              return (
                <div key={s.userId} className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={member} size={24} />
                    <span className="text-sm font-medium text-gray-900">{member?.name}</span>
                  </div>
                  <div className="space-y-1">
                    {s.suggestedRoles.map(role => (
                      <div key={role.roleName} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">
                          {ROLE_CATEGORIES[role.category]?.icon} {role.roleName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">{role.reason}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            role.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                            role.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {Math.round(role.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={applySuggestions}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ✅ Apply These Suggestions
            </button>
            <button
              onClick={() => setShowSuggestions(false)}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* LEVEL 1: Category Selection */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Step 1: Select role categories
        </div>

        <div className="grid grid-cols-1 gap-2">
          {Object.values(ROLE_CATEGORIES).map((category) => (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gray-50 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Avg cognitive load: {category.avgCognitiveLoad}/5
                      </div>
                    </div>
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )}
                    className="text-gray-400 hover:text-gray-600 px-2"
                  >
                    {expandedCategory === category.id ? '▼' : '▶'}
                  </button>
                </div>

                {/* Assign category to people */}
                <div className="flex gap-2 mt-3">
                  {attendingMembers.map(member => {
                    const assigned = hasCategory(member.id, category.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleCategory(member.id, category.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                          assigned
                            ? `bg-${category.color}-100 ring-2 ring-${category.color}-400 text-${category.color}-700 font-medium`
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title={`Assign ${category.name} to ${member.name}`}
                      >
                        <UserAvatar user={member} size={16} />
                        <span>{member.name}</span>
                        {assigned && <span className="ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LEVEL 2: Specific Roles (Expanded) */}
              {expandedCategory === category.id && (
                <div className="p-3 space-y-3 bg-white border-t">
                  <div className="text-xs font-medium text-gray-600">
                    Specific roles (optional):
                  </div>

                  {getRolesForCategory(category.id).map(role => (
                    <div key={role.name} className="space-y-2 pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{role.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                          <div className="flex gap-2 text-xs text-gray-400 mt-1">
                            <span>
                              {role.isPreEvent && '📅 Before'}
                              {role.isPreEvent && role.isDuringEvent && ' • '}
                              {role.isDuringEvent && '⏱️ During'}
                              {role.isDuringEvent && role.isPostEvent && ' • '}
                              {role.isPostEvent && '✅ After'}
                            </span>
                            <span>•</span>
                            <span>Load: {role.cognitiveLoadWeight}/5</span>
                            {role.isKidAppropriate && (
                              <>
                                <span>•</span>
                                <span>👧👦 Kid-friendly {role.minAge ? `(${role.minAge}+)` : ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assign specific role to people */}
                      <div className="flex gap-2 ml-7">
                        {attendingMembers.map(member => {
                          const appropriate = isRoleAppropriate(role, member);
                          const assigned = hasSpecificRole(member.id, role.name);

                          if (!appropriate) return null;

                          return (
                            <button
                              key={member.id}
                              onClick={() => toggleSpecificRole(member.id, role.name, category.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                                assigned
                                  ? 'bg-green-100 ring-2 ring-green-400 text-green-700 font-medium'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              <UserAvatar user={member} size={14} />
                              <span>{member.name}</span>
                              {assigned && <span className="ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {roleAssignments.length > 0 && (
        <div className={`p-3 rounded-lg ${imbalanceCheck.hasImbalance ? 'bg-red-50' : 'bg-blue-50'}`}>
          <div className={`text-sm font-medium mb-2 ${imbalanceCheck.hasImbalance ? 'text-red-900' : 'text-blue-900'}`}>
            Role Summary:
          </div>

          {roleAssignments.map(assignment => {
            const cogLoad = calculateRoleCognitiveLoad(assignment.specificRoles);
            return (
              <div key={assignment.userId} className={`text-xs mb-1 ${imbalanceCheck.hasImbalance ? 'text-red-700' : 'text-blue-700'}`}>
                <strong>{assignment.userName}:</strong>
                {' '}
                {assignment.categories.length > 0 && (
                  <span>
                    {assignment.categories.map(cat => ROLE_CATEGORIES[cat]?.name).join(', ')}
                  </span>
                )}
                {assignment.specificRoles.length > 0 && (
                  <span className="ml-1">
                    ({assignment.specificRoles.join(', ')})
                  </span>
                )}
                <span className="ml-2 font-medium">
                  Load: {cogLoad}/25
                </span>
              </div>
            );
          })}

          {imbalanceCheck.hasImbalance && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⚠️ {imbalanceCheck.details}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {roleAssignments.length === 0 && (
        <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded">
          💡 Tip: Select categories first (like "Transportation"), then optionally expand to choose specific roles (like "Driver"). This helps track invisible labor!
        </div>
      )}
    </div>
  );
};

export default EventRoleAssignment;
