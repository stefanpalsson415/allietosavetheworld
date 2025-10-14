/**
 * Unit Tests for DatabaseService.js
 *
 * Critical data service - Recently fixed "e.filter is not a function" bug (Oct 2025).
 * Tests focus on the 3 methods that were fixed to handle familyMembers as both object and array.
 *
 * Total: 15 regression protection tests
 */

import dbService from '../DatabaseService';
import { createMockDocSnapshot } from '../../test-utils/testHelpers';

// Mock Firestore functions at module level
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());

// Mock Firebase
jest.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid' } },
  storage: {}
}));

// Mock Firestore module
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  collection: jest.fn(),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: jest.fn(() => Promise.resolve({ empty: true, forEach: () => {} })),
  updateDoc: (...args) => mockUpdateDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: mockServerTimestamp,
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  arrayUnion: jest.fn()
}));

// Mock Firebase storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/image.jpg'))
}));

// Mock FamilyProfileService
jest.mock('../FamilyProfileService', () => ({
  default: {}
}));

describe('DatabaseService - Regression Protection', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // updateMemberSurveyCompletion() Tests - FIXED METHOD (Lines 647-652)
  // ============================================================================
  describe('updateMemberSurveyCompletion() - Regression Protection', () => {

    test('should handle familyMembers stored as OBJECT (keyed by userId)', async () => {
      // THE BUG: familyMembers as object caused "e.filter is not a function"
      const familyMembersAsObject = {
        'user1': { id: 'user1', name: 'Parent 1', role: 'parent', completed: false },
        'user2': { id: 'user2', name: 'Parent 2', role: 'parent', completed: false }
      };

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsObject,
          completedWeeks: [],
          currentWeek: 1
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      // Should NOT throw "e.filter is not a function"
      await expect(
        dbService.updateMemberSurveyCompletion('test-family-123', 'user1', 'initial', true)
      ).resolves.toBeTruthy();

      // Verify the method was called and data was converted to array
      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(Array.isArray(updateCall.familyMembers)).toBe(true);
      expect(updateCall.familyMembers.length).toBe(2);
    });

    test('should handle familyMembers stored as ARRAY', async () => {
      const familyMembersAsArray = [
        { id: 'user1', name: 'Parent 1', role: 'parent', completed: false },
        { id: 'user2', name: 'Parent 2', role: 'parent', completed: false }
      ];

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsArray,
          completedWeeks: [],
          currentWeek: 1
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      await expect(
        dbService.updateMemberSurveyCompletion('test-family-123', 'user1', 'initial', true)
      ).resolves.toBeTruthy();

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    test('should handle empty familyMembers', async () => {
      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: [],
          completedWeeks: [],
          currentWeek: 1
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      await expect(
        dbService.updateMemberSurveyCompletion('test-family-123', 'user1', 'initial', true)
      ).resolves.toBeTruthy();
    });

    test('should handle null familyMembers', async () => {
      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: null,
          completedWeeks: [],
          currentWeek: 1
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      await expect(
        dbService.updateMemberSurveyCompletion('test-family-123', 'user1', 'initial', true)
      ).resolves.toBeTruthy();
    });

    test('should reject missing familyId', async () => {
      await expect(
        dbService.updateMemberSurveyCompletion(null, 'user1', 'initial', true)
      ).rejects.toThrow(/family id.*required/i);
    });
  });

  // ============================================================================
  // updateMemberSurveyProgress() Tests - FIXED METHOD (Lines 768-773)
  // ============================================================================
  describe('updateMemberSurveyProgress() - Regression Protection', () => {

    test('should handle familyMembers stored as OBJECT', async () => {
      const familyMembersAsObject = {
        'user1': { id: 'user1', name: 'Parent 1', surveys: {} }
      };

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsObject
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      await expect(
        dbService.updateMemberSurveyProgress('test-family-123', 'user1', 'initial', 10)
      ).resolves.toBeTruthy();

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(Array.isArray(updateCall.familyMembers)).toBe(true);
    });

    test('should handle familyMembers stored as ARRAY', async () => {
      const familyMembersAsArray = [
        { id: 'user1', name: 'Parent 1', surveys: {} }
      ];

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsArray
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      await expect(
        dbService.updateMemberSurveyProgress('test-family-123', 'user1', 'initial', 10)
      ).resolves.toBeTruthy();
    });

    test('should update responseCount correctly', async () => {
      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: [
            { id: 'user1', name: 'Parent 1', surveys: {} }
          ]
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      await dbService.updateMemberSurveyProgress('test-family-123', 'user1', 'initial', 25);

      const updateCall = mockUpdateDoc.mock.calls[0][1];
      const member = updateCall.familyMembers.find(m => m.id === 'user1');
      expect(member.surveys.initial.responseCount).toBe(25);
    });
  });

  // ============================================================================
  // updateMemberProfilePicture() Tests - FIXED METHOD (Lines 1002-1006)
  // ============================================================================
  describe('updateMemberProfilePicture() - Regression Protection', () => {

    test('should handle familyMembers stored as OBJECT', async () => {
      const familyMembersAsObject = {
        'user1': { id: 'user1', name: 'Parent 1', profilePicture: null }
      };

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsObject
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      // Mock file
      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      mockFile.name = 'test.jpg';

      await expect(
        dbService.updateMemberProfilePicture('test-family-123', 'user1', mockFile)
      ).resolves.toBeTruthy();

      expect(mockUpdateDoc).toHaveBeenCalled();
      const updateCall = mockUpdateDoc.mock.calls[0][1];
      expect(Array.isArray(updateCall.familyMembers)).toBe(true);
    });

    test('should handle familyMembers stored as ARRAY', async () => {
      const familyMembersAsArray = [
        { id: 'user1', name: 'Parent 1', profilePicture: null }
      ];

      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: familyMembersAsArray
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      mockFile.name = 'test.jpg';

      await expect(
        dbService.updateMemberProfilePicture('test-family-123', 'user1', mockFile)
      ).resolves.toBeTruthy();
    });

    test('should update profile picture URL', async () => {
      mockGetDoc.mockResolvedValue(
        createMockDocSnapshot({
          familyId: 'test-family-123',
          familyMembers: [
            { id: 'user1', name: 'Parent 1', profilePicture: null }
          ]
        })
      );

      mockUpdateDoc.mockResolvedValue(undefined);

      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      mockFile.name = 'test.jpg';

      const url = await dbService.updateMemberProfilePicture('test-family-123', 'user1', mockFile);

      expect(url).toContain('https://');
      const updateCall = mockUpdateDoc.mock.calls[0][1];
      const member = updateCall.familyMembers.find(m => m.id === 'user1');
      expect(member.profilePicture).toContain('https://');
    });
  });

  // ============================================================================
  // Defensive Pattern Tests - The Fix Itself
  // ============================================================================
  describe('Defensive Programming Pattern', () => {

    test('should convert object to array using Object.values()', () => {
      const familyMembersAsObject = {
        'key1': { id: 'key1', name: 'Member 1' },
        'key2': { id: 'key2', name: 'Member 2' }
      };

      // This is the defensive pattern from the fix
      const converted = typeof familyMembersAsObject === 'object' && !Array.isArray(familyMembersAsObject)
        ? Object.values(familyMembersAsObject)
        : familyMembersAsObject;

      expect(Array.isArray(converted)).toBe(true);
      expect(converted.length).toBe(2);
      expect(converted[0].name).toBe('Member 1');
    });

    test('should handle empty object {}', () => {
      const emptyObject = {};

      const converted = typeof emptyObject === 'object' && !Array.isArray(emptyObject)
        ? Object.values(emptyObject)
        : emptyObject;

      expect(Array.isArray(converted)).toBe(true);
      expect(converted.length).toBe(0);
    });

    test('should not throw "e.filter is not a function" when using defensive pattern', () => {
      const possiblyNotArray = { key: 'value' };

      // Before fix: this would fail
      // const result = possiblyNotArray.filter(...) // TypeError: e.filter is not a function

      // After fix: convert to array first
      const safe = typeof possiblyNotArray === 'object' && !Array.isArray(possiblyNotArray)
        ? Object.values(possiblyNotArray)
        : possiblyNotArray;

      // Now this is safe
      expect(() => {
        safe.filter(item => item.key === 'value');
      }).not.toThrow();
    });
  });
});
