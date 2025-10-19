/**
 * useKnowledgeGraphWebSocket.js
 *
 * React hook for real-time knowledge graph updates via WebSocket.
 * Auto-connects when component mounts, handles reconnection, and cleans up on unmount.
 *
 * Usage:
 * const { connected, emit } = useKnowledgeGraphWebSocket(familyId, userId, {
 *   onNodeAdded: (node) => console.log('New node:', node),
 *   onNodeUpdated: (updates) => console.log('Node updated:', updates),
 *   onInsightsUpdated: (insights) => console.log('New insights:', insights)
 * });
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://allie-claude-api-363935868004.us-central1.run.app';

export function useKnowledgeGraphWebSocket(familyId, userId, eventHandlers = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!familyId || !userId) {
      // Silently wait for familyId/userId to be available (FamilyContext may still be loading)
      return;
    }

    console.log(`🔌 Connecting to Knowledge Graph WebSocket for family ${familyId}...`);

    // Create Socket.io connection
    const socket = io(`${SOCKET_URL}/knowledge-graph`, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Knowledge Graph WebSocket connected:', socket.id);
      setConnected(true);
      setError(null);

      // Join family room
      socket.emit('join-family', familyId, userId);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Knowledge Graph WebSocket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Knowledge Graph WebSocket connection error:', err.message);
      setError(err.message);
    });

    // Welcome message
    socket.on('graph:connected', (data) => {
      console.log('📡 Knowledge Graph connection confirmed:', data.message);
    });

    // Graph update events
    socket.on('graph:node-added', (data) => {
      console.log('📡 Node added:', data.node);
      if (eventHandlers.onNodeAdded) {
        eventHandlers.onNodeAdded(data.node, data.timestamp);
      }
    });

    socket.on('graph:node-updated', (data) => {
      console.log('📡 Node updated:', data.nodeId, data.updates);
      if (eventHandlers.onNodeUpdated) {
        eventHandlers.onNodeUpdated(data.nodeId, data.updates, data.timestamp);
      }
    });

    socket.on('graph:edge-added', (data) => {
      console.log('📡 Edge added:', data.edge);
      if (eventHandlers.onEdgeAdded) {
        eventHandlers.onEdgeAdded(data.edge, data.timestamp);
      }
    });

    socket.on('graph:insights-updated', (data) => {
      console.log('📡 Insights updated:', data.insights);
      if (eventHandlers.onInsightsUpdated) {
        eventHandlers.onInsightsUpdated(data.insights, data.timestamp);
      }
    });

    socket.on('graph:pattern-detected', (data) => {
      console.log('📡 Pattern detected:', data.pattern);
      if (eventHandlers.onPatternDetected) {
        eventHandlers.onPatternDetected(data.pattern, data.timestamp);
      }
    });

    socket.on('graph:sync-complete', (graphData) => {
      console.log('📡 Graph sync complete:', graphData);
      if (eventHandlers.onSyncComplete) {
        eventHandlers.onSyncComplete(graphData);
      }
    });

    socket.on('graph:error', (data) => {
      console.error('📡 Graph error:', data.message);
      setError(data.message);
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Knowledge Graph WebSocket...');
      if (socket.connected) {
        socket.emit('leave-family', familyId, userId);
      }
      socket.disconnect();
    };
  }, [familyId, userId]); // Re-connect if familyId or userId changes

  // Helper function to request full graph sync
  const requestSync = () => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔄 Requesting full graph sync...');
      socketRef.current.emit('graph:request-sync', familyId);
    } else {
      console.warn('⚠️ Cannot request sync: WebSocket not connected');
    }
  };

  // Helper function to emit custom events
  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: WebSocket not connected`);
    }
  };

  return {
    connected,
    error,
    requestSync,
    emit,
    socket: socketRef.current
  };
}

export default useKnowledgeGraphWebSocket;
