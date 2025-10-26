/**
 * Unit tests for eventRoles.ts
 * Tests all helper functions, cognitive load calculations, and role utilities
 */

import {
  ROLE_CATEGORIES,
  EVENT_ROLES,
  getRolesByCategory,
  getKidAppropriateRoles,
  getRoleByName,
  calculateRoleCognitiveLoad,
  getRolesByTiming,
  detectRoleImbalance,
  EventRoleAssignment
} from '../eventRoles';

describe('eventRoles.ts - Role Definitions', () => {
  test('ROLE_CATEGORIES has 7 categories', () => {
    const categories = Object.keys(ROLE_CATEGORIES);
    expect(categories).toHaveLength(7);
    expect(categories).toContain('transportation');
    expect(categories).toContain('preparation');
    expect(categories).toContain('supervision');
    expect(categories).toContain('communication');
    expect(categories).toContain('financial');
    expect(categories).toContain('event_specific');
    expect(categories).toContain('special_circumstance');
  });

  test('Each category has required properties', () => {
    Object.values(ROLE_CATEGORIES).forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('avgCognitiveLoad');
      expect(category.avgCognitiveLoad).toBeGreaterThanOrEqual(1);
      expect(category.avgCognitiveLoad).toBeLessThanOrEqual(5);
    });
  });

  test('EVENT_ROLES has 20 roles', () => {
    expect(EVENT_ROLES).toHaveLength(20);
  });

  test('Each role has required properties', () => {
    EVENT_ROLES.forEach(role => {
      expect(role).toHaveProperty('category');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('icon');
      expect(role).toHaveProperty('description');
      expect(role).toHaveProperty('isPreEvent');
      expect(role).toHaveProperty('isDuringEvent');
      expect(role).toHaveProperty('isPostEvent');
      expect(role).toHaveProperty('cognitiveLoadWeight');
      expect(role).toHaveProperty('isKidAppropriate');

      // Cognitive load weight must be 1-5
      expect(role.cognitiveLoadWeight).toBeGreaterThanOrEqual(1);
      expect(role.cognitiveLoadWeight).toBeLessThanOrEqual(5);

      // At least one timing must be true
      const hasTiming = role.isPreEvent || role.isDuringEvent || role.isPostEvent;
      expect(hasTiming).toBe(true);

      // Kid-appropriate roles should have minAge if specified
      if (role.isKidAppropriate && role.minAge) {
        expect(role.minAge).toBeGreaterThanOrEqual(6);
        expect(role.minAge).toBeLessThanOrEqual(18);
      }
    });
  });

  test('Cognitive load weights match expected values', () => {
    // High cognitive load roles (5/5)
    expect(getRoleByName('Carpool Coordinator')?.cognitiveLoadWeight).toBe(5);
    expect(getRoleByName('Team Parent Liaison')?.cognitiveLoadWeight).toBe(5);
    expect(getRoleByName('Lead Parent')?.cognitiveLoadWeight).toBe(5);
    expect(getRoleByName('Appointment Advocate')?.cognitiveLoadWeight).toBe(5);

    // Medium cognitive load roles (3/5)
    expect(getRoleByName('Driver')?.cognitiveLoadWeight).toBe(3);
    expect(getRoleByName('Snack Master')?.cognitiveLoadWeight).toBe(3);

    // Low cognitive load roles (2/5)
    expect(getRoleByName('Treasurer')?.cognitiveLoadWeight).toBe(2);
    expect(getRoleByName('Gift Wrapper')?.cognitiveLoadWeight).toBe(2);
  });
});

describe('getRolesByCategory', () => {
  test('Returns correct roles for transportation category', () => {
    const roles = getRolesByCategory('transportation');
    expect(roles).toHaveLength(3);
    expect(roles.map(r => r.name)).toContain('Driver');
    expect(roles.map(r => r.name)).toContain('Carpool Coordinator');
    expect(roles.map(r => r.name)).toContain('Time Keeper');
  });

  test('Returns correct roles for preparation category', () => {
    const roles = getRolesByCategory('preparation');
    expect(roles).toHaveLength(4);
    expect(roles.map(r => r.name)).toContain('Gear Manager');
    expect(roles.map(r => r.name)).toContain('Snack Master');
  });

  test('Returns correct roles for communication category', () => {
    const roles = getRolesByCategory('communication');
    expect(roles).toHaveLength(2);
    expect(roles.map(r => r.name)).toContain('Team Parent Liaison');
    expect(roles.map(r => r.name)).toContain('Social Coordinator');
  });

  test('Returns empty array for unknown category', () => {
    const roles = getRolesByCategory('unknown' as any);
    expect(roles).toHaveLength(0);
  });
});

describe('getKidAppropriateRoles', () => {
  test('Returns only kid-appropriate roles when no age specified', () => {
    const roles = getKidAppropriateRoles();

    // All returned roles should be kid-appropriate
    roles.forEach(role => {
      expect(role.isKidAppropriate).toBe(true);
    });

    // Should include kid-appropriate roles
    expect(roles.map(r => r.name)).toContain('Snack Master');
    expect(roles.map(r => r.name)).toContain('Gear Manager');
    expect(roles.map(r => r.name)).toContain('Setup Crew');

    // Should NOT include parent-only roles
    expect(roles.map(r => r.name)).not.toContain('Driver');
    expect(roles.map(r => r.name)).not.toContain('Carpool Coordinator');
  });

  test('Filters by age when age specified', () => {
    const rolesFor8YearOld = getKidAppropriateRoles(8);

    // Should include Snack Master (age 8+)
    expect(rolesFor8YearOld.map(r => r.name)).toContain('Snack Master');

    // Should NOT include Time Keeper (age 12+)
    expect(rolesFor8YearOld.map(r => r.name)).not.toContain('Time Keeper');
  });

  test('Returns more roles for older kids', () => {
    const rolesFor8YearOld = getKidAppropriateRoles(8);
    const rolesFor12YearOld = getKidAppropriateRoles(12);

    expect(rolesFor12YearOld.length).toBeGreaterThan(rolesFor8YearOld.length);
  });
});

describe('getRoleByName', () => {
  test('Returns role for valid name', () => {
    const driver = getRoleByName('Driver');
    expect(driver).toBeDefined();
    expect(driver?.name).toBe('Driver');
    expect(driver?.category).toBe('transportation');
  });

  test('Returns undefined for invalid name', () => {
    const invalid = getRoleByName('Invalid Role');
    expect(invalid).toBeUndefined();
  });

  test('Is case-sensitive', () => {
    const lowercase = getRoleByName('driver');
    expect(lowercase).toBeUndefined();
  });
});

describe('calculateRoleCognitiveLoad', () => {
  test('Calculates correct load for single role', () => {
    const load = calculateRoleCognitiveLoad(['Driver']);
    expect(load).toBe(3);
  });

  test('Calculates correct load for multiple roles', () => {
    const load = calculateRoleCognitiveLoad(['Driver', 'Snack Master', 'Carpool Coordinator']);
    // Driver (3) + Snack Master (3) + Carpool Coordinator (5) = 11
    expect(load).toBe(11);
  });

  test('Returns 0 for empty array', () => {
    const load = calculateRoleCognitiveLoad([]);
    expect(load).toBe(0);
  });

  test('Handles unknown role names gracefully', () => {
    const load = calculateRoleCognitiveLoad(['Unknown Role']);
    expect(load).toBe(0);
  });

  test('High cognitive load example', () => {
    const highLoad = calculateRoleCognitiveLoad([
      'Carpool Coordinator',
      'Team Parent Liaison',
      'Lead Parent',
      'Appointment Advocate'
    ]);
    // All 5/5 roles = 20
    expect(highLoad).toBe(20);
  });
});

describe('getRolesByTiming', () => {
  test('Returns pre-event roles', () => {
    const preRoles = getRolesByTiming('pre');

    // Should include preparation roles
    expect(preRoles.map(r => r.name)).toContain('Gear Manager');
    expect(preRoles.map(r => r.name)).toContain('Snack Master');
    expect(preRoles.map(r => r.name)).toContain('Setup Crew');
  });

  test('Returns during-event roles', () => {
    const duringRoles = getRolesByTiming('during');

    // Should include supervision roles
    expect(duringRoles.map(r => r.name)).toContain('Lead Parent');
    expect(duringRoles.map(r => r.name)).toContain('Driver');
  });

  test('Returns post-event roles', () => {
    const postRoles = getRolesByTiming('post');

    // Should include cleanup roles
    expect(postRoles.map(r => r.name)).toContain('Cleanup Captain');
  });

  test('Some roles appear in multiple timings', () => {
    const preRoles = getRolesByTiming('pre');
    const duringRoles = getRolesByTiming('during');
    const postRoles = getRolesByTiming('post');

    // Driver should be in all three (before, during, after)
    expect(preRoles.map(r => r.name)).toContain('Driver');
    expect(duringRoles.map(r => r.name)).toContain('Driver');
    expect(postRoles.map(r => r.name)).toContain('Driver');
  });
});

describe('detectRoleImbalance', () => {
  test('Detects no imbalance when only one person', () => {
    const assignments: EventRoleAssignment[] = [
      {
        userId: 'user1',
        userName: 'Stefan',
        userRole: 'parent',
        categories: ['transportation'],
        specificRoles: ['Driver'],
        assignedAt: new Date(),
        assignedBy: 'user1',
        wasAutoAssigned: false,
        confirmedByUser: true
      }
    ];

    const result = detectRoleImbalance(assignments);
    expect(result.hasImbalance).toBe(false);
  });

  test('Detects no imbalance when load is balanced', () => {
    const assignments: EventRoleAssignment[] = [
      {
        userId: 'user1',
        userName: 'Stefan',
        userRole: 'parent',
        categories: ['transportation'],
        specificRoles: ['Driver'], // Load: 3
        assignedAt: new Date(),
        assignedBy: 'user1',
        wasAutoAssigned: false,
        confirmedByUser: true
      },
      {
        userId: 'user2',
        userName: 'Kimberly',
        userRole: 'parent',
        categories: ['preparation'],
        specificRoles: ['Snack Master'], // Load: 3
        assignedAt: new Date(),
        assignedBy: 'user2',
        wasAutoAssigned: false,
        confirmedByUser: true
      }
    ];

    const result = detectRoleImbalance(assignments);
    expect(result.hasImbalance).toBe(false);
    expect(result.details).toContain('balanced');
  });

  test('Detects imbalance when one person has 2x load', () => {
    const assignments: EventRoleAssignment[] = [
      {
        userId: 'user1',
        userName: 'Stefan',
        userRole: 'parent',
        categories: ['transportation'],
        specificRoles: ['Driver'], // Load: 3
        assignedAt: new Date(),
        assignedBy: 'user1',
        wasAutoAssigned: false,
        confirmedByUser: true
      },
      {
        userId: 'user2',
        userName: 'Kimberly',
        userRole: 'parent',
        categories: ['preparation', 'communication'],
        specificRoles: ['Snack Master', 'Gear Manager', 'Carpool Coordinator'], // Load: 3 + 4 + 5 = 12
        assignedAt: new Date(),
        assignedBy: 'user2',
        wasAutoAssigned: false,
        confirmedByUser: true
      }
    ];

    const result = detectRoleImbalance(assignments);
    expect(result.hasImbalance).toBe(true);
    expect(result.details).toContain('Kimberly');
    expect(result.details).toContain('2x more');
  });

  test('Returns details with correct cognitive loads', () => {
    const assignments: EventRoleAssignment[] = [
      {
        userId: 'user1',
        userName: 'Stefan',
        userRole: 'parent',
        categories: ['financial'],
        specificRoles: ['Treasurer'], // Load: 2
        assignedAt: new Date(),
        assignedBy: 'user1',
        wasAutoAssigned: false,
        confirmedByUser: true
      },
      {
        userId: 'user2',
        userName: 'Kimberly',
        userRole: 'parent',
        categories: ['communication', 'supervision'],
        specificRoles: ['Team Parent Liaison', 'Lead Parent'], // Load: 5 + 5 = 10
        assignedAt: new Date(),
        assignedBy: 'user2',
        wasAutoAssigned: false,
        confirmedByUser: true
      }
    ];

    const result = detectRoleImbalance(assignments);
    expect(result.hasImbalance).toBe(true);
    expect(result.details).toContain('10'); // Kimberly's load
    expect(result.details).toContain('2');  // Stefan's load
  });
});

describe('Role Coverage', () => {
  test('All 7 categories are covered by roles', () => {
    const categories = Object.keys(ROLE_CATEGORIES);

    categories.forEach(category => {
      const rolesInCategory = getRolesByCategory(category as any);
      expect(rolesInCategory.length).toBeGreaterThan(0);
    });
  });

  test('Cognitive load distribution is appropriate', () => {
    const lowLoadRoles = EVENT_ROLES.filter(r => r.cognitiveLoadWeight <= 2);
    const mediumLoadRoles = EVENT_ROLES.filter(r => r.cognitiveLoadWeight === 3 || r.cognitiveLoadWeight === 4);
    const highLoadRoles = EVENT_ROLES.filter(r => r.cognitiveLoadWeight === 5);

    // Should have some roles at each level
    expect(lowLoadRoles.length).toBeGreaterThan(0);
    expect(mediumLoadRoles.length).toBeGreaterThan(0);
    expect(highLoadRoles.length).toBeGreaterThan(0);

    // High load roles should be minority (invisible labor focus)
    expect(highLoadRoles.length).toBeLessThan(EVENT_ROLES.length / 2);
  });

  test('Kid-appropriate roles exist in multiple categories', () => {
    const kidRoles = getKidAppropriateRoles();
    const categories = new Set(kidRoles.map(r => r.category));

    // Kids should be able to help in multiple categories
    expect(categories.size).toBeGreaterThan(3);
  });

  test('Each timing phase has adequate role coverage', () => {
    const preRoles = getRolesByTiming('pre');
    const duringRoles = getRolesByTiming('during');
    const postRoles = getRolesByTiming('post');

    // Pre-event should have most roles (preparation)
    expect(preRoles.length).toBeGreaterThan(5);

    // During-event should have good coverage (execution)
    expect(duringRoles.length).toBeGreaterThan(5);

    // Post-event should have fewer (cleanup)
    expect(postRoles.length).toBeGreaterThan(0);
  });
});
