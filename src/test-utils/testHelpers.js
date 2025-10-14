// Test Helpers - Mock factories and utilities for testing

/**
 * Mock Firebase Auth
 */
export const mockFirebaseAuth = {
  currentUser: null,
  signOut: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn((callback) => {
    // Immediately call with current user
    callback(mockFirebaseAuth.currentUser);
    // Return unsubscribe function
    return jest.fn();
  })
};

/**
 * Mock Firebase Firestore
 */
export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  arrayUnion: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
};

/**
 * Mock fetch for API calls
 */
export const mockFetch = (status = 200, data = {}) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    })
  );
  return global.fetch;
};

/**
 * Mock user factory
 */
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: null,
  ...overrides
});

/**
 * Mock family factory
 */
export const createMockFamily = (overrides = {}) => ({
  id: 'test-family-123',
  familyId: 'test-family-123',
  familyName: 'Test Family',
  familyMembers: [
    { id: 'user1', name: 'Parent 1', role: 'parent', email: 'parent1@test.com' },
    { id: 'user2', name: 'Parent 2', role: 'parent', email: 'parent2@test.com' },
    { id: 'child1', name: 'Child 1', role: 'child', age: 10 }
  ],
  memberIds: ['user1', 'user2', 'child1'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

/**
 * Mock Claude API response factory
 */
export const createMockClaudeResponse = (text = 'Test response', overrides = {}) => ({
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text
    }
  ],
  model: 'claude-opus-4-1-20250805',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 10,
    output_tokens: 20
  },
  ...overrides
});

/**
 * Mock family member factory
 */
export const createMockFamilyMember = (overrides = {}) => ({
  id: 'member-123',
  name: 'Test Member',
  role: 'parent',
  email: 'member@test.com',
  completed: false,
  completedDate: null,
  weeklyCompleted: [],
  surveys: {},
  ...overrides
});

/**
 * Mock survey responses factory
 */
export const createMockSurveyResponses = (count = 5) => {
  const responses = {};
  for (let i = 1; i <= count; i++) {
    responses[`question_${i}`] = `Answer ${i}`;
  }
  return responses;
};

/**
 * Wait for async operations
 */
export const waitFor = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

/**
 * Mock console methods for cleaner test output
 */
export const mockConsole = () => {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };

  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  return {
    restore: () => {
      console.log = original.log;
      console.error = original.error;
      console.warn = original.warn;
    }
  };
};

/**
 * Create mock Firestore document snapshot
 */
export const createMockDocSnapshot = (data, exists = true) => ({
  exists: () => exists,
  data: () => data,
  id: data?.id || 'mock-doc-id',
  ref: { id: data?.id || 'mock-doc-id' }
});

/**
 * Create mock Firestore query snapshot
 */
export const createMockQuerySnapshot = (docs = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map(data => createMockDocSnapshot(data)),
  forEach: (callback) => {
    docs.forEach(data => callback(createMockDocSnapshot(data)));
  },
  metadata: {
    fromCache: false,
    hasPendingWrites: false
  }
});

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockFirebaseAuth.currentUser = null;
};
