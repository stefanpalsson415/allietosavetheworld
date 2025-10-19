/**
 * WebSocketGraphService.js
 *
 * Real-time knowledge graph updates via WebSocket.
 * Broadcasts graph changes to all connected clients for live visualization.
 *
 * Events Emitted:
 * - graph:node-added - New person/task node created
 * - graph:node-updated - Cognitive load or properties changed
 * - graph:edge-added - New relationship established
 * - graph:insights-updated - Pattern analysis completed
 * - graph:sync-complete - Full graph sync finished
 *
 * Rooms:
 * - family:{familyId} - Family-specific updates
 * - global - System-wide notifications
 */

import neo4jService from './Neo4jService.js';

class WebSocketGraphService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socket mapping
  }

  /**
   * Initialize Socket.io server
   * Called from production-server.js after HTTP server creation
   */
  initialize(io) {
    this.io = io;

    // Namespace for knowledge graph events
    const graphNamespace = io.of('/knowledge-graph');

    graphNamespace.on('connection', (socket) => {
      console.log('🔌 Knowledge Graph client connected:', socket.id);

      // Join family room on connection
      socket.on('join-family', (familyId, userId) => {
        socket.join(`family:${familyId}`);
        this.connectedClients.set(userId, socket);
        console.log(`✅ User ${userId} joined family:${familyId} room`);

        // Send initial sync event
        socket.emit('graph:connected', {
          message: 'Connected to Knowledge Graph real-time updates',
          familyId
        });
      });

      // Leave family room
      socket.on('leave-family', (familyId, userId) => {
        socket.leave(`family:${familyId}`);
        this.connectedClients.delete(userId);
        console.log(`👋 User ${userId} left family:${familyId} room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔌 Knowledge Graph client disconnected:', socket.id);
        // Clean up client mapping
        for (const [userId, sock] of this.connectedClients.entries()) {
          if (sock.id === socket.id) {
            this.connectedClients.delete(userId);
          }
        }
      });

      // Request full graph refresh
      socket.on('graph:request-sync', async (familyId) => {
        try {
          const graphData = await this.getFullGraphData(familyId);
          socket.emit('graph:sync-complete', graphData);
        } catch (error) {
          socket.emit('graph:error', { message: 'Failed to sync graph data' });
        }
      });
    });

    console.log('✅ WebSocket Knowledge Graph service initialized');
  }

  /**
   * Broadcast node addition to all clients in family room
   */
  emitNodeAdded(familyId, node) {
    if (!this.io) return;

    this.io.of('/knowledge-graph').to(`family:${familyId}`).emit('graph:node-added', {
      timestamp: new Date().toISOString(),
      familyId,
      node: {
        id: node.id,
        label: node.label,
        type: node.type,
        data: node.data
      }
    });

    console.log(`📡 Broadcasted node-added to family:${familyId}:`, node.label);
  }

  /**
   * Broadcast node update (e.g., cognitive load change)
   */
  emitNodeUpdated(familyId, nodeId, updates) {
    if (!this.io) return;

    this.io.of('/knowledge-graph').to(`family:${familyId}`).emit('graph:node-updated', {
      timestamp: new Date().toISOString(),
      familyId,
      nodeId,
      updates
    });

    console.log(`📡 Broadcasted node-updated to family:${familyId}:`, nodeId);
  }

  /**
   * Broadcast new relationship (edge)
   */
  emitEdgeAdded(familyId, edge) {
    if (!this.io) return;

    this.io.of('/knowledge-graph').to(`family:${familyId}`).emit('graph:edge-added', {
      timestamp: new Date().toISOString(),
      familyId,
      edge: {
        source: edge.source,
        target: edge.target,
        type: edge.type,
        strength: edge.strength
      }
    });

    console.log(`📡 Broadcasted edge-added to family:${familyId}`);
  }

  /**
   * Broadcast insights update
   */
  emitInsightsUpdated(familyId, insights) {
    if (!this.io) return;

    this.io.of('/knowledge-graph').to(`family:${familyId}`).emit('graph:insights-updated', {
      timestamp: new Date().toISOString(),
      familyId,
      insights
    });

    console.log(`📡 Broadcasted insights-updated to family:${familyId}`);
  }

  /**
   * Broadcast pattern detection (e.g., Sunday night task surge)
   */
  emitPatternDetected(familyId, pattern) {
    if (!this.io) return;

    this.io.of('/knowledge-graph').to(`family:${familyId}`).emit('graph:pattern-detected', {
      timestamp: new Date().toISOString(),
      familyId,
      pattern: {
        type: pattern.type,
        severity: pattern.severity,
        description: pattern.description,
        affectedNodes: pattern.affectedNodes,
        recommendation: pattern.recommendation
      }
    });

    console.log(`📡 Broadcasted pattern-detected to family:${familyId}:`, pattern.type);
  }

  /**
   * Get full graph data for sync
   */
  async getFullGraphData(familyId) {
    const session = neo4jService.getSession();

    try {
      // Get all nodes
      const nodesResult = await session.run(`
        MATCH (n)
        WHERE n.familyId = $familyId OR n.userId STARTS WITH $familyId
        RETURN n, labels(n) AS nodeType
      `, { familyId });

      const nodes = nodesResult.records.map(record => ({
        id: record.get('n').properties.userId || record.get('n').properties.taskId,
        label: record.get('n').properties.name || record.get('n').properties.title,
        type: record.get('nodeType')[0],
        data: record.get('n').properties
      }));

      // Get all relationships
      const edgesResult = await session.run(`
        MATCH (a)-[r]->(b)
        WHERE a.familyId = $familyId OR a.userId STARTS WITH $familyId
        RETURN a.userId AS source, b.userId AS target, type(r) AS relType
      `, { familyId });

      const edges = edgesResult.records.map(record => ({
        source: record.get('source'),
        target: record.get('target'),
        type: record.get('relType')
      }));

      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  /**
   * Send notification to specific user
   */
  emitToUser(userId, event, data) {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit(event, data);
      console.log(`📡 Sent ${event} to user ${userId}`);
    }
  }

  /**
   * Get connected client count for family
   */
  getConnectedCount(familyId) {
    if (!this.io) return 0;
    const room = this.io.of('/knowledge-graph').adapter.rooms.get(`family:${familyId}`);
    return room ? room.size : 0;
  }
}

// Singleton instance
const webSocketGraphService = new WebSocketGraphService();

export default webSocketGraphService;
