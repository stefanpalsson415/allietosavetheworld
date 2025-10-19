/**
 * Unit Tests for useKnowledgeGraphWebSocket Hook
 *
 * Tests the WebSocket connection management for real-time knowledge graph updates
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useKnowledgeGraphWebSocket from '../useKnowledgeGraphWebSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('useKnowledgeGraphWebSocket', () => {
  let mockSocket;

  beforeEach(() => {
    // Create a mock socket instance
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false
    };

    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('connects to WebSocket server on mount', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      renderHook(() => useKnowledgeGraphWebSocket(familyId, userId));

      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('/knowledge-graph'),
        expect.objectContaining({
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          reconnection: true
        })
      );
    });

    test('emits join-family event on connect', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      renderHook(() => useKnowledgeGraphWebSocket(familyId, userId));

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      act(() => {
        connectHandler();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'join-family',
        familyId,
        userId
      );
    });

    test('sets connected state to true on connect', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      // Initially not connected
      expect(result.current.connected).toBe(false);

      // Simulate connection
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      act(() => {
        connectHandler();
      });

      expect(result.current.connected).toBe(true);
    });

    test('sets connected state to false on disconnect', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      // Connect first
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      act(() => {
        connectHandler();
      });

      expect(result.current.connected).toBe(true);

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      act(() => {
        disconnectHandler();
      });

      expect(result.current.connected).toBe(false);
    });

    test('disconnects socket on unmount', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { unmount } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'leave-family',
        familyId,
        userId
      );
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    test('calls onNodeAdded when graph:node-added event received', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';
      const onNodeAdded = jest.fn();

      renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId, { onNodeAdded })
      );

      // Get the event handler
      const nodeAddedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'graph:node-added'
      )[1];

      const mockNodeData = {
        node: { id: 'node-123', type: 'task', title: 'New Task' },
        timestamp: new Date().toISOString()
      };

      act(() => {
        nodeAddedHandler(mockNodeData);
      });

      expect(onNodeAdded).toHaveBeenCalledWith(
        mockNodeData.node,
        mockNodeData.timestamp
      );
    });

    test('calls onNodeUpdated when graph:node-updated event received', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';
      const onNodeUpdated = jest.fn();

      renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId, { onNodeUpdated })
      );

      const nodeUpdatedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'graph:node-updated'
      )[1];

      const mockUpdateData = {
        nodeId: 'node-123',
        updates: { title: 'Updated Task' },
        timestamp: new Date().toISOString()
      };

      act(() => {
        nodeUpdatedHandler(mockUpdateData);
      });

      expect(onNodeUpdated).toHaveBeenCalledWith(
        mockUpdateData.nodeId,
        mockUpdateData.updates,
        mockUpdateData.timestamp
      );
    });

    test('calls onInsightsUpdated when graph:insights-updated event received', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';
      const onInsightsUpdated = jest.fn();

      renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId, { onInsightsUpdated })
      );

      const insightsUpdatedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'graph:insights-updated'
      )[1];

      const mockInsightsData = {
        insights: { cognitiveLoad: 0.75 },
        timestamp: new Date().toISOString()
      };

      act(() => {
        insightsUpdatedHandler(mockInsightsData);
      });

      expect(onInsightsUpdated).toHaveBeenCalledWith(
        mockInsightsData.insights,
        mockInsightsData.timestamp
      );
    });

    test('calls onPatternDetected when graph:pattern-detected event received', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';
      const onPatternDetected = jest.fn();

      renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId, { onPatternDetected })
      );

      const patternDetectedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'graph:pattern-detected'
      )[1];

      const mockPatternData = {
        pattern: { type: 'Sunday night surge', severity: 'high' },
        timestamp: new Date().toISOString()
      };

      act(() => {
        patternDetectedHandler(mockPatternData);
      });

      expect(onPatternDetected).toHaveBeenCalledWith(
        mockPatternData.pattern,
        mockPatternData.timestamp
      );
    });

    test('handles missing event handlers gracefully', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      // No event handlers provided
      renderHook(() => useKnowledgeGraphWebSocket(familyId, userId));

      // Get the node added handler
      const nodeAddedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'graph:node-added'
      )[1];

      const mockNodeData = {
        node: { id: 'node-123' },
        timestamp: new Date().toISOString()
      };

      // Should not throw error
      expect(() => {
        act(() => {
          nodeAddedHandler(mockNodeData);
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('logs connection errors', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      renderHook(() => useKnowledgeGraphWebSocket(familyId, userId));

      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )[1];

      const mockError = new Error('Connection failed');

      act(() => {
        errorHandler(mockError);
      });

      expect(consoleLog).toHaveBeenCalledWith(
        '❌ Knowledge Graph WebSocket connection error:',
        mockError
      );

      consoleLog.mockRestore();
    });

    test('handles reconnection attempts', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      renderHook(() => useKnowledgeGraphWebSocket(familyId, userId));

      // Should set up reconnect handler
      expect(mockSocket.on).toHaveBeenCalledWith(
        'reconnect_attempt',
        expect.any(Function)
      );
    });
  });

  describe('Custom Methods', () => {
    test('provides requestSync method', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      expect(result.current.requestSync).toBeDefined();
      expect(typeof result.current.requestSync).toBe('function');
    });

    test('requestSync emits sync-request event', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      act(() => {
        result.current.requestSync();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'sync-request',
        familyId,
        userId
      );
    });

    test('provides emit method for custom events', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      expect(result.current.emit).toBeDefined();
      expect(typeof result.current.emit).toBe('function');

      act(() => {
        result.current.emit('custom-event', { data: 'test' });
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('custom-event', { data: 'test' });
    });
  });

  describe('Dependency Changes', () => {
    test('reconnects when familyId changes', () => {
      const userId = 'test-user-456';

      const { rerender } = renderHook(
        ({ familyId }) => useKnowledgeGraphWebSocket(familyId, userId),
        { initialProps: { familyId: 'family-1' } }
      );

      expect(mockSocket.disconnect).not.toHaveBeenCalled();

      // Change familyId
      rerender({ familyId: 'family-2' });

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(io).toHaveBeenCalledTimes(2);
    });

    test('reconnects when userId changes', () => {
      const familyId = 'test-family-123';

      const { rerender } = renderHook(
        ({ userId }) => useKnowledgeGraphWebSocket(familyId, userId),
        { initialProps: { userId: 'user-1' } }
      );

      // Change userId
      rerender({ userId: 'user-2' });

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(io).toHaveBeenCalledTimes(2);
    });
  });

  describe('Connection States', () => {
    test('handles multiple connect/disconnect cycles', () => {
      const familyId = 'test-family-123';
      const userId = 'test-user-456';

      const { result } = renderHook(() =>
        useKnowledgeGraphWebSocket(familyId, userId)
      );

      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];

      // Connect
      act(() => {
        connectHandler();
      });
      expect(result.current.connected).toBe(true);

      // Disconnect
      act(() => {
        disconnectHandler();
      });
      expect(result.current.connected).toBe(false);

      // Reconnect
      act(() => {
        connectHandler();
      });
      expect(result.current.connected).toBe(true);
    });
  });
});
