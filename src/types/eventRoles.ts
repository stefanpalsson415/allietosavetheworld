// Event Role Types - Makes Invisible Labor Visible
// Two-level hierarchy: Category → Specific Role

export type RoleCategory =
  | 'transportation'
  | 'preparation'
  | 'supervision'
  | 'communication'
  | 'financial'
  | 'event_specific'
  | 'special_circumstance';

export interface EventRole {
  category: RoleCategory;
  name: string;
  icon: string;
  description: string;
  isPreEvent: boolean;      // Happens before event
  isDuringEvent: boolean;   // Happens during event
  isPostEvent: boolean;     // Happens after event
  cognitiveLoadWeight: number; // 1-5 scale (5 = highest mental load)
  isKidAppropriate: boolean;   // Can kids perform this role?
  minAge?: number;             // Minimum age for kids (if applicable)
}

export interface RoleCategoryInfo {
  id: RoleCategory;
  name: string;
  icon: string;
  description: string;
  color: string;  // Tailwind color for UI
  avgCognitiveLoad: number; // Average of all roles in category
}

export interface EventRoleAssignment {
  userId: string;
  userName: string;
  userRole: 'parent' | 'child';  // Track if kid or parent
  categories: string[];          // Top-level categories assigned (e.g., ["transportation", "preparation"])
  specificRoles: string[];       // Specific roles within categories (e.g., ["Driver", "Snack Master"])
  assignedAt: Date;
  assignedBy: string;            // Who assigned this role (self or partner)
  wasAutoAssigned: boolean;      // True if Allie suggested it
  confirmedByUser: boolean;      // True if user confirmed auto-assignment
}

// ========================================
// ROLE CATEGORIES (Level 1)
// ========================================

export const ROLE_CATEGORIES: Record<string, RoleCategoryInfo> = {
  transportation: {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    description: 'Driving, coordinating rides, ensuring on-time arrival',
    color: 'blue',
    avgCognitiveLoad: 4.0
  },
  preparation: {
    id: 'preparation',
    name: 'Preparation',
    icon: '🎒',
    description: 'Packing gear, snacks, documents, outfits',
    color: 'green',
    avgCognitiveLoad: 3.5
  },
  supervision: {
    id: 'supervision',
    name: 'Supervision',
    icon: '👥',
    description: 'Watching kids, being responsible adult',
    color: 'purple',
    avgCognitiveLoad: 4.0
  },
  communication: {
    id: 'communication',
    name: 'Communication',
    icon: '📱',
    description: 'Coordinating with coaches, teachers, other parents',
    color: 'pink',
    avgCognitiveLoad: 4.5
  },
  financial: {
    id: 'financial',
    name: 'Financial',
    icon: '💰',
    description: 'Handling fees, concessions, payments',
    color: 'yellow',
    avgCognitiveLoad: 2.0
  },
  event_specific: {
    id: 'event_specific',
    name: 'Event-Specific',
    icon: '🎯',
    description: 'Setup, cleanup, gift wrapping, party tasks',
    color: 'indigo',
    avgCognitiveLoad: 2.5
  },
  special_circumstance: {
    id: 'special_circumstance',
    name: 'Special Needs',
    icon: '🏥',
    description: 'Medical appointments, anxiety support, note-taking',
    color: 'red',
    avgCognitiveLoad: 4.5
  }
};

// ========================================
// SPECIFIC ROLES (Level 2)
// ========================================

export const EVENT_ROLES: EventRole[] = [
  // ========================================
  // TRANSPORTATION ROLES
  // ========================================
  {
    category: 'transportation',
    name: 'Driver',
    icon: '🚗',
    description: 'Primary transportation provider - drives to/from event',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: true,
    cognitiveLoadWeight: 3,
    isKidAppropriate: false
  },
  {
    category: 'transportation',
    name: 'Carpool Coordinator',
    icon: '🚙',
    description: 'Organizes rides with other families - high coordination',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 5, // HIGHEST - lots of planning/communication
    isKidAppropriate: false
  },
  {
    category: 'transportation',
    name: 'Time Keeper',
    icon: '⏰',
    description: 'Ensures everyone leaves on time, tracks schedule',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 4, // Mental load - watching clock constantly
    isKidAppropriate: true,
    minAge: 12
  },

  // ========================================
  // PREPARATION ROLES
  // ========================================
  {
    category: 'preparation',
    name: 'Gear Manager',
    icon: '🎒',
    description: 'Ensures equipment/supplies packed (sports gear, dance shoes)',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 4, // Mental load - remembering everything
    isKidAppropriate: true,
    minAge: 10
  },
  {
    category: 'preparation',
    name: 'Snack Master',
    icon: '🍎',
    description: 'Preps and packs food, drinks, snacks for event',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 3,
    isKidAppropriate: true,
    minAge: 8
  },
  {
    category: 'preparation',
    name: 'Outfit Coordinator',
    icon: '👕',
    description: 'Ensures everyone has clean, appropriate clothes ready',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 3,
    isKidAppropriate: true,
    minAge: 10
  },
  {
    category: 'preparation',
    name: 'Document Keeper',
    icon: '📋',
    description: 'Brings permission slips, tickets, insurance cards, forms',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 4, // Mental load - tracking paperwork
    isKidAppropriate: false
  },

  // ========================================
  // SUPERVISION ROLES
  // ========================================
  {
    category: 'supervision',
    name: 'Lead Parent',
    icon: '👨‍👩‍👧',
    description: 'Primary responsible adult at the event',
    isPreEvent: false,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 5, // HIGHEST - full responsibility
    isKidAppropriate: false
  },
  {
    category: 'supervision',
    name: 'Helper Parent',
    icon: '🤝',
    description: 'Secondary adult support, backup supervision',
    isPreEvent: false,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 3,
    isKidAppropriate: false
  },
  {
    category: 'supervision',
    name: 'Sibling Supervisor',
    icon: '👧👦',
    description: 'Older kid watches younger siblings during event',
    isPreEvent: false,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 4, // Mental load for older kids
    isKidAppropriate: true,
    minAge: 12
  },
  {
    category: 'supervision',
    name: 'Buddy System Partner',
    icon: '🤝',
    description: 'Kids paired together for safety and support',
    isPreEvent: false,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 2,
    isKidAppropriate: true,
    minAge: 6
  },

  // ========================================
  // COMMUNICATION ROLES
  // ========================================
  {
    category: 'communication',
    name: 'Team Parent Liaison',
    icon: '📱',
    description: 'Communicates with coaches, teachers, activity leaders',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: true,
    cognitiveLoadWeight: 5, // HIGHEST - ongoing mental load
    isKidAppropriate: false
  },
  {
    category: 'communication',
    name: 'Social Coordinator',
    icon: '🎉',
    description: 'Plans meetups with other families at/after event',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 4, // Coordination mental load
    isKidAppropriate: false
  },

  // ========================================
  // FINANCIAL ROLES
  // ========================================
  {
    category: 'financial',
    name: 'Treasurer',
    icon: '💰',
    description: 'Handles entry fees, concessions money, payments',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 2,
    isKidAppropriate: true,
    minAge: 10
  },

  // ========================================
  // EVENT-SPECIFIC ROLES
  // ========================================
  {
    category: 'event_specific',
    name: 'Gift Wrapper',
    icon: '🎁',
    description: 'Wraps birthday/holiday gifts for parties',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 2,
    isKidAppropriate: true,
    minAge: 8
  },
  {
    category: 'event_specific',
    name: 'Setup Crew',
    icon: '🏗️',
    description: 'Arrives early to set up party/event space',
    isPreEvent: true,
    isDuringEvent: false,
    isPostEvent: false,
    cognitiveLoadWeight: 3,
    isKidAppropriate: true,
    minAge: 10
  },
  {
    category: 'event_specific',
    name: 'Cleanup Captain',
    icon: '🧹',
    description: 'Ensures space is left clean after event',
    isPreEvent: false,
    isDuringEvent: false,
    isPostEvent: true,
    cognitiveLoadWeight: 2,
    isKidAppropriate: true,
    minAge: 8
  },

  // ========================================
  // SPECIAL CIRCUMSTANCE ROLES
  // ========================================
  {
    category: 'special_circumstance',
    name: 'Appointment Advocate',
    icon: '📝',
    description: 'Takes detailed notes at medical/school meetings',
    isPreEvent: false,
    isDuringEvent: true,
    isPostEvent: true,
    cognitiveLoadWeight: 5, // HIGHEST - critical mental load
    isKidAppropriate: false
  },
  {
    category: 'special_circumstance',
    name: 'Question Asker',
    icon: '❓',
    description: 'Comes prepared with questions for doctors/teachers',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: false,
    cognitiveLoadWeight: 4,
    isKidAppropriate: false
  },
  {
    category: 'special_circumstance',
    name: 'Comfort Provider',
    icon: '🤗',
    description: 'Emotional support for anxiety-inducing events (shots, dentist)',
    isPreEvent: true,
    isDuringEvent: true,
    isPostEvent: true,
    cognitiveLoadWeight: 4, // Emotional labor counts!
    isKidAppropriate: true,
    minAge: 12
  }
];

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get all roles for a specific category
 */
export function getRolesByCategory(category: RoleCategory): EventRole[] {
  return EVENT_ROLES.filter(role => role.category === category);
}

/**
 * Get kid-appropriate roles (optionally filter by age)
 */
export function getKidAppropriateRoles(age?: number): EventRole[] {
  return EVENT_ROLES.filter(role => {
    if (!role.isKidAppropriate) return false;
    if (age && role.minAge && age < role.minAge) return false;
    return true;
  });
}

/**
 * Get role by name
 */
export function getRoleByName(roleName: string): EventRole | undefined {
  return EVENT_ROLES.find(role => role.name === roleName);
}

/**
 * Calculate total cognitive load for a set of roles
 */
export function calculateRoleCognitiveLoad(roleNames: string[]): number {
  return roleNames.reduce((total, roleName) => {
    const role = getRoleByName(roleName);
    return total + (role?.cognitiveLoadWeight || 0);
  }, 0);
}

/**
 * Get roles by timing (pre/during/post event)
 */
export function getRolesByTiming(timing: 'pre' | 'during' | 'post'): EventRole[] {
  return EVENT_ROLES.filter(role => {
    if (timing === 'pre') return role.isPreEvent;
    if (timing === 'during') return role.isDuringEvent;
    if (timing === 'post') return role.isPostEvent;
    return false;
  });
}

/**
 * Detect role imbalance between family members
 * Returns true if one person has 2x or more cognitive load than others
 */
export function detectRoleImbalance(
  roleAssignments: EventRoleAssignment[]
): { hasImbalance: boolean; details: string } {
  if (roleAssignments.length < 2) {
    return { hasImbalance: false, details: 'Only one person assigned roles' };
  }

  const loads = roleAssignments.map(assignment => ({
    userName: assignment.userName,
    load: calculateRoleCognitiveLoad(assignment.specificRoles)
  }));

  const maxLoad = Math.max(...loads.map(l => l.load));
  const minLoad = Math.min(...loads.map(l => l.load));

  if (maxLoad >= minLoad * 2) {
    const overloaded = loads.find(l => l.load === maxLoad);
    const underloaded = loads.find(l => l.load === minLoad);

    return {
      hasImbalance: true,
      details: `${overloaded?.userName} has 2x more cognitive load (${maxLoad}) than ${underloaded?.userName} (${minLoad})`
    };
  }

  return { hasImbalance: false, details: 'Roles are balanced' };
}

