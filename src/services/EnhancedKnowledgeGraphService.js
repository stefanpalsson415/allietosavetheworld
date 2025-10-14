// Enhanced Knowledge Graph Service with Neo4j-like capabilities
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
  writeBatch
} from 'firebase/firestore';

/**
 * Enhanced Knowledge Graph Service
 * 
 * This service creates a comprehensive knowledge graph that connects ALL family data:
 * - Family members and relationships
 * - Tasks, habits, and chores
 * - Events and appointments
 * - Child interests and wardrobe data
 * - Medical providers and records
 * - Documents and their content
 * - Financial data (bucks, rewards)
 * - Location and transportation data
 * - AI insights and predictions
 * 
 * The graph enables:
 * - Complex relationship queries
 * - Pattern detection and insights
 * - Predictive analytics
 * - Intelligent recommendations
 * - Cross-domain connections
 */
class EnhancedKnowledgeGraphService {
  constructor() {
    // Extended entity types covering all data
    this.entityTypes = {
      // Core entities
      family: { collection: 'families', icon: 'users' },
      person: { collection: 'familyMembers', icon: 'user' },
      
      // Task management
      task: { collection: 'tasks', icon: 'file-text' },
      habit: { collection: 'habits', icon: 'repeat' },
      chore: { collection: 'choreInstances', icon: 'check-square' },
      sequence: { collection: 'taskSequences', icon: 'git-branch' },
      
      // Events and calendar
      event: { collection: 'events', icon: 'calendar' },
      appointment: { collection: 'appointments', icon: 'clock' },
      activity: { collection: 'activities', icon: 'activity' },
      
      // Child specific
      interest: { collection: 'childInterests', icon: 'heart' },
      wardrobe: { collection: 'wardrobeItems', icon: 'shirt' },
      size: { collection: 'clothingSizes', icon: 'ruler' },
      milestone: { collection: 'milestones', icon: 'flag' },
      
      // Providers and medical
      provider: { collection: 'providers', icon: 'user-check' },
      medical_record: { collection: 'medicalRecords', icon: 'file-medical' },
      medication: { collection: 'medications', icon: 'pill' },
      
      // Documents and knowledge
      document: { collection: 'familyDocuments', icon: 'file' },
      insight: { collection: 'insights', icon: 'lightbulb' },
      prediction: { collection: 'predictions', icon: 'trending-up' },
      
      // Financial
      transaction: { collection: 'bucksTransactions', icon: 'dollar-sign' },
      reward: { collection: 'rewardInstances', icon: 'gift' },
      
      // Location
      location: { collection: 'locations', icon: 'map-pin' },
      transportation: { collection: 'transportation', icon: 'car' }
    };
    
    // Extended relationship types
    this.relationshipTypes = {
      // Family relationships
      parent_of: { strength: 10, bidirectional: false },
      child_of: { strength: 10, bidirectional: false },
      sibling_of: { strength: 8, bidirectional: true },
      // spouse_of: { strength: 10, bidirectional: true }, // Use 'related_to' with relationship: 'spouse'
      
      // Assignment and ownership
      assigned_to: { strength: 6, bidirectional: false },
      created_by: { strength: 4, bidirectional: false },
      completed_by: { strength: 5, bidirectional: false },
      // owns: { strength: 7, bidirectional: false }, // Use 'related_to' with relationship: 'owns'
      
      // Preferences and interests
      // loves: { strength: 9, bidirectional: false }, // Use 'prefers' with strength: 'loves'
      // likes: { strength: 7, bidirectional: false }, // Use 'prefers' with strength: 'likes'
      // dislikes: { strength: 6, bidirectional: false }, // Use 'prefers' with strength: 'dislikes'
      wants: { strength: 8, bidirectional: false },
      
      // Events and activities
      attends: { strength: 5, bidirectional: false },
      organizes: { strength: 6, bidirectional: false },
      // located_at: { strength: 4, bidirectional: false }, // Use 'related_to' with relationship: 'located_at'
      // occurs_at: { strength: 5, bidirectional: false }, // Use 'related_to' with relationship: 'occurs_at'
      
      // Provider relationships
      // provided_by: { strength: 6, bidirectional: false }, // Use 'related_to' with relationship: 'provided_by'
      // treats: { strength: 7, bidirectional: false }, // Use 'related_to' with relationship: 'treats'
      prescribes: { strength: 6, bidirectional: false },
      
      // Document relationships
      documents: { strength: 5, bidirectional: false },
      references: { strength: 4, bidirectional: false },
      extracted_from: { strength: 5, bidirectional: false },
      
      // Sequential relationships
      follows: { strength: 7, bidirectional: false },
      depends_on: { strength: 8, bidirectional: false },
      triggers: { strength: 7, bidirectional: false },
      
      // Financial relationships
      earns: { strength: 6, bidirectional: false },
      spends: { strength: 6, bidirectional: false },
      rewards_with: { strength: 7, bidirectional: false },
      
      // Insight relationships
      suggests: { strength: 8, bidirectional: false },
      predicts: { strength: 7, bidirectional: false },
      impacts: { strength: 6, bidirectional: false },
      correlates_with: { strength: 5, bidirectional: true },
      
      // Generic relationships
      relates_to: { strength: 3, bidirectional: true },
      similar_to: { strength: 4, bidirectional: true }
    };
    
    // Graph cache with TTL
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    // Pattern detection rules
    this.patterns = {
      taskImbalance: this.detectTaskImbalance.bind(this),
      upcomingOverload: this.detectUpcomingOverload.bind(this),
      childInterestClusters: this.detectInterestClusters.bind(this),
      wardrobeNeeds: this.detectWardrobeNeeds.bind(this),
      healthPatterns: this.detectHealthPatterns.bind(this),
      financialTrends: this.detectFinancialTrends.bind(this),
      documentConnections: this.detectDocumentConnections.bind(this)
    };
  }
  
  /**
   * Initialize or get family knowledge graph
   */
  async getOrCreateGraph(familyId) {
    // Check cache first
    const cached = this.getCached(`graph-${familyId}`);
    if (cached) return cached;
    
    try {
      const graphRef = doc(db, 'knowledgeGraphs', familyId);
      const graphDoc = await getDoc(graphRef);
      
      let graph;
      if (graphDoc.exists()) {
        graph = graphDoc.data();
        // Ensure graph has proper structure
        if (!graph.nodes) graph.nodes = {};
        if (!graph.edges) graph.edges = {};
        if (!graph.metadata) {
          graph.metadata = {
            createdAt: graph.createdAt || new Date().toISOString(),
            updatedAt: graph.updatedAt || new Date().toISOString(),
            version: '2.0',
            stats: {
              nodeCount: Object.keys(graph.nodes || {}).length,
              edgeCount: Object.keys(graph.edges || {}).length,
              lastAnalysis: null
            }
          };
        }
      } else {
        // Create new graph
        graph = {
          familyId,
          nodes: {},
          edges: {},
          metadata: {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            version: '2.0',
            stats: {
              nodeCount: 0,
              edgeCount: 0,
              lastAnalysis: null
            }
          }
        };
        
        await setDoc(graphRef, graph);
      }
      
      this.setCached(`graph-${familyId}`, graph);
      return graph;
    } catch (error) {
      console.error('Error getting/creating graph:', error);
      throw error;
    }
  }
  
  /**
   * Build comprehensive knowledge graph from all data sources
   */
  async buildComprehensiveGraph(familyId) {
    try {
      const graph = await this.getOrCreateGraph(familyId);
      const batch = writeBatch(db);
      
      // 1. Load family and members
      await this.loadFamilyData(familyId, graph);
      
      // 2. Load tasks and habits
      await this.loadTaskData(familyId, graph);
      
      // 3. Load events and calendar
      await this.loadEventData(familyId, graph);
      
      // 4. Load child-specific data
      await this.loadChildData(familyId, graph);
      
      // 5. Load provider and medical data
      await this.loadProviderData(familyId, graph);
      
      // 6. Load documents
      await this.loadDocumentData(familyId, graph);
      
      // 7. Load financial data
      await this.loadFinancialData(familyId, graph);
      
      // 8. Generate insights and predictions
      await this.generateInsights(familyId, graph);
      
      // 9. Detect patterns and create meta-nodes
      await this.detectPatterns(familyId, graph);
      
      // Update graph metadata
      graph.metadata.updatedAt = new Date().toISOString();
      graph.metadata.stats.nodeCount = Object.keys(graph.nodes).length;
      graph.metadata.stats.edgeCount = Object.keys(graph.edges).length;
      graph.metadata.lastAnalysis = new Date().toISOString();
      
      // Save to Firestore
      const graphRef = doc(db, 'knowledgeGraphs', familyId);
      await setDoc(graphRef, graph);
      
      this.setCached(`graph-${familyId}`, graph);
      return graph;
    } catch (error) {
      console.error('Error building comprehensive graph:', error);
      throw error;
    }
  }
  
  /**
   * Load family and member data
   */
  async loadFamilyData(familyId, graph) {
    // Get family data
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) return;
    
    const familyData = familyDoc.data();
    
    // Add family node
    this.addNode(graph, familyId, 'family', {
      name: familyData.familyName,
      currentWeek: familyData.currentWeek,
      completedWeeks: familyData.completedWeeks?.length || 0
    });
    
    // Add family members
    if (familyData.familyMembers) {
      const parents = [];
      const children = [];
      
      familyData.familyMembers.forEach(member => {
        this.addNode(graph, member.id, 'person', {
          name: member.name,
          role: member.role,
          age: member.age,
          birthDate: member.birthDate,
          email: member.email
        });
        
        // Create family membership edge
        this.addEdge(graph, member.id, familyId, 'member_of');
        
        if (member.role === 'parent') {
          parents.push(member.id);
        } else if (member.role === 'child') {
          children.push(member.id);
        }
      });
      
      // Create parent-child relationships
      parents.forEach(parentId => {
        children.forEach(childId => {
          this.addEdge(graph, parentId, childId, 'parent_of');
          this.addEdge(graph, childId, parentId, 'child_of');
        });
      });
      
      // Create sibling relationships
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          this.addEdge(graph, children[i], children[j], 'sibling_of');
        }
      }
      
      // Create spouse relationships
      if (parents.length >= 2) {
        this.addEdge(graph, parents[0], parents[1], 'related_to', { relationship: 'spouse' });
      }
    }
  }
  
  /**
   * Load task and habit data
   */
  async loadTaskData(familyId, graph) {
    // Load tasks from family document
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (familyDoc.exists() && familyDoc.data().tasks) {
      familyDoc.data().tasks.forEach(task => {
        this.addNode(graph, task.id, 'task', {
          title: task.title,
          category: task.category,
          completed: task.completed,
          priority: task.priority,
          weight: task.weight,
          dueDate: task.dueDate
        });
        
        // Create assignment edges
        if (task.assignedTo) {
          this.addEdge(graph, task.id, task.assignedTo, 'assigned_to');
        }
        
        if (task.createdBy) {
          this.addEdge(graph, task.id, task.createdBy, 'created_by');
        }
      });
    }
    
    // Load habits
    const habitsQuery = query(
      collection(db, 'habits'),
      where('familyId', '==', familyId)
    );
    const habitsSnapshot = await getDocs(habitsQuery);
    
    habitsSnapshot.forEach(doc => {
      const habit = doc.data();
      this.addNode(graph, doc.id, 'habit', {
        title: habit.title,
        category: habit.category,
        frequency: habit.frequency,
        currentStreak: habit.currentStreak,
        isActive: habit.isActive
      });
      
      if (habit.assignedTo) {
        this.addEdge(graph, doc.id, habit.assignedTo, 'assigned_to');
      }
    });
    
    // Load chore instances
    const choresQuery = query(
      collection(db, 'choreInstances'),
      where('familyId', '==', familyId)
    );
    const choresSnapshot = await getDocs(choresQuery);
    
    choresSnapshot.forEach(doc => {
      const chore = doc.data();
      this.addNode(graph, doc.id, 'chore', {
        title: chore.title,
        points: chore.points,
        completed: chore.completed,
        dueDate: chore.dueDate
      });
      
      if (chore.assignedTo) {
        this.addEdge(graph, doc.id, chore.assignedTo, 'assigned_to');
      }
    });
  }
  
  /**
   * Load event and calendar data
   */
  async loadEventData(familyId, graph) {
    const eventsQuery = query(
      collection(db, 'events'),
      where('familyId', '==', familyId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    
    eventsSnapshot.forEach(doc => {
      const event = doc.data();
      this.addNode(graph, doc.id, 'event', {
        title: event.title,
        dateTime: event.dateTime,
        category: event.category,
        location: event.location,
        recurring: event.recurring
      });
      
      // Create attendee edges
      if (event.attendees) {
        event.attendees.forEach(attendeeId => {
          this.addEdge(graph, attendeeId, doc.id, 'attends');
        });
      }
      
      // Create location node and edge
      if (event.location) {
        const locationId = `location-${event.location.toLowerCase().replace(/\s+/g, '-')}`;
        this.addNode(graph, locationId, 'location', {
          name: event.location,
          type: 'event_venue'
        });
        this.addEdge(graph, doc.id, locationId, 'related_to', { relationship: 'occurs_at', type: 'location' });
      }
      
      // Link to provider if medical appointment
      if (event.providerId) {
        this.addEdge(graph, doc.id, event.providerId, 'related_to', { relationship: 'provided_by', type: 'provider' });
      }
    });
  }
  
  /**
   * Load child-specific data (interests, wardrobe, etc.)
   */
  async loadChildData(familyId, graph) {
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) return;
    
    const children = familyDoc.data().familyMembers?.filter(m => m.role === 'child') || [];
    
    for (const child of children) {
      // Load interests
      const interestsRef = doc(db, 'families', familyId, 'childInterests', child.id);
      const interestsDoc = await getDoc(interestsRef);
      
      if (interestsDoc.exists()) {
        const interests = interestsDoc.data();
        
        // Process interest categories
        ['loves', 'likes', 'passes'].forEach(category => {
          if (interests[category]) {
            Object.entries(interests[category]).forEach(([itemType, items]) => {
              items.forEach(item => {
                const interestId = `interest-${child.id}-${item.toLowerCase().replace(/\s+/g, '-')}`;
                this.addNode(graph, interestId, 'interest', {
                  name: item,
                  type: itemType,
                  category: category
                });
                
                // Create relationship based on category
                if (category === 'loves') {
                  this.addEdge(graph, child.id, interestId, 'prefers', { strength: 'loves', weight: 1.0 });
                } else if (category === 'likes') {
                  this.addEdge(graph, child.id, interestId, 'prefers', { strength: 'likes', weight: 0.7 });
                } else if (category === 'passes') {
                  this.addEdge(graph, child.id, interestId, 'prefers', { strength: 'dislikes', weight: -0.5 });
                }
              });
            });
          }
        });
      }
      
      // Load wardrobe data
      const wardrobeRef = doc(db, 'families', familyId, 'wardrobe', child.id);
      const wardrobeDoc = await getDoc(wardrobeRef);
      
      if (wardrobeDoc.exists()) {
        const wardrobe = wardrobeDoc.data();
        
        // Add size nodes
        if (wardrobe.sizes) {
          Object.entries(wardrobe.sizes).forEach(([type, size]) => {
            const sizeId = `size-${child.id}-${type}`;
            this.addNode(graph, sizeId, 'size', {
              type: type,
              size: size,
              lastUpdated: wardrobe.lastUpdated
            });
            this.addEdge(graph, child.id, sizeId, 'related_to', { relationship: 'owns', type: 'wardrobe_size' });
          });
        }
        
        // Add wardrobe items
        if (wardrobe.items) {
          wardrobe.items.forEach((item, index) => {
            const itemId = `wardrobe-${child.id}-${index}`;
            this.addNode(graph, itemId, 'wardrobe', {
              name: item.name,
              type: item.type,
              size: item.size,
              season: item.season,
              condition: item.condition
            });
            this.addEdge(graph, child.id, itemId, 'related_to', { relationship: 'owns', type: 'wardrobe_item' });
          });
        }
      }
    }
  }
  
  /**
   * Load provider and medical data
   */
  async loadProviderData(familyId, graph) {
    const providersQuery = query(
      collection(db, 'providers'),
      where('familyId', '==', familyId)
    );
    const providersSnapshot = await getDocs(providersQuery);
    
    providersSnapshot.forEach(doc => {
      const provider = doc.data();
      this.addNode(graph, doc.id, 'provider', {
        name: provider.name,
        type: provider.type,
        specialty: provider.specialty,
        phone: provider.phone,
        address: provider.address
      });
      
      // Create location node for provider
      if (provider.address) {
        const locationId = `location-provider-${doc.id}`;
        this.addNode(graph, locationId, 'location', {
          address: provider.address,
          type: 'provider_office'
        });
        this.addEdge(graph, doc.id, locationId, 'related_to', { relationship: 'located_at', type: 'office_location' });
      }
      
      // Link to patients
      if (provider.patients) {
        provider.patients.forEach(patientId => {
          this.addEdge(graph, doc.id, patientId, 'related_to', { relationship: 'treats', type: 'medical_care' });
        });
      }
    });
  }
  
  /**
   * Load document data
   */
  async loadDocumentData(familyId, graph) {
    const documentsQuery = query(
      collection(db, 'familyDocuments'),
      where('familyId', '==', familyId)
    );
    const documentsSnapshot = await getDocs(documentsQuery);
    
    documentsSnapshot.forEach(doc => {
      const document = doc.data();
      this.addNode(graph, doc.id, 'document', {
        name: document.name,
        type: document.type,
        category: document.category,
        uploadDate: document.uploadDate,
        extractedText: document.extractedText?.substring(0, 200)
      });
      
      // Link to uploader
      if (document.uploadedBy) {
        this.addEdge(graph, doc.id, document.uploadedBy, 'created_by');
      }
      
      // Link to related entities
      if (document.relatedTo) {
        document.relatedTo.forEach(entityId => {
          this.addEdge(graph, doc.id, entityId, 'documents');
        });
      }
      
      // Extract entities from document text
      if (document.extractedText) {
        const extractedEntities = this.extractEntitiesFromText(document.extractedText);
        extractedEntities.forEach(entity => {
          this.addEdge(graph, entity.id, doc.id, 'referenced_in');
        });
      }
    });
  }
  
  /**
   * Load financial data
   */
  async loadFinancialData(familyId, graph) {
    // Load bucks transactions
    const transactionsQuery = query(
      collection(db, 'bucksTransactions'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    transactionsSnapshot.forEach(doc => {
      const transaction = doc.data();
      this.addNode(graph, doc.id, 'transaction', {
        amount: transaction.amount,
        type: transaction.type,
        reason: transaction.reason,
        date: transaction.createdAt
      });
      
      // Link to user
      if (transaction.userId) {
        if (transaction.type === 'earned') {
          this.addEdge(graph, transaction.userId, doc.id, 'earns');
        } else if (transaction.type === 'spent') {
          this.addEdge(graph, transaction.userId, doc.id, 'spends');
        }
      }
      
      // Link to source (chore, reward, etc.)
      if (transaction.sourceId) {
        this.addEdge(graph, transaction.sourceId, doc.id, 'triggers');
      }
    });
    
    // Load rewards
    const rewardsQuery = query(
      collection(db, 'rewardInstances'),
      where('familyId', '==', familyId)
    );
    const rewardsSnapshot = await getDocs(rewardsQuery);
    
    rewardsSnapshot.forEach(doc => {
      const reward = doc.data();
      this.addNode(graph, doc.id, 'reward', {
        name: reward.name,
        cost: reward.cost,
        status: reward.status,
        redeemedBy: reward.redeemedBy,
        redeemedAt: reward.redeemedAt
      });
      
      if (reward.redeemedBy) {
        this.addEdge(graph, reward.redeemedBy, doc.id, 'redeemed');
      }
    });
  }
  
  /**
   * Generate AI insights from the graph
   */
  async generateInsights(familyId, graph) {
    const insights = [];
    
    // Run all pattern detection
    for (const [patternName, patternFunc] of Object.entries(this.patterns)) {
      try {
        const patternInsights = await patternFunc(graph);
        insights.push(...patternInsights);
      } catch (error) {
        console.error(`Error detecting ${patternName}:`, error);
      }
    }
    
    // Add advanced analytics
    const analyticsInsights = await this.runAdvancedAnalytics(graph);
    insights.push(...analyticsInsights);
    
    // Add insight nodes to graph
    insights.forEach((insight, index) => {
      const insightId = `insight-${Date.now()}-${index}`;
      this.addNode(graph, insightId, 'insight', {
        title: insight.title,
        description: insight.description,
        type: insight.type,
        severity: insight.severity,
        confidence: insight.confidence,
        createdAt: new Date().toISOString()
      });
      
      // Link to related entities
      insight.relatedEntities.forEach(entityId => {
        this.addEdge(graph, insightId, entityId, 'relates_to');
      });
      
      // Link suggestions
      if (insight.suggestions) {
        insight.suggestions.forEach(suggestion => {
          this.addEdge(graph, insightId, suggestion.targetId, 'suggests', {
            action: suggestion.action
          });
        });
      }
    });
    
    return insights;
  }
  
  /**
   * Pattern detection functions
   */
  async detectTaskImbalance(graph) {
    const insights = [];
    const tasksByPerson = {};
    
    // Count tasks per person
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'assigned_to') {
        const person = graph.nodes[edge.target];
        if (person && person.type === 'person' && person.data.role === 'parent') {
          tasksByPerson[edge.target] = (tasksByPerson[edge.target] || 0) + 1;
        }
      }
    });
    
    const counts = Object.values(tasksByPerson);
    if (counts.length >= 2) {
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      
      if (max > avg * 1.5) {
        const overloaded = Object.entries(tasksByPerson)
          .find(([id, count]) => count === max);
        
        insights.push({
          title: 'Task Overload Detected',
          description: `${graph.nodes[overloaded[0]].data.name} has ${max} tasks, significantly above average.`,
          type: 'workload_imbalance',
          severity: 'high',
          confidence: 0.9,
          relatedEntities: [overloaded[0]],
          suggestions: [{
            action: 'redistribute_tasks',
            targetId: overloaded[0]
          }]
        });
      }
    }
    
    return insights;
  }
  
  async detectUpcomingOverload(graph) {
    const insights = [];
    const upcomingEvents = [];
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find upcoming events
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (node.type === 'event' && node.data.dateTime) {
        const eventDate = new Date(node.data.dateTime);
        if (eventDate > now && eventDate < weekFromNow) {
          upcomingEvents.push({ id: nodeId, date: eventDate, ...node.data });
        }
      }
    });
    
    // Group by day
    const eventsByDay = {};
    upcomingEvents.forEach(event => {
      const day = event.date.toDateString();
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
    });
    
    // Check for overloaded days
    Object.entries(eventsByDay).forEach(([day, count]) => {
      if (count >= 4) {
        insights.push({
          title: 'Busy Day Ahead',
          description: `${count} events scheduled for ${day}. Consider rescheduling.`,
          type: 'schedule_overload',
          severity: 'medium',
          confidence: 0.85,
          relatedEntities: upcomingEvents
            .filter(e => e.date.toDateString() === day)
            .map(e => e.id)
            .slice(0, 3),
          suggestions: [{
            action: 'reschedule_events',
            targetId: day
          }]
        });
      }
    });
    
    return insights;
  }
  
  async detectInterestClusters(graph) {
    const insights = [];
    const interestsByChild = {};
    
    // Group interests by child
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'prefers' && edge.properties && (edge.properties.strength === 'loves' || edge.properties.strength === 'likes')) {
        const child = graph.nodes[edge.source];
        const interest = graph.nodes[edge.target];
        
        if (child && child.type === 'person' && interest && interest.type === 'interest') {
          if (!interestsByChild[edge.source]) {
            interestsByChild[edge.source] = [];
          }
          interestsByChild[edge.source].push({
            ...interest.data,
            strength: edge.properties.strength === 'loves' ? 2 : 1
          });
        }
      }
    });
    
    // Analyze patterns
    Object.entries(interestsByChild).forEach(([childId, interests]) => {
      const categories = {};
      interests.forEach(interest => {
        categories[interest.type] = (categories[interest.type] || 0) + interest.strength;
      });
      
      const topCategory = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topCategory && topCategory[1] >= 5) {
        insights.push({
          title: 'Strong Interest Pattern',
          description: `${graph.nodes[childId].data.name} shows strong interest in ${topCategory[0]} items.`,
          type: 'interest_cluster',
          severity: 'info',
          confidence: 0.8,
          relatedEntities: [childId],
          suggestions: [{
            action: 'recommend_gifts',
            targetId: childId,
            category: topCategory[0]
          }]
        });
      }
    });
    
    return insights;
  }
  
  async detectWardrobeNeeds(graph) {
    const insights = [];
    
    // Check clothing sizes age
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (node.type === 'size' && node.data.lastUpdated) {
        const lastUpdate = new Date(node.data.lastUpdated);
        const monthsSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsSinceUpdate > 6) {
          // Find the child who owns this size
          const ownerEdge = Object.values(graph.edges)
            .find(e => e.type === 'related_to' && e.properties && e.properties.relationship === 'owns' && e.target === nodeId);
          
          if (ownerEdge) {
            insights.push({
              title: 'Size Update Needed',
              description: `${node.data.type} size for ${graph.nodes[ownerEdge.source].data.name} hasn't been updated in ${Math.floor(monthsSinceUpdate)} months.`,
              type: 'wardrobe_update',
              severity: 'low',
              confidence: 0.7,
              relatedEntities: [ownerEdge.source, nodeId],
              suggestions: [{
                action: 'update_size',
                targetId: nodeId
              }]
            });
          }
        }
      }
    });
    
    return insights;
  }
  
  async detectHealthPatterns(graph) {
    const insights = [];
    const appointmentsByChild = {};
    
    // Group medical appointments by child
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'attends') {
        const person = graph.nodes[edge.source];
        const event = graph.nodes[edge.target];
        
        if (person && person.type === 'person' && person.data.role === 'child' &&
            event && event.type === 'event' && event.data.category === 'medical') {
          if (!appointmentsByChild[edge.source]) {
            appointmentsByChild[edge.source] = [];
          }
          appointmentsByChild[edge.source].push(event);
        }
      }
    });
    
    // Check for overdue checkups
    Object.entries(appointmentsByChild).forEach(([childId, appointments]) => {
      const lastCheckup = appointments
        .filter(a => a.data.title?.toLowerCase().includes('checkup'))
        .sort((a, b) => new Date(b.data.dateTime) - new Date(a.data.dateTime))[0];
      
      if (lastCheckup) {
        const monthsSince = (new Date() - new Date(lastCheckup.data.dateTime)) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsSince > 12) {
          insights.push({
            title: 'Annual Checkup Due',
            description: `${graph.nodes[childId].data.name}'s last checkup was ${Math.floor(monthsSince)} months ago.`,
            type: 'health_reminder',
            severity: 'medium',
            confidence: 0.9,
            relatedEntities: [childId],
            suggestions: [{
              action: 'schedule_checkup',
              targetId: childId
            }]
          });
        }
      }
    });
    
    return insights;
  }
  
  async detectFinancialTrends(graph) {
    const insights = [];
    const transactionsByUser = {};
    
    // Group transactions by user
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'earns' || edge.type === 'spends') {
        const user = edge.source;
        const transaction = graph.nodes[edge.target];
        
        if (transaction && transaction.type === 'transaction') {
          if (!transactionsByUser[user]) {
            transactionsByUser[user] = { earned: 0, spent: 0 };
          }
          
          if (edge.type === 'earns') {
            transactionsByUser[user].earned += transaction.data.amount;
          } else {
            transactionsByUser[user].spent += transaction.data.amount;
          }
        }
      }
    });
    
    // Analyze spending patterns
    Object.entries(transactionsByUser).forEach(([userId, stats]) => {
      if (stats.spent > stats.earned * 0.9) {
        insights.push({
          title: 'High Spending Alert',
          description: `${graph.nodes[userId].data.name} has spent ${stats.spent} bucks out of ${stats.earned} earned.`,
          type: 'financial_alert',
          severity: 'low',
          confidence: 0.8,
          relatedEntities: [userId],
          suggestions: [{
            action: 'encourage_saving',
            targetId: userId
          }]
        });
      }
    });
    
    return insights;
  }
  
  async detectDocumentConnections(graph) {
    const insights = [];
    const documentClusters = {};
    
    // Find documents that reference similar entities
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (node.type === 'document') {
        const references = Object.values(graph.edges)
          .filter(e => e.source === nodeId && e.type === 'references')
          .map(e => e.target);
        
        references.forEach(ref => {
          if (!documentClusters[ref]) {
            documentClusters[ref] = [];
          }
          documentClusters[ref].push(nodeId);
        });
      }
    });
    
    // Find entities with multiple related documents
    Object.entries(documentClusters).forEach(([entityId, documents]) => {
      if (documents.length >= 3) {
        insights.push({
          title: 'Document Pattern Found',
          description: `${documents.length} documents relate to ${graph.nodes[entityId].data.name || entityId}.`,
          type: 'document_cluster',
          severity: 'info',
          confidence: 0.7,
          relatedEntities: [entityId, ...documents.slice(0, 2)],
          suggestions: [{
            action: 'create_folder',
            targetId: entityId
          }]
        });
      }
    });
    
    return insights;
  }
  
  /**
   * Advanced query methods
   */
  async findShortestPath(graph, startId, endId, maxDepth = 5) {
    const visited = new Set();
    const queue = [{ node: startId, path: [startId] }];
    
    while (queue.length > 0) {
      const { node, path } = queue.shift();
      
      if (node === endId) {
        return path;
      }
      
      if (path.length >= maxDepth || visited.has(node)) {
        continue;
      }
      
      visited.add(node);
      
      // Find all connected nodes
      const connections = Object.values(graph.edges)
        .filter(e => e.source === node || e.target === node)
        .map(e => e.source === node ? e.target : e.source)
        .filter(n => !visited.has(n));
      
      connections.forEach(conn => {
        queue.push({ node: conn, path: [...path, conn] });
      });
    }
    
    return null;
  }
  
  async findCommunities(graph) {
    // Implement community detection algorithm
    // This is a simplified version - in production, use Louvain or similar
    const communities = [];
    const visited = new Set();
    
    Object.keys(graph.nodes).forEach(nodeId => {
      if (!visited.has(nodeId)) {
        const community = [];
        const queue = [nodeId];
        
        while (queue.length > 0) {
          const current = queue.shift();
          if (visited.has(current)) continue;
          
          visited.add(current);
          community.push(current);
          
          // Find strongly connected nodes
          const connections = Object.values(graph.edges)
            .filter(e => (e.source === current || e.target === current) && 
                        this.relationshipTypes[e.type].strength >= 7)
            .map(e => e.source === current ? e.target : e.source)
            .filter(n => !visited.has(n));
          
          queue.push(...connections);
        }
        
        if (community.length > 1) {
          communities.push(community);
        }
      }
    });
    
    return communities;
  }
  
  async predictFutureConnections(graph) {
    const predictions = [];
    
    // Find nodes that share multiple connections but aren't directly connected
    const nodeConnections = {};
    
    Object.keys(graph.nodes).forEach(nodeId => {
      nodeConnections[nodeId] = new Set(
        Object.values(graph.edges)
          .filter(e => e.source === nodeId || e.target === nodeId)
          .map(e => e.source === nodeId ? e.target : e.source)
      );
    });
    
    Object.entries(nodeConnections).forEach(([node1, connections1]) => {
      Object.entries(nodeConnections).forEach(([node2, connections2]) => {
        if (node1 !== node2 && !connections1.has(node2)) {
          const sharedConnections = [...connections1].filter(n => connections2.has(n));
          
          if (sharedConnections.length >= 3) {
            predictions.push({
              source: node1,
              target: node2,
              confidence: sharedConnections.length / 10,
              reason: `Share ${sharedConnections.length} connections`
            });
          }
        }
      });
    });
    
    return predictions;
  }
  
  /**
   * Utility methods
   */
  addNode(graph, id, type, data) {
    if (!graph.nodes[id]) {
      graph.nodes[id] = {
        id,
        type,
        data,
        createdAt: new Date().toISOString()
      };
    } else {
      // Update existing node
      graph.nodes[id].data = { ...graph.nodes[id].data, ...data };
      graph.nodes[id].updatedAt = new Date().toISOString();
    }
  }
  
  addEdge(graph, source, target, type, properties = {}) {
    const edgeId = `${source}-${type}-${target}`;
    
    if (!graph.edges[edgeId]) {
      graph.edges[edgeId] = {
        id: edgeId,
        source,
        target,
        type,
        properties,
        createdAt: new Date().toISOString()
      };
      
      // Add reverse edge if bidirectional
      if (this.relationshipTypes[type]?.bidirectional) {
        const reverseId = `${target}-${type}-${source}`;
        graph.edges[reverseId] = {
          id: reverseId,
          source: target,
          target: source,
          type,
          properties,
          createdAt: new Date().toISOString()
        };
      }
    }
  }
  
  extractEntitiesFromText(text) {
    // Simple entity extraction - in production, use NLP
    const entities = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for dates
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
    const dates = text.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        entities.push({ type: 'date', value: date });
      });
    }
    
    // Look for money amounts
    const moneyPattern = /\$[\d,]+\.?\d*/g;
    const amounts = text.match(moneyPattern);
    if (amounts) {
      amounts.forEach(amount => {
        entities.push({ type: 'money', value: amount });
      });
    }
    
    return entities;
  }
  
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Advanced Analytics - Mental Load Calculation
   */
  async calculateMentalLoad(graph) {
    const mentalLoadByPerson = {};
    
    // Initialize for all people
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (node.type === 'person') {
        mentalLoadByPerson[nodeId] = {
          name: node.data.name,
          role: node.data.role,
          baseLoad: 0,
          taskLoad: 0,
          emotionalLoad: 0,
          coordinationLoad: 0,
          totalLoad: 0,
          factors: []
        };
      }
    });
    
    // Calculate task load
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'assigned_to') {
        const task = graph.nodes[edge.source];
        const person = graph.nodes[edge.target];
        
        if (task && person && mentalLoadByPerson[edge.target]) {
          const weight = task.data.weight || 1;
          const urgency = task.data.priority === 'high' ? 2 : 1;
          const complexity = task.data.category === 'complex' ? 1.5 : 1;
          
          const taskContribution = weight * urgency * complexity;
          mentalLoadByPerson[edge.target].taskLoad += taskContribution;
          mentalLoadByPerson[edge.target].factors.push({
            type: 'task',
            name: task.data.name || task.data.title,
            contribution: taskContribution
          });
        }
      }
    });
    
    // Calculate emotional load from children's needs
    Object.entries(graph.edges).forEach(([edgeId, edge]) => {
      if (edge.type === 'parent_of') {
        const parent = graph.nodes[edge.source];
        const child = graph.nodes[edge.target];
        
        if (parent && child && mentalLoadByPerson[edge.source]) {
          // Check child's emotional state from milestones
          const emotionalMilestones = Object.values(graph.nodes).filter(n => 
            n.type === 'milestone' && 
            n.data.type === 'emotional' &&
            Object.values(graph.edges).some(e => 
              e.type === 'milestone_of' && 
              e.source === n.id && 
              e.target === child.id
            )
          );
          
          const negativeEmotions = emotionalMilestones.filter(m => 
            ['sad', 'angry', 'upset', 'anxious'].includes(m.data.emotion?.toLowerCase())
          );
          
          const emotionalContribution = negativeEmotions.length * 3;
          mentalLoadByPerson[edge.source].emotionalLoad += emotionalContribution;
          
          if (negativeEmotions.length > 0) {
            mentalLoadByPerson[edge.source].factors.push({
              type: 'emotional',
              name: `${child.data.name}'s emotional needs`,
              contribution: emotionalContribution
            });
          }
        }
      }
    });
    
    // Calculate coordination load
    Object.entries(graph.nodes).forEach(([nodeId, node]) => {
      if (node.type === 'event') {
        const attendees = Object.values(graph.edges).filter(e => 
          e.type === 'attends' && e.target === nodeId
        );
        
        // Events with multiple attendees require coordination
        if (attendees.length > 2) {
          attendees.forEach(attendee => {
            const personId = attendee.source;
            if (mentalLoadByPerson[personId]) {
              const coordinationContribution = attendees.length * 0.5;
              mentalLoadByPerson[personId].coordinationLoad += coordinationContribution;
              mentalLoadByPerson[personId].factors.push({
                type: 'coordination',
                name: `Coordinating ${node.data.title}`,
                contribution: coordinationContribution
              });
            }
          });
        }
      }
    });
    
    // Calculate total load and normalize
    Object.values(mentalLoadByPerson).forEach(person => {
      person.totalLoad = person.taskLoad + person.emotionalLoad + person.coordinationLoad;
      
      // Add base load for parents
      if (person.role === 'parent') {
        person.baseLoad = 10; // Base mental load of parenting
        person.totalLoad += person.baseLoad;
      }
    });
    
    return mentalLoadByPerson;
  }
  
  /**
   * Context Stitching - Find complex multi-hop relationships
   */
  async performContextStitching(graph, query) {
    const results = {
      paths: [],
      insights: [],
      recommendations: []
    };
    
    // Parse the query to understand what connections to find
    const queryParts = this.parseContextQuery(query);
    
    // Example: "Who helped with homework last week and what rewards did they earn?"
    if (queryParts.includes('help') && queryParts.includes('reward')) {
      // Find helping relationships
      const helpingEdges = Object.values(graph.edges).filter(e => 
        e.type === 'teaches' || 
        (e.type === 'completed_by' && graph.nodes[e.target]?.data.category === 'homework')
      );
      
      helpingEdges.forEach(helpEdge => {
        const helper = graph.nodes[helpEdge.source];
        
        // Find rewards earned by this helper
        const rewardEdges = Object.values(graph.edges).filter(e => 
          e.type === 'earns' && e.source === helpEdge.source
        );
        
        if (rewardEdges.length > 0) {
          results.paths.push({
            context: 'Helper-Reward Connection',
            helper: helper.data.name,
            helped: graph.nodes[helpEdge.target]?.data.name,
            rewards: rewardEdges.map(r => graph.nodes[r.target]?.data)
          });
          
          results.insights.push({
            title: 'Reward System Working',
            description: `${helper.data.name} is being rewarded for helping behaviors`,
            confidence: 0.9
          });
        }
      });
    }
    
    // Example: "What activities overlap with doctor appointments?"
    if (queryParts.includes('activity') && queryParts.includes('appointment')) {
      const appointments = Object.values(graph.nodes).filter(n => 
        n.type === 'appointment' || 
        (n.type === 'event' && n.data.category === 'medical')
      );
      
      appointments.forEach(appt => {
        const apptDate = new Date(appt.data.dateTime || appt.data.date);
        
        // Find activities on same day
        const sameDay = Object.values(graph.nodes).filter(n => {
          if (n.type !== 'event' || n.id === appt.id) return false;
          const eventDate = new Date(n.data.dateTime || n.data.date);
          return eventDate.toDateString() === apptDate.toDateString();
        });
        
        if (sameDay.length > 0) {
          results.paths.push({
            context: 'Schedule Conflict',
            appointment: appt.data.title,
            conflictingEvents: sameDay.map(e => e.data.title),
            date: apptDate.toDateString()
          });
          
          results.recommendations.push({
            title: 'Consider Rescheduling',
            description: `${appt.data.title} conflicts with ${sameDay.length} other activities`,
            action: 'reschedule',
            targetId: appt.id
          });
        }
      });
    }
    
    return results;
  }
  
  /**
   * Parse context query to understand intent
   */
  parseContextQuery(query) {
    const normalized = query.toLowerCase();
    const words = normalized.split(/\s+/);
    
    // Extract key concepts
    const concepts = {
      help: words.some(w => ['help', 'helped', 'helping', 'assist'].includes(w)),
      reward: words.some(w => ['reward', 'earn', 'earned', 'bucks'].includes(w)),
      activity: words.some(w => ['activity', 'activities', 'event', 'events'].includes(w)),
      appointment: words.some(w => ['appointment', 'doctor', 'medical', 'checkup'].includes(w)),
      homework: words.some(w => ['homework', 'school', 'study', 'assignment'].includes(w)),
      emotion: words.some(w => ['feeling', 'emotion', 'mood', 'happy', 'sad', 'angry'].includes(w)),
      time: words.some(w => ['when', 'time', 'schedule', 'conflict', 'overlap'].includes(w))
    };
    
    return Object.keys(concepts).filter(key => concepts[key]);
  }
  
  /**
   * Run advanced analytics and add mental load insights
   */
  async runAdvancedAnalytics(graph) {
    const insights = [];
    
    try {
      // Calculate mental load
      const mentalLoad = await this.calculateMentalLoad(graph);
      
      // Find imbalances
      const loads = Object.values(mentalLoad);
      const parentLoads = loads.filter(l => l.role === 'parent');
      
      if (parentLoads.length >= 2) {
        const maxLoad = Math.max(...parentLoads.map(p => p.totalLoad));
        const minLoad = Math.min(...parentLoads.map(p => p.totalLoad));
        
        if (maxLoad > minLoad * 1.5) {
          const overloaded = parentLoads.find(p => p.totalLoad === maxLoad);
          const underloaded = parentLoads.find(p => p.totalLoad === minLoad);
          
          insights.push({
            id: `mental-load-imbalance-${Date.now()}`,
            type: 'mental_load_imbalance',
            title: 'Mental Load Imbalance Detected',
            description: `${overloaded.name} has ${(maxLoad / minLoad).toFixed(1)}x the mental load of ${underloaded.name}`,
            severity: 'high',
            confidence: 0.9,
            relatedEntities: [overloaded.name, underloaded.name],
            mentalLoadData: mentalLoad,
            suggestions: [{
              action: 'redistribute_responsibilities',
              details: overloaded.factors.slice(0, 3)
            }]
          });
        }
      }
      
      // Add mental load summary for each person
      Object.entries(mentalLoad).forEach(([personId, load]) => {
        if (load.totalLoad > 20) {
          insights.push({
            id: `high-mental-load-${personId}-${Date.now()}`,
            type: 'high_mental_load',
            title: `High Mental Load: ${load.name}`,
            description: `Current mental load score: ${load.totalLoad.toFixed(1)} (Task: ${load.taskLoad.toFixed(1)}, Emotional: ${load.emotionalLoad.toFixed(1)}, Coordination: ${load.coordinationLoad.toFixed(1)})`,
            severity: load.totalLoad > 30 ? 'high' : 'medium',
            confidence: 0.85,
            relatedEntities: [personId],
            factors: load.factors.slice(0, 5)
          });
        }
      });
      
    } catch (error) {
      console.error('Error in advanced analytics:', error);
    }
    
    return insights;
  }
}

export default EnhancedKnowledgeGraphService;