import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Typography } from '@mui/material';
import { 
  Network, Search, Filter, Sparkles, Brain, Layers, 
  TrendingUp, AlertCircle, ChevronRight, ChevronLeft, X, Plus, 
  RefreshCw, Download, Settings, Eye, EyeOff, Maximize2,
  Calendar, User, FileText, Heart, ShoppingCart, Gift,
  Home, School, Activity, Pill, Car, Clock, MapPin,
  DollarSign, Award, BookOpen, Shirt, Baby, Users,
  Zap, BarChart3, Link, Target, Info, MessageCircle,
  Atom, Cpu, GitBranch, Infinity
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useEvents } from '../../../contexts/EventContext';
import { useChore } from '../../../contexts/ChoreContext';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit as firebaseLimit } from 'firebase/firestore';
import { QuantumKnowledgeGraph } from '../../../services/QuantumKnowledgeGraph';
import QuantumKnowledgeGraphUIFixed from '../../knowledge/QuantumKnowledgeGraphUIFixed';
import QuantumIntegrationService from '../../../services/QuantumIntegrationService';
import * as d3 from 'd3';

// Entity type configurations
const ENTITY_CONFIGS = {
  person: { 
    icon: User, 
    color: '#8B5CF6', 
    label: 'Person',
    subTypes: ['parent', 'child']
  },
  task: { 
    icon: FileText, 
    color: '#3B82F6', 
    label: 'Task',
    subTypes: ['chore', 'habit', 'sequence']
  },
  event: { 
    icon: Calendar, 
    color: '#10B981', 
    label: 'Event',
    subTypes: ['appointment', 'activity', 'meeting']
  },
  location: { 
    icon: MapPin, 
    color: '#F59E0B', 
    label: 'Location',
    subTypes: ['home', 'school', 'provider', 'activity']
  },
  provider: { 
    icon: Pill, 
    color: '#EF4444', 
    label: 'Provider',
    subTypes: ['medical', 'education', 'activity']
  },
  document: { 
    icon: FileText, 
    color: '#6366F1', 
    label: 'Document',
    subTypes: ['medical', 'school', 'legal', 'financial']
  },
  interest: { 
    icon: Heart, 
    color: '#EC4899', 
    label: 'Interest',
    subTypes: ['toy', 'game', 'book', 'sport', 'music']
  },
  wardrobe: { 
    icon: Shirt, 
    color: '#14B8A6', 
    label: 'Wardrobe',
    subTypes: ['clothing', 'shoes', 'accessories']
  },
  financial: { 
    icon: DollarSign, 
    color: '#84CC16', 
    label: 'Financial',
    subTypes: ['bucks', 'reward', 'transaction']
  },
  insight: { 
    icon: Brain, 
    color: '#A855F7', 
    label: 'Insight',
    subTypes: ['pattern', 'recommendation', 'alert']
  }
};

// Relationship type configurations
const RELATIONSHIP_CONFIGS = {
  // Family relationships
  parent_of: { label: 'Parent of', color: '#8B5CF6', strength: 10 },
  child_of: { label: 'Child of', color: '#8B5CF6', strength: 10 },
  sibling_of: { label: 'Sibling of', color: '#8B5CF6', strength: 8 },
  
  // Assignment relationships
  assigned_to: { label: 'Assigned to', color: '#3B82F6', strength: 6 },
  created_by: { label: 'Created by', color: '#3B82F6', strength: 4 },
  completed_by: { label: 'Completed by', color: '#10B981', strength: 5 },
  
  // Event relationships
  attends: { label: 'Attends', color: '#10B981', strength: 5 },
  located_at: { label: 'Located at', color: '#F59E0B', strength: 4 },
  provided_by: { label: 'Provided by', color: '#EF4444', strength: 6 },
  
  // Interest relationships
  loves: { label: 'Loves', color: '#EC4899', strength: 9 },
  likes: { label: 'Likes', color: '#EC4899', strength: 7 },
  owns: { label: 'Owns', color: '#14B8A6', strength: 6 },
  wants: { label: 'Wants', color: '#EC4899', strength: 8 },
  
  // Document relationships
  documents: { label: 'Documents', color: '#6366F1', strength: 5 },
  references: { label: 'References', color: '#6366F1', strength: 4 },
  
  // Financial relationships
  earns: { label: 'Earns', color: '#84CC16', strength: 6 },
  spends: { label: 'Spends', color: '#84CC16', strength: 6 },
  rewards: { label: 'Rewards', color: '#84CC16', strength: 7 },
  
  // Insight relationships
  suggests: { label: 'Suggests', color: '#A855F7', strength: 8 },
  predicts: { label: 'Predicts', color: '#A855F7', strength: 7 },
  relates_to: { label: 'Relates to', color: '#6B7280', strength: 3 },
  
  // Sibling dynamics relationships
  appreciates: { label: 'Appreciates', color: '#EC4899', strength: 8 },
  appreciated_by: { label: 'Appreciated by', color: '#EC4899', strength: 8 },
  teaches: { label: 'Teaches', color: '#9C27B0', strength: 9 }
};

const PowerfulKnowledgeGraphTab = () => {
  const { familyId, familyMembers, taskRecommendations } = useFamily();
  const { events } = useEvents();
  const { choreTemplates, choreInstances } = useChore();
  const { openDrawerWithPrompt } = useChatDrawer();
  
  // New state for quantum mode
  const [quantumMode, setQuantumMode] = useState(true);
  const [quantumInitialized, setQuantumInitialized] = useState(false);
  
  // Additional data states
  const [documents, setDocuments] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [places, setPlaces] = useState([]);
  const [interests, setInterests] = useState([]);
  const [siblingAppreciations, setSiblingAppreciations] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState([]);
  
  // Initialize knowledge graph service
  const graphService = useRef(null);
  
  // State
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    entityTypes: Object.keys(ENTITY_CONFIGS),
    relationshipTypes: Object.keys(RELATIONSHIP_CONFIGS),
    timeRange: 'all',
    showInsights: true,
    showPredictions: true
  });
  const [viewMode, setViewMode] = useState('force'); // force, hierarchical, timeline, geographic
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pathFinderOpen, setPathFinderOpen] = useState(false);
  const [pathFinderStart, setPathFinderStart] = useState(null);
  const [pathFinderEnd, setPathFinderEnd] = useState(null);
  const [foundPath, setFoundPath] = useState(null);
  const [contextQueryOpen, setContextQueryOpen] = useState(false);
  const [contextQuery, setContextQuery] = useState('');
  const [contextResults, setContextResults] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start with sidebar collapsed
  const [notification, setNotification] = useState(null);
  
  // Refs
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const graphContainerRef = useRef(null);
  
  // Show notification
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);
  
  // Initialize Quantum Integration when quantum mode is enabled
  useEffect(() => {
    const initializeQuantum = async () => {
      if (quantumMode && !quantumInitialized && familyId) {
        try {
          showNotification('Initializing Quantum Knowledge Graph... 🚀', 'info');
          await QuantumIntegrationService.initialize(familyId);
          setQuantumInitialized(true);
          showNotification('Quantum Knowledge Graph initialized! Your family now has superpowers! ✨', 'success');
        } catch (error) {
          console.error('Error initializing quantum integration:', error);
          showNotification('Failed to initialize Quantum Knowledge Graph', 'error');
          setQuantumMode(false);
        }
      }
    };
    
    initializeQuantum();
  }, [quantumMode, quantumInitialized, familyId, showNotification]);
  
  // Build knowledge graph from all data sources
  const buildKnowledgeGraph = useCallback(async () => {
    setLoading(true);
    console.log('=== Building Knowledge Graph ===');
    console.log('Family members:', familyMembers?.length || 0);
    console.log('Events:', events?.length || 0);
    console.log('Documents:', documents?.length || 0);
    console.log('Survey responses:', surveyResponses?.length || 0);
    console.log('Places:', places?.length || 0);
    console.log('Chore instances:', choreInstances?.length || 0);
    
    try {
      // Check if we have family data
      if (!familyMembers || familyMembers.length === 0) {
        console.log('No family members found, showing empty state');
        setNodes([]);
        setLinks([]);
        setLoading(false);
        return;
      }
      
      // Try to use QuantumKnowledgeGraph data first
      let useQuantumData = false;
      if (graphService.current && familyId) {
        console.log('=== Attempting to use QuantumKnowledgeGraph ===');
        
        try {
          // Make sure the graph is initialized and loaded
          await graphService.current.initializeGraph(familyId);
          
          const quantumGraph = await graphService.current.getGraph(familyId);
          console.log('QuantumGraph retrieved:', {
            hasEntities: !!quantumGraph?.entities,
            entityCount: quantumGraph?.entities ? Object.keys(quantumGraph.entities).length : 0,
            hasRelationships: !!quantumGraph?.relationships,
            relationshipCount: quantumGraph?.relationships?.length || 0
          });
          
          if (quantumGraph && quantumGraph.entities && Object.keys(quantumGraph.entities).length > 10) {
            const quantumNodes = [];
            const quantumLinks = [];
            const nodeMap = new Map();
            
            console.log(`=== Processing ${Object.keys(quantumGraph.entities).length} quantum entities ===`);
            
            // Convert quantum entities to graph nodes with better label extraction
            Object.entries(quantumGraph.entities).forEach(([entityId, entity]) => {
              const nodeType = entity.type.replace('quantum_', ''); // Remove quantum_ prefix
              
              // Debug logging for events
              if (entity.type === 'quantum_event' || nodeType === 'event') {
                console.log(`Processing event entity:`, {
                  entityId,
                  originalType: entity.type,
                  nodeType,
                  title: entity.properties?.title,
                  properties: entity.properties
                });
              }
              
              // Better label extraction based on entity type
              let label = entity.id;
              if (entity.properties) {
                if (nodeType === 'person') {
                  label = entity.properties.name || entity.properties.displayName || label;
                } else if (nodeType === 'event') {
                  label = entity.properties.title || entity.properties.summary || label;
                } else if (nodeType === 'document') {
                  label = entity.properties.name || entity.properties.fileName || label;
                } else if (nodeType === 'email' || nodeType === 'memory') {
                  label = entity.properties.subject || entity.properties.from || label;
                } else if (nodeType === 'place') {
                  label = entity.properties.name || entity.properties.address || label;
                } else if (nodeType === 'contact') {
                  label = entity.properties.name || entity.properties.email || label;
                } else if (nodeType === 'insight') {
                  // Changed from 'surveyResponse' to 'insight' to match quantum_insight type
                  label = `Survey: ${entity.properties.respondentName || 'Response'}`;
                } else {
                  label = entity.properties.name || 
                         entity.properties.title || 
                         entity.properties.subject || 
                         entity.properties.body?.substring(0, 30) || 
                         label;
                }
              }
              
              const node = {
                id: entity.id,
                type: nodeType,
                label: label,
                properties: entity.properties || {},
                x: Math.random() * 800,
                y: Math.random() * 600
              };
              quantumNodes.push(node);
              nodeMap.set(entity.id, node);
            });
            
            // Convert quantum relationships to graph links
            if (quantumGraph.relationships && Array.isArray(quantumGraph.relationships)) {
              console.log(`Processing ${quantumGraph.relationships.length} relationships`);
              quantumGraph.relationships.forEach(rel => {
                if (rel.from && rel.to && nodeMap.has(rel.from) && nodeMap.has(rel.to)) {
                  quantumLinks.push({
                    source: rel.from,
                    target: rel.to,
                    type: rel.type || 'related_to',
                    properties: rel.properties || {}
                  });
                }
              });
            }
            
            console.log(`=== Successfully built graph from QuantumKnowledgeGraph ===`);
            console.log(`Nodes: ${quantumNodes.length}, Links: ${quantumLinks.length}`);
            
            // Debug: Count node types
            const nodeTypeCounts = {};
            quantumNodes.forEach(node => {
              nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
            });
            console.log('Node type counts:', nodeTypeCounts);
            console.log('Event nodes:', quantumNodes.filter(n => n.type === 'event').length);
            
            setNodes(quantumNodes);
            setLinks(quantumLinks);
            useQuantumData = true;
            
            // Generate dynamic insights from the quantum data
            try {
              const dynamicInsights = await graphService.current.generateLivingInsights(familyId);
              console.log(`Generated ${dynamicInsights.length} dynamic insights`);
              setInsights(dynamicInsights);
            } catch (error) {
              console.error('Error generating insights:', error);
              setInsights([]);
            }
            
            setLoading(false);
            return;
          } else {
            console.log('QuantumKnowledgeGraph has insufficient data (< 10 entities), falling back to manual build');
          }
        } catch (error) {
          console.error('Error using QuantumKnowledgeGraph:', error);
        }
      }
      
      const graphNodes = [];
      const graphLinks = [];
      const nodeMap = new Map();
      
      // Get children for sibling calculations
      const children = familyMembers.filter(member => member.role === 'child');
      
      // Helper to add node
      const addNode = (id, type, label, properties = {}) => {
        if (!nodeMap.has(id)) {
          const node = {
            id,
            type,
            label,
            properties,
            x: Math.random() * 800,
            y: Math.random() * 600
          };
          graphNodes.push(node);
          nodeMap.set(id, node);
        }
        return nodeMap.get(id);
      };
      
      // Helper to add link
      const addLink = (sourceId, targetId, type, properties = {}) => {
        if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
          graphLinks.push({
            source: sourceId,
            target: targetId,
            type,
            properties
          });
        }
      };
      
      // 1. Add family members
      familyMembers.forEach(member => {
        addNode(
          member.id,
          'person',
          member.name,
          {
            role: member.role,
            age: member.age,
            birthDate: member.birthDate,
            subType: member.role
          }
        );
      });
      
      // Add family relationships
      const parents = familyMembers.filter(m => m.role === 'parent');
      // Use the children variable that was already declared above
      
      parents.forEach(parent => {
        children.forEach(child => {
          addLink(parent.id, child.id, 'parent_of');
          addLink(child.id, parent.id, 'child_of');
        });
      });
      
      // Add sibling relationships
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          addLink(children[i].id, children[j].id, 'sibling_of');
          addLink(children[j].id, children[i].id, 'sibling_of');
        }
      }
      
      // 2. Add tasks and habits
      if (taskRecommendations) {
        taskRecommendations.forEach(task => {
          const taskNode = addNode(
            task.id,
            'task',
            task.title,
            {
              category: task.category,
              completed: task.completed,
              weight: task.weight,
              subType: task.isHabit ? 'habit' : 'task'
            }
          );
          
          // Link to assigned person
          if (task.assignedTo) {
            const assignee = familyMembers.find(m => 
              m.name === task.assignedToName || m.roleType === task.assignedTo
            );
            if (assignee) {
              addLink(task.id, assignee.id, 'assigned_to');
              if (task.completed) {
                addLink(assignee.id, task.id, 'completed_by');
              }
            }
          }
        });
      }
      
      // 3. Add events
      console.log('Building graph - Events available:', events?.length || 0);
      if (events && events.length > 0) {
        events.forEach(event => {
          const eventNode = addNode(
            event.id,
            'event',
            event.title,
            {
              date: event.dateTime,
              category: event.category,
              location: event.location,
              subType: event.eventType || 'event'
            }
          );
          
          // Link to attendees
          if (event.attendees) {
            event.attendees.forEach(attendeeId => {
              addLink(attendeeId, event.id, 'attends');
            });
          }
          
          // Add location node if exists
          if (event.location) {
            const locationId = `loc-${event.location.replace(/\s+/g, '-').toLowerCase()}`;
            const locationNode = addNode(
              locationId,
              'location',
              event.location,
              { type: 'event-location' }
            );
            addLink(event.id, locationId, 'located_at');
          }
        });
      }
      
      // 4. Generate insights based on patterns
      const generatedInsights = generateInsights(graphNodes, graphLinks);
      generatedInsights.forEach((insight, index) => {
        const insightNode = addNode(
          `insight-${index}`,
          'insight',
          insight.title,
          {
            description: insight.description,
            severity: insight.severity,
            subType: 'pattern'
          }
        );
        
        // Link insight to related entities
        insight.relatedEntities.forEach(entityId => {
          addLink(insightNode.id, entityId, 'relates_to');
        });
      });
      setInsights(generatedInsights);
      
      // 5. Generate predictions
      const generatedPredictions = generatePredictions(graphNodes, graphLinks);
      generatedPredictions.forEach((prediction, index) => {
        const predictionNode = addNode(
          `prediction-${index}`,
          'insight',
          prediction.title,
          {
            description: prediction.description,
            confidence: prediction.confidence,
            subType: 'prediction'
          }
        );
        
        // Link prediction to related entities
        prediction.relatedEntities.forEach(entityId => {
          addLink(predictionNode.id, entityId, 'predicts');
        });
      });
      setPredictions(generatedPredictions);
      
      // 6. Add documents
      if (documents && documents.length > 0) {
        documents.forEach(doc => {
          const docNode = addNode(
            doc.id,
            'document',
            doc.title || doc.fileName,
            {
              category: doc.category,
              uploadedAt: doc.uploadedAt,
              reviewed: doc.reviewed,
              subType: doc.category || 'document'
            }
          );
          
          // Link to uploader
          if (doc.uploadedBy) {
            addLink(doc.uploadedBy, doc.id, 'documents');
          }
        });
      }
      
      // 7. Add rewards
      if (rewards && rewards.length > 0) {
        rewards.forEach(reward => {
          const rewardNode = addNode(
            reward.id,
            'financial',
            reward.rewardTitle,
            {
              price: reward.price,
              status: reward.status,
              subType: 'reward'
            }
          );
          
          // Link to child
          if (reward.childId) {
            addLink(reward.childId, reward.id, 'rewards');
          }
        });
      }
      
      // 8. Add places
      if (places && places.length > 0) {
        places.forEach(place => {
          const placeNode = addNode(
            place.id,
            'location',
            place.name,
            {
              address: place.address,
              category: place.category,
              subType: place.category || 'place'
            }
          );
          
          // Link related events to places
          events?.forEach(event => {
            if (event.location && event.location.includes(place.name)) {
              addLink(event.id, place.id, 'located_at');
            }
          });
        });
      }
      
      // 9. Add interests
      if (interests && interests.length > 0) {
        interests.forEach(interest => {
          const interestNode = addNode(
            interest.id,
            'interest',
            interest.name,
            {
              category: interest.category,
              level: interest.level,
              subType: interest.type || 'interest'
            }
          );
          
          // Link to child
          if (interest.childId) {
            addLink(interest.childId, interest.id, interest.level === 'high' ? 'loves' : 'likes');
          }
        });
      }
      
      // 10. Add chores
      if (choreInstances && choreInstances.length > 0) {
        choreInstances.forEach(chore => {
          const choreNode = addNode(
            chore.id,
            'task',
            chore.title,
            {
              date: chore.date,
              status: chore.status,
              bucksReward: chore.bucksReward,
              subType: 'chore'
            }
          );
          
          // Link to assigned child
          if (chore.childId) {
            addLink(chore.childId, chore.id, 'assigned_to');
            if (chore.status === 'completed') {
              addLink(chore.childId, chore.id, 'completed_by');
            }
          }
        });
      }
      
      // 11. Add sibling appreciations
      if (siblingAppreciations && siblingAppreciations.length > 0) {
        siblingAppreciations.forEach(appreciation => {
          const appreciationNode = addNode(
            appreciation.id,
            'insight',
            `${appreciation.sticker} ${appreciation.reason}`,
            {
              from: appreciation.fromName,
              to: appreciation.toName,
              createdAt: appreciation.createdAt,
              subType: 'appreciation'
            }
          );
          
          // Link between siblings
          if (appreciation.fromId && appreciation.toId) {
            addLink(appreciation.fromId, appreciationNode.id, 'appreciates');
            addLink(appreciationNode.id, appreciation.toId, 'appreciated_by');
            
            // Add special teaching relationship if older sibling helped younger
            const fromChild = familyMembers.find(m => m.id === appreciation.fromId);
            const toChild = familyMembers.find(m => m.id === appreciation.toId);
            if (fromChild && toChild && fromChild.age > toChild.age) {
              addLink(appreciation.fromId, appreciation.toId, 'teaches');
            }
          }
        });
      }
      
      // 12. Add sibling dynamics insights
      if (surveyResponses && surveyResponses.length > 0) {
        const siblingDynamicsSurveys = surveyResponses.filter(r => r.surveyType === 'sibling-dynamics');
        
        siblingDynamicsSurveys.forEach(survey => {
          const surveyNode = addNode(
            survey.id,
            'insight',
            'Sibling Dynamics Assessment',
            {
              completedAt: survey.completedAt,
              score: survey.score,
              level: survey.level,
              subType: 'survey'
            }
          );
          
          // Link to person who completed it
          if (survey.userId) {
            addLink(survey.userId, surveyNode.id, 'completed_by');
          }
          
          // Add recommendations as separate nodes
          if (survey.recommendations) {
            survey.recommendations.forEach((rec, idx) => {
              const recNode = addNode(
                `${survey.id}-rec-${idx}`,
                'insight',
                rec,
                {
                  type: 'recommendation',
                  subType: 'recommendation'
                }
              );
              addLink(surveyNode.id, recNode.id, 'suggests');
            });
          }
        });
      }
      
      // 13. Calculate and add sibling dynamics metrics
      const siblingPairs = [];
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          const interactions = siblingAppreciations.filter(a => 
            (a.fromId === children[i].id && a.toId === children[j].id) ||
            (a.fromId === children[j].id && a.toId === children[i].id)
          );
          
          if (interactions.length > 0) {
            const pairNode = addNode(
              `pair-${children[i].id}-${children[j].id}`,
              'insight',
              `${children[i].name} & ${children[j].name} Dynamics`,
              {
                interactionCount: interactions.length,
                lastInteraction: interactions[0]?.createdAt,
                subType: 'sibling-pair'
              }
            );
            
            addLink(children[i].id, pairNode.id, 'sibling_of');
            addLink(children[j].id, pairNode.id, 'sibling_of');
          }
        }
      }
      
      console.log(`Built knowledge graph with ${graphNodes.length} nodes and ${graphLinks.length} links`);
      
      // Debug: Log node distribution by type
      const nodesByType = {};
      graphNodes.forEach(node => {
        nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
      });
      console.log('Nodes by type:', nodesByType);
      
      // Set the final nodes and links
      setNodes(graphNodes);
      setLinks(graphLinks);
      setLoading(false);
      
    } catch (error) {
      console.error('Error building knowledge graph:', error);
      setLoading(false);
    }
  }, [familyMembers, taskRecommendations, events, documents, rewards, places, interests, choreInstances, siblingAppreciations, surveyResponses]);
  
  // Generate insights from graph patterns
  const generateInsights = (nodes, links) => {
    const insights = [];
    
    // Insight 1: Task imbalance
    const tasksByPerson = {};
    links.filter(l => l.type === 'assigned_to').forEach(link => {
      const person = nodes.find(n => n.id === link.target);
      if (person && person.type === 'person') {
        tasksByPerson[person.id] = (tasksByPerson[person.id] || 0) + 1;
      }
    });
    
    const taskCounts = Object.values(tasksByPerson);
    if (taskCounts.length >= 2) {
      const max = Math.max(...taskCounts);
      const min = Math.min(...taskCounts);
      if (max > min * 2) {
        const overloadedPerson = Object.entries(tasksByPerson)
          .find(([id, count]) => count === max);
        const underloadedPerson = Object.entries(tasksByPerson)
          .find(([id, count]) => count === min);
        
        if (overloadedPerson && underloadedPerson) {
          insights.push({
            title: 'Task Distribution Imbalance',
            description: `${nodes.find(n => n.id === overloadedPerson[0])?.label} has significantly more tasks than ${nodes.find(n => n.id === underloadedPerson[0])?.label}`,
            severity: 'high',
            relatedEntities: [overloadedPerson[0], underloadedPerson[0]]
          });
        }
      }
    }
    
    // Insight 2: Incomplete task patterns
    const incompleteTasks = nodes.filter(n => 
      n.type === 'task' && !n.properties.completed
    );
    if (incompleteTasks.length > 5) {
      insights.push({
        title: 'High Number of Incomplete Tasks',
        description: `${incompleteTasks.length} tasks are currently incomplete. Consider prioritizing or redistributing.`,
        severity: 'medium',
        relatedEntities: incompleteTasks.slice(0, 3).map(t => t.id)
      });
    }
    
    return insights;
  };
  
  // Generate predictions based on patterns
  const generatePredictions = (nodes, links) => {
    const predictions = [];
    
    // Prediction 1: Upcoming task overload
    const upcomingEvents = nodes.filter(n => 
      n.type === 'event' && 
      new Date(n.properties.date) > new Date() &&
      new Date(n.properties.date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    
    if (upcomingEvents.length > 10) {
      predictions.push({
        title: 'Busy Week Ahead',
        description: `${upcomingEvents.length} events scheduled in the next 7 days. Consider rescheduling non-essential activities.`,
        confidence: 0.85,
        relatedEntities: upcomingEvents.slice(0, 3).map(e => e.id)
      });
    }
    
    return predictions;
  };
  
  // Load additional data sources
  useEffect(() => {
    if (!familyId) return;
    
    const unsubscribers = [];
    
    // Load documents
    const docsQuery = query(
      collection(db, 'familyDocuments'),
      where('familyId', '==', familyId),
      orderBy('uploadedAt', 'desc'),
      firebaseLimit(100)
    );
    unsubscribers.push(
      onSnapshot(docsQuery, (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setDocuments(docs);
        console.log(`Loaded ${docs.length} documents`);
      })
    );
    
    // Load rewards
    const rewardsQuery = query(
      collection(db, 'rewardInstances'),
      where('familyId', '==', familyId),
      orderBy('requestedAt', 'desc'),
      firebaseLimit(100)
    );
    unsubscribers.push(
      onSnapshot(rewardsQuery, (snapshot) => {
        const rewardsList = [];
        snapshot.forEach((doc) => {
          rewardsList.push({ id: doc.id, ...doc.data() });
        });
        setRewards(rewardsList);
        console.log(`Loaded ${rewardsList.length} rewards`);
      })
    );
    
    // Load places
    const placesQuery = query(
      collection(db, 'familyPlaces'),
      where('familyId', '==', familyId),
      firebaseLimit(100)
    );
    unsubscribers.push(
      onSnapshot(placesQuery, (snapshot) => {
        const placesList = [];
        snapshot.forEach((doc) => {
          placesList.push({ id: doc.id, ...doc.data() });
        });
        setPlaces(placesList);
        console.log(`Loaded ${placesList.length} places`);
      })
    );
    
    // Load child interests
    const interestsQuery = query(
      collection(db, 'childInterests'),
      where('familyId', '==', familyId),
      firebaseLimit(100)
    );
    unsubscribers.push(
      onSnapshot(interestsQuery, (snapshot) => {
        const interestsList = [];
        snapshot.forEach((doc) => {
          interestsList.push({ id: doc.id, ...doc.data() });
        });
        setInterests(interestsList);
        console.log(`Loaded ${interestsList.length} interests`);
      })
    );
    
    // Load sibling appreciations
    const appreciationsQuery = query(
      collection(db, 'siblingAppreciation'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      firebaseLimit(100)
    );
    unsubscribers.push(
      onSnapshot(appreciationsQuery, (snapshot) => {
        const appreciationsList = [];
        snapshot.forEach((doc) => {
          appreciationsList.push({ id: doc.id, ...doc.data() });
        });
        setSiblingAppreciations(appreciationsList);
        console.log(`Loaded ${appreciationsList.length} sibling appreciations`);
      })
    );
    
    // Load survey responses
    const surveysQuery = query(
      collection(db, 'surveyResponses'),
      where('familyId', '==', familyId),
      orderBy('completedAt', 'desc'),
      firebaseLimit(50)
    );
    unsubscribers.push(
      onSnapshot(surveysQuery, (snapshot) => {
        const surveysList = [];
        snapshot.forEach((doc) => {
          surveysList.push({ id: doc.id, ...doc.data() });
        });
        setSurveyResponses(surveysList);
        console.log(`Loaded ${surveysList.length} survey responses`);
      })
    );
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [familyId]);

  // Initialize graph service
  useEffect(() => {
    if (!familyId) return;

    // Create the service instance if not already created
    if (!graphService.current) {
      console.log('Creating QuantumKnowledgeGraph service instance');
      graphService.current = new QuantumKnowledgeGraph();
    }
  }, [familyId]);

  // Build graph when data is loaded
  useEffect(() => {
    // Check if we have the minimum required data to build the graph
    const hasMinimumData = familyMembers && familyMembers.length > 0;

    if (hasMinimumData && familyId) {
      console.log('Data loaded, building knowledge graph automatically...');
      buildKnowledgeGraph();
    }
  }, [familyMembers, events, documents, rewards, places, interests, choreInstances, siblingAppreciations, surveyResponses, buildKnowledgeGraph, familyId]);
  
  // Render D3 force graph
  useEffect(() => {
    if (!nodes.length || !svgRef.current || viewMode !== 'force') return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous graph
    svg.selectAll('*').remove();
    
    // Create container groups
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          const config = RELATIONSHIP_CONFIGS[d.type];
          return config ? 150 - (config.strength * 10) : 100;
        })
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    simulationRef.current = simulation;
    
    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        // Highlight path links
        if (selectedPath && selectedPath.length > 1) {
          for (let i = 0; i < selectedPath.length - 1; i++) {
            const sourceId = d.source.id || d.source;
            const targetId = d.target.id || d.target;
            if ((sourceId === selectedPath[i] && targetId === selectedPath[i + 1]) ||
                (targetId === selectedPath[i] && sourceId === selectedPath[i + 1])) {
              return '#8B5CF6';
            }
          }
        }
        return RELATIONSHIP_CONFIGS[d.type]?.color || '#999';
      })
      .attr('stroke-opacity', d => {
        // Highlight path links
        if (selectedPath && selectedPath.length > 1) {
          for (let i = 0; i < selectedPath.length - 1; i++) {
            const sourceId = d.source.id || d.source;
            const targetId = d.target.id || d.target;
            if ((sourceId === selectedPath[i] && targetId === selectedPath[i + 1]) ||
                (targetId === selectedPath[i] && sourceId === selectedPath[i + 1])) {
              return 1;
            }
          }
        }
        return 0.6;
      })
      .attr('stroke-width', d => {
        // Highlight path links
        if (selectedPath && selectedPath.length > 1) {
          for (let i = 0; i < selectedPath.length - 1; i++) {
            const sourceId = d.source.id || d.source;
            const targetId = d.target.id || d.target;
            if ((sourceId === selectedPath[i] && targetId === selectedPath[i + 1]) ||
                (targetId === selectedPath[i] && sourceId === selectedPath[i + 1])) {
              return 4;
            }
          }
        }
        return RELATIONSHIP_CONFIGS[d.type]?.strength / 3 || 1;
      });
    
    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );
    
    // Add circles
    node.append('circle')
      .attr('r', d => {
        const baseSize = 20;
        const connections = links.filter(l => l.source.id === d.id || l.target.id === d.id).length;
        return baseSize + Math.min(connections * 2, 20);
      })
      .attr('fill', d => ENTITY_CONFIGS[d.type]?.color || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Add icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-family', 'Font Awesome 5 Free')
      .text(d => {
        const config = ENTITY_CONFIGS[d.type];
        return config ? '●' : '?'; // Placeholder for icon
      });
    
    // Add labels
    node.append('text')
      .attr('x', 0)
      .attr('y', d => {
        const connections = links.filter(l => l.source.id === d.id || l.target.id === d.id).length;
        return 20 + Math.min(connections * 2, 20) + 10;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text(d => d.label);
    
    // Add click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, viewMode, selectedPath]);
  
  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Entity type filter
      if (!filters.entityTypes.includes(node.type)) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return node.label.toLowerCase().includes(query) ||
               JSON.stringify(node.properties).toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [nodes, filters, searchQuery]);
  
  // Get connected nodes for selected node
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    
    const connected = new Set();
    links.forEach(link => {
      if (link.source.id === selectedNode.id || link.source === selectedNode.id) {
        connected.add(link.target.id || link.target);
      }
      if (link.target.id === selectedNode.id || link.target === selectedNode.id) {
        connected.add(link.source.id || link.source);
      }
    });
    
    return nodes.filter(n => connected.has(n.id));
  }, [selectedNode, nodes, links]);
  
  // Analyze patterns in the graph
  const analyzePatterns = useCallback(async () => {
    try {
      setLoading(true);
      
      // Run local analysis
      console.log('Running pattern analysis...');

      const newInsights = generateInsights(nodes, links);
      const newPredictions = generatePredictions(nodes, links);

      setInsights(newInsights);
      setPredictions(newPredictions);

      showNotification(`Analysis complete! Found ${newInsights.length} insights and ${newPredictions.length} predictions.`, 'success');
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      showNotification('Failed to analyze patterns. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [nodes, links, familyId, showNotification]);
  
  // Handle context query
  const handleContextQuery = useCallback(async () => {
    if (!contextQuery.trim()) {
      alert('Please enter a query');
      return;
    }

    try {
      setLoading(true);

      // Simple local search through nodes and links
      const query = contextQuery.toLowerCase();
      const matchingNodes = nodes.filter(node =>
        node.label.toLowerCase().includes(query) ||
        JSON.stringify(node.properties).toLowerCase().includes(query)
      );

      const relatedLinks = links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return matchingNodes.some(n => n.id === sourceId || n.id === targetId);
      });

      setContextResults({
        query: contextQuery,
        matchingNodes,
        relatedLinks,
        paths: [],
        insights: matchingNodes.length > 0 ? [{
          title: `Found ${matchingNodes.length} related entities`,
          description: `Your search for "${contextQuery}" found ${matchingNodes.length} nodes and ${relatedLinks.length} connections.`,
          confidence: 1.0
        }] : []
      });

      showNotification(`Context query complete! Found ${matchingNodes.length} matching entities.`, 'success');
    } catch (error) {
      console.error('Error executing context query:', error);
      alert('Failed to execute query. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [contextQuery, nodes, links, showNotification]);
  
  // Find path between two nodes
  const findPath = useCallback(async () => {
    if (!pathFinderStart || !pathFinderEnd) {
      alert('Please select both start and end nodes');
      return;
    }
    
    try {
      // Simple BFS path finding
      const visited = new Set();
      const queue = [{ node: pathFinderStart, path: [pathFinderStart] }];
      let found = null;
      
      while (queue.length > 0 && !found) {
        const { node, path } = queue.shift();
        
        if (node === pathFinderEnd) {
          found = path;
          break;
        }
        
        if (visited.has(node)) continue;
        visited.add(node);
        
        // Find connected nodes
        links.forEach(link => {
          let nextNode = null;
          if ((link.source.id || link.source) === node) {
            nextNode = link.target.id || link.target;
          } else if ((link.target.id || link.target) === node) {
            nextNode = link.source.id || link.source;
          }
          
          if (nextNode && !visited.has(nextNode)) {
            queue.push({ node: nextNode, path: [...path, nextNode] });
          }
        });
      }
      
      if (found) {
        setFoundPath(found);
        setSelectedPath(found);
        
        // Highlight path in visualization
        if (simulationRef.current) {
          simulationRef.current.alpha(0.3).restart();
        }
      } else {
        console.log('No path found between selected nodes');
      }
    } catch (error) {
      console.error('Error finding path:', error);
      console.error('Failed to find path');
    }
  }, [pathFinderStart, pathFinderEnd, links]);
  
  // Render different view modes
  const renderGraphView = () => {
    // For now, all views use the same force graph with different layouts
    // TODO: Implement specialized views in the future
    return (
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        style={{ background: '#F9FAFB' }}
      />
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  // Empty state
  if (!nodes.length && !loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Network size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">Start by adding family members and activities to see your knowledge graph.</p>
          <button
            onClick={buildKnowledgeGraph}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Graph
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full" ref={graphContainerRef}>
      {/* Left Sidebar - Controls and Insights */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 border-r border-gray-200 bg-[#FBFBFA] flex flex-col ${sidebarCollapsed ? 'overflow-hidden' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Graph</h2>
            <button
              onClick={buildKnowledgeGraph}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh graph"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          {/* Data Summary */}
          <div className="text-xs text-gray-500 mb-2">
            {nodes.length} nodes • {links.length} connections
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* View Mode Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="text-sm font-medium text-gray-700 mb-2 block">View Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'force', label: 'Network', icon: Network },
              { id: 'hierarchical', label: 'Hierarchy', icon: Layers },
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'geographic', label: 'Location', icon: MapPin }
            ].map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center justify-center space-x-2 p-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === mode.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Entity Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Entity Types</label>
              <div className="space-y-1">
                {Object.entries(ENTITY_CONFIGS).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.entityTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              entityTypes: [...prev.entityTypes, type]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              entityTypes: prev.entityTypes.filter(t => t !== type)
                            }));
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <Icon size={14} style={{ color: config.color }} />
                      <span className="text-sm text-gray-700">{config.label}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {nodes.filter(n => n.type === type).length}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Insights & Predictions Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Intelligence</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showInsights}
                    onChange={(e) => setFilters(prev => ({ ...prev, showInsights: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <Brain size={14} className="text-purple-600" />
                  <span className="text-sm text-gray-700">Show Insights</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showPredictions}
                    onChange={(e) => setFilters(prev => ({ ...prev, showPredictions: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <Sparkles size={14} className="text-purple-600" />
                  <span className="text-sm text-gray-700">Show Predictions</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Entities</p>
              <p className="text-xl font-bold text-gray-900">{nodes.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Connections</p>
              <p className="text-xl font-bold text-gray-900">{links.length}</p>
            </div>
          </div>
          
          {/* Data Sources */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Data Sources</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Family Members</span>
                <span className="font-medium">{familyMembers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Events</span>
                <span className="font-medium">{events?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks</span>
                <span className="font-medium">{taskRecommendations?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Chores</span>
                <span className="font-medium">{choreInstances?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Documents</span>
                <span className="font-medium">{documents?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Places</span>
                <span className="font-medium">{places?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Interests</span>
                <span className="font-medium">{interests?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Appreciations</span>
                <span className="font-medium">{siblingAppreciations?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Graph Toolbar */}
        <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                // Toggle sidebar
                setSidebarCollapsed(!sidebarCollapsed);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button 
              onClick={() => {
                // Center and fit graph to screen
                if (simulationRef.current) {
                  const svg = d3.select(svgRef.current);
                  const bounds = svg.node().getBoundingClientRect();
                  const centerX = bounds.width / 2;
                  const centerY = bounds.height / 2;
                  
                  simulationRef.current.force('center', d3.forceCenter(centerX, centerY));
                  simulationRef.current.alpha(0.3).restart();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Fit to screen"
            >
              <Maximize2 size={18} />
            </button>
            <button 
              onClick={() => {
                // Toggle fullscreen
                if (!document.fullscreenElement) {
                  graphContainerRef.current?.requestFullscreen();
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen();
                  setIsFullscreen(false);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
            
            {/* Quantum Mode Toggle */}
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <button
              onClick={() => setQuantumMode(!quantumMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                quantumMode 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={quantumMode ? "Switch to Simple View" : "Enable Quantum Superpowers"}
            >
              {quantumMode ? (
                <>
                  <Atom size={18} className="animate-pulse" />
                  <span>Quantum Superpowers</span>
                  <Sparkles size={16} className="animate-spin-slow" />
                </>
              ) : (
                <>
                  <Network size={18} />
                  <span>Simple View</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{filteredNodes.length} nodes visible</span>
            <span>{connectedNodes.length} connected</span>
            {quantumMode && quantumInitialized && (
              <span className="text-purple-600 font-medium flex items-center">
                <Cpu size={14} className="mr-1" />
                Quantum Active
              </span>
            )}
          </div>
        </div>
        
        {/* Graph Visualization */}
        <div className="flex-1 relative overflow-hidden">
          {quantumMode ? (
            <QuantumKnowledgeGraphUIFixed familyId={familyId} />
          ) : (
            <>
              {renderGraphView()}
              
              {/* Selected Node Details */}
              {selectedNode && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = ENTITY_CONFIGS[selectedNode.type]?.icon || FileText;
                    return (
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${ENTITY_CONFIGS[selectedNode.type]?.color}20` }}
                      >
                        <Icon size={20} style={{ color: ENTITY_CONFIGS[selectedNode.type]?.color }} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
                    <p className="text-sm text-gray-500">{ENTITY_CONFIGS[selectedNode.type]?.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Properties */}
              <div className="space-y-2 mb-4">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-gray-900 font-medium">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Connected Nodes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Connections ({connectedNodes.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {connectedNodes.map(node => {
                    const Icon = ENTITY_CONFIGS[node.type]?.icon || FileText;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors text-left"
                      >
                        <Icon size={14} style={{ color: ENTITY_CONFIGS[node.type]?.color }} />
                        <span className="text-sm text-gray-900">{node.label}</span>
                        <span className="text-xs text-gray-500 ml-auto">{node.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
      
      {/* Right Sidebar - Insights & Predictions */}
      <div className="w-80 border-l border-gray-200 bg-[#FBFBFA] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="mr-2 text-purple-600" size={20} />
            AI Intelligence
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Insights */}
          {filters.showInsights && insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Sparkles size={14} className="mr-1" />
                Insights
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      insight.severity === 'high' 
                        ? 'border-red-200 bg-red-50 hover:border-red-300'
                        : insight.severity === 'medium'
                        ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                        : 'border-green-200 bg-green-50 hover:border-green-300'
                    }`}
                    onClick={() => {
                      const node = nodes.find(n => insight.relatedEntities.includes(n.id));
                      if (node) setSelectedNode(node);
                    }}
                  >
                    <h5 className="font-medium text-sm text-gray-900 mb-1">
                      {insight.title}
                    </h5>
                    <p className="text-xs text-gray-600">
                      {insight.description}
                    </p>
                    
                    {/* Mental Load Visualization */}
                    {insight.type === 'mental_load_imbalance' && insight.mentalLoadData && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(insight.mentalLoadData).map(([personId, load]) => (
                          <div key={personId} className="flex items-center text-xs">
                            <span className="w-20 truncate">{load.name}:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (load.totalLoad / 40) * 100)}%` }}
                              />
                            </div>
                            <span className="ml-2 text-gray-700">{load.totalLoad.toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mental Load Factors */}
                    {insight.type === 'high_mental_load' && insight.factors && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div className="font-medium mb-1">Top contributors:</div>
                        {insight.factors.slice(0, 3).map((factor, idx) => (
                          <div key={idx} className="ml-2">
                            • {factor.name} ({factor.contribution.toFixed(1)} pts)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Predictions */}
          {filters.showPredictions && predictions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                Predictions
              </h4>
              <div className="space-y-3">
                {predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-purple-200 bg-purple-50 cursor-pointer hover:border-purple-300 transition-all"
                    onClick={() => {
                      const node = nodes.find(n => prediction.relatedEntities.includes(n.id));
                      if (node) setSelectedNode(node);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-medium text-sm text-gray-900">
                        {prediction.title}
                      </h5>
                      <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {prediction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Zap size={14} className="mr-1" />
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button 
                onClick={() => setPathFinderOpen(true)}
                className="w-full p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target size={16} className="text-purple-600 group-hover:animate-pulse" />
                    <span className="text-sm font-medium">Find Path</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Connect {nodes.filter(n => n.type === 'person').length} people & {nodes.filter(n => n.type === 'event').length} events
                </p>
              </button>
              
              <button 
                onClick={() => {
                  // Trigger pattern analysis
                  analyzePatterns();
                  showNotification('Analyzing your family patterns...', 'info');
                }}
                disabled={loading}
                className="w-full p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 size={16} className={`text-purple-600 ${loading ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                    <span className="text-sm font-medium">
                      {loading ? 'Analyzing...' : 'Analyze Patterns'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {insights.length > 0 ? `${insights.length} patterns found` : 'Deep dive into family patterns'}
                </p>
              </button>
              
              <button 
                onClick={() => setContextQueryOpen(true)}
                className="w-full p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link size={16} className="text-purple-600 group-hover:animate-pulse" />
                    <span className="text-sm font-medium">Context Query</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Explore {links.length} relationships
                </p>
              </button>
              
              <button 
                onClick={() => {
                  // Build dynamic prompt based on actual data
                  const personCount = nodes.filter(n => n.type === 'person').length;
                  const eventCount = nodes.filter(n => n.type === 'event').length;
                  const docCount = nodes.filter(n => n.type === 'document').length;
                  const emailCount = nodes.filter(n => n.type === 'email' || n.type === 'memory').length;
                  const surveyCount = nodes.filter(n => n.type === 'insight').length; // Changed from 'surveyResponse' to 'insight'
                  
                  const prompt = `Analyze our family's Knowledge Graph. We have:
- ${personCount} family members
- ${eventCount} events tracked
- ${docCount} documents stored
- ${emailCount} emails/messages
- ${surveyCount} survey responses
- ${links.length} connections between them

What interesting patterns do you see? What insights can you share about our family dynamics?`;
                  
                  openDrawerWithPrompt(prompt, { context: 'knowledge_graph_analysis' });
                  showNotification('Opening Allie with your knowledge graph context...', 'success');
                }}
                className="w-full p-3 text-left bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all hover:scale-[1.02] group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle size={16} className="text-white group-hover:animate-bounce" />
                    <span className="text-sm font-medium">Ask Allie</span>
                  </div>
                  <ChevronRight size={16} className="text-white/80 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-white/90 mt-1">
                  AI analysis of {nodes.length} entities
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Path Finder Modal */}
      {pathFinderOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="mr-2 text-purple-600" size={20} />
                Find Path Between Entities
              </h3>
              <button
                onClick={() => {
                  setPathFinderOpen(false);
                  setPathFinderStart(null);
                  setPathFinderEnd(null);
                  setFoundPath(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Start Node Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Node
                </label>
                <select
                  value={pathFinderStart || ''}
                  onChange={(e) => setPathFinderStart(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select a node...</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.label} ({ENTITY_CONFIGS[node.type]?.label || node.type})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* End Node Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Node
                </label>
                <select
                  value={pathFinderEnd || ''}
                  onChange={(e) => setPathFinderEnd(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select a node...</option>
                  {nodes.filter(n => n.id !== pathFinderStart).map(node => (
                    <option key={node.id} value={node.id}>
                      {node.label} ({ENTITY_CONFIGS[node.type]?.label || node.type})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Find Path Button */}
              <button
                onClick={findPath}
                disabled={!pathFinderStart || !pathFinderEnd}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  pathFinderStart && pathFinderEnd
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Find Path
              </button>
              
              {/* Path Result */}
              {foundPath && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Path Found ({foundPath.length} steps)
                  </h4>
                  <div className="space-y-2">
                    {foundPath.map((nodeId, index) => {
                      const node = nodes.find(n => n.id === nodeId);
                      if (!node) return null;
                      
                      const Icon = ENTITY_CONFIGS[node.type]?.icon || FileText;
                      
                      return (
                        <div key={nodeId} className="flex items-center">
                          <div className="flex items-center space-x-2 flex-1">
                            <Icon size={16} style={{ color: ENTITY_CONFIGS[node.type]?.color }} />
                            <span className="text-sm">{node.label}</span>
                          </div>
                          {index < foundPath.length - 1 && (
                            <ChevronRight size={16} className="text-gray-400 mx-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setPathFinderOpen(false);
                      // Keep the path highlighted in the main view
                    }}
                    className="mt-4 w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View in Graph
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Context Query Modal - Now Opens Allie */}
      {contextQueryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Link className="mr-2 text-purple-600" size={20} />
                Ask Allie About Your Knowledge Graph
              </h3>
              <button
                onClick={() => setContextQueryOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Allie can answer complex questions about your family's Knowledge Graph, including:
              </p>
              
              <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-700 font-medium">Example questions:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Who helped with homework last week and what rewards did they earn?</li>
                  <li>• What activities overlap with doctor appointments?</li>
                  <li>• Which children are teaching their siblings?</li>
                  <li>• Show me all tasks assigned to Mom that are overdue</li>
                  <li>• How is our mental load distributed across parents?</li>
                  <li>• What patterns exist in our family dynamics?</li>
                </ul>
              </div>
              
              <button
                onClick={() => {
                  setContextQueryOpen(false);
                  openDrawerWithPrompt(
                    `I'd like to ask about our family's Knowledge Graph. ${contextQuery || 'Can you tell me about the patterns and insights you see?'}`,
                    { context: 'knowledge_graph_query' }
                  );
                }}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="mr-2" size={20} />
                Open Allie Chat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all transform ${
          notification.type === 'error' ? 'bg-red-600' : notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
        } text-white max-w-md z-50`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Hierarchical View Component
const HierarchicalView = ({ nodes, links }) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    // Create hierarchical data structure
    const hierarchy = createHierarchy(nodes, links);
    
    // Create tree layout
    const treeLayout = d3.tree()
      .size([width - 100, height - 100])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    
    const root = d3.hierarchy(hierarchy);
    const treeData = treeLayout(root);
    
    // Create container
    const g = svg.append('g')
      .attr('transform', 'translate(50,50)');
    
    // Add zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Draw links
    g.selectAll('.link')
      .data(treeData.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);
    
    // Draw nodes
    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);
    
    // Add circles
    node.append('circle')
      .attr('r', d => {
        const nodeData = d.data.nodeData;
        if (!nodeData) return 5;
        const config = ENTITY_CONFIGS[nodeData.type];
        return config ? 15 : 10;
      })
      .attr('fill', d => {
        const nodeData = d.data.nodeData;
        if (!nodeData) return '#999';
        const config = ENTITY_CONFIGS[nodeData.type];
        return config ? config.color : '#999';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Add labels
    node.append('text')
      .attr('dy', '0.35em')
      .attr('x', d => d.children ? -20 : 20)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .style('font-size', '12px')
      .style('fill', '#333');
  }, [nodes, links]);
  
  // Helper function to create hierarchy
  const createHierarchy = (nodes, links) => {
    // Find family node as root
    const familyNode = nodes.find(n => n.type === 'family') || nodes.find(n => n.type === 'person' && n.properties.role === 'parent');
    
    if (!familyNode) {
      return { name: 'Family', children: [] };
    }
    
    // Build tree structure
    const buildTree = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return null;
      
      const children = [];
      
      // Find children based on relationships
      links.forEach(link => {
        if ((link.source.id || link.source) === nodeId) {
          const childTree = buildTree(link.target.id || link.target, visited);
          if (childTree) children.push(childTree);
        }
      });
      
      return {
        name: node.label,
        nodeData: node,
        children: children.length > 0 ? children : undefined
      };
    };
    
    return buildTree(familyNode.id) || { name: 'Family', children: [] };
  };
  
  return (
    <svg 
      ref={svgRef} 
      className="w-full h-full"
      style={{ background: '#F9FAFB' }}
    />
  );
};

// Timeline View Component
const TimelineView = ({ nodes, links }) => {
  const containerRef = useRef(null);
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Filter nodes with time data
  const timeBasedNodes = useMemo(() => {
    return nodes.filter(node => {
      if (node.type === 'event' && node.properties.date) return true;
      if (node.type === 'task' && (node.properties.dueDate || node.properties.completedDate)) return true;
      if (node.properties.createdAt || node.properties.updatedAt) return true;
      return false;
    }).map(node => {
      let date;
      if (node.type === 'event') {
        date = new Date(node.properties.date);
      } else if (node.type === 'task') {
        date = new Date(node.properties.dueDate || node.properties.completedDate);
      } else {
        date = new Date(node.properties.updatedAt || node.properties.createdAt);
      }
      
      return { ...node, date };
    }).sort((a, b) => a.date - b.date);
  }, [nodes]);
  
  // Get date range based on selection
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    
    switch (timeRange) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  };
  
  // Filter nodes within date range
  const visibleNodes = useMemo(() => {
    const { start, end } = getDateRange();
    return timeBasedNodes.filter(node => node.date >= start && node.date <= end);
  }, [timeBasedNodes, selectedDate, timeRange]);
  
  // Group nodes by date
  const groupedNodes = useMemo(() => {
    const groups = {};
    visibleNodes.forEach(node => {
      const dateKey = node.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(node);
    });
    return groups;
  }, [visibleNodes]);
  
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-50">
      {/* Timeline Controls */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                switch (timeRange) {
                  case 'day': newDate.setDate(newDate.getDate() - 1); break;
                  case 'week': newDate.setDate(newDate.getDate() - 7); break;
                  case 'month': newDate.setMonth(newDate.getMonth() - 1); break;
                  case 'year': newDate.setFullYear(newDate.getFullYear() - 1); break;
                }
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-lg font-medium">
              {timeRange === 'day' && selectedDate.toLocaleDateString()}
              {timeRange === 'week' && `Week of ${getDateRange().start.toLocaleDateString()}`}
              {timeRange === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {timeRange === 'year' && selectedDate.getFullYear()}
            </span>
            
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                switch (timeRange) {
                  case 'day': newDate.setDate(newDate.getDate() + 1); break;
                  case 'week': newDate.setDate(newDate.getDate() + 7); break;
                  case 'month': newDate.setMonth(newDate.getMonth() + 1); break;
                  case 'year': newDate.setFullYear(newDate.getFullYear() + 1); break;
                }
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Today
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {visibleNodes.length} items in view
        </div>
      </div>
      
      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedNodes).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNodes).map(([dateKey, dateNodes]) => (
              <div key={dateKey} className="relative">
                {/* Date Header */}
                <div className="sticky top-0 bg-gray-50 py-2 z-10">
                  <div className="flex items-center">
                    <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {new Date(dateKey).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1 h-px bg-gray-300 ml-4"></div>
                  </div>
                </div>
                
                {/* Timeline Items */}
                <div className="ml-6 space-y-4">
                  {dateNodes.map((node, index) => {
                    const Icon = ENTITY_CONFIGS[node.type]?.icon || FileText;
                    const config = ENTITY_CONFIGS[node.type];
                    
                    return (
                      <div key={node.id} className="relative flex items-start">
                        {/* Timeline Line */}
                        {index < dateNodes.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300"></div>
                        )}
                        
                        {/* Node Icon */}
                        <div 
                          className="relative z-10 p-2 rounded-lg mr-4"
                          style={{ backgroundColor: `${config?.color}20` }}
                        >
                          <Icon size={20} style={{ color: config?.color }} />
                        </div>
                        
                        {/* Node Content */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{node.label}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {node.date.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {config?.label || node.type}
                            </span>
                          </div>
                          
                          {/* Additional Properties */}
                          {node.properties.location && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <MapPin size={14} className="mr-1" />
                              {node.properties.location}
                            </div>
                          )}
                          
                          {node.properties.assignedTo && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <User size={14} className="mr-1" />
                              Assigned to {node.properties.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No events in this time range</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Geographic/Location View Component  
const GeographicView = ({ nodes, links }) => {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Filter nodes with location data
  const locationNodes = useMemo(() => {
    return nodes.filter(node => {
      if (node.type === 'location') return true;
      if (node.properties.location || node.properties.address) return true;
      return false;
    });
  }, [nodes]);
  
  // Group nodes by location
  const locationGroups = useMemo(() => {
    const groups = {};
    
    // Add explicit location nodes
    locationNodes.forEach(node => {
      if (node.type === 'location') {
        const key = node.label;
        if (!groups[key]) {
          groups[key] = {
            location: node.label,
            type: node.properties.type || 'general',
            nodes: []
          };
        }
        groups[key].nodes.push(node);
      }
    });
    
    // Add nodes with location properties
    nodes.forEach(node => {
      if (node.properties.location) {
        const key = node.properties.location;
        if (!groups[key]) {
          groups[key] = {
            location: key,
            type: 'general',
            nodes: []
          };
        }
        groups[key].nodes.push(node);
      }
    });
    
    return groups;
  }, [nodes, locationNodes]);
  
  // Get location type icon
  const getLocationIcon = (type) => {
    switch (type) {
      case 'home': return Home;
      case 'school': return School;
      case 'provider': return Pill;
      case 'activity': return Activity;
      case 'medical': return Pill;
      default: return MapPin;
    }
  };
  
  return (
    <div ref={mapRef} className="w-full h-full bg-gray-50">
      <div className="h-full flex">
        {/* Location List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
            <p className="text-sm text-gray-600 mt-1">
              {Object.keys(locationGroups).length} locations with {locationNodes.length} related items
            </p>
          </div>
          
          <div className="p-4 space-y-3">
            {Object.entries(locationGroups).map(([location, group]) => {
              const LocationIcon = getLocationIcon(group.type);
              const isSelected = selectedLocation === location;
              
              return (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-3 ${
                      isSelected ? 'bg-purple-200' : 'bg-gray-100'
                    }`}>
                      <LocationIcon size={20} className={
                        isSelected ? 'text-purple-700' : 'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{location}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {group.nodes.length} {group.nodes.length === 1 ? 'item' : 'items'}
                      </p>
                      
                      {/* Item Types */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[...new Set(group.nodes.map(n => n.type))].map(type => {
                          const config = ENTITY_CONFIGS[type];
                          return (
                            <span 
                              key={type}
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${config?.color}20`,
                                color: config?.color || '#666'
                              }}
                            >
                              {config?.label || type}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Map/Details Area */}
        <div className="flex-1 p-6">
          {selectedLocation ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedLocation}
              </h3>
              
              {/* Location Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Activities & Events</h4>
                <div className="space-y-3">
                  {locationGroups[selectedLocation].nodes.map(node => {
                    const Icon = ENTITY_CONFIGS[node.type]?.icon || FileText;
                    const config = ENTITY_CONFIGS[node.type];
                    
                    return (
                      <div 
                        key={node.id}
                        className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                      >
                        <div 
                          className="p-2 rounded-lg mr-3"
                          style={{ backgroundColor: `${config?.color}20` }}
                        >
                          <Icon size={16} style={{ color: config?.color }} />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{node.label}</h5>
                          <p className="text-sm text-gray-600">
                            {config?.label || node.type}
                            {node.properties.date && ` • ${new Date(node.properties.date).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Connected People */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-medium text-gray-900 mb-4">People Connected</h4>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const people = new Set();
                    locationGroups[selectedLocation].nodes.forEach(node => {
                      links.forEach(link => {
                        if (link.source.id === node.id || link.target.id === node.id) {
                          const otherNodeId = link.source.id === node.id ? link.target.id : link.source.id;
                          const otherNode = nodes.find(n => n.id === otherNodeId);
                          if (otherNode && otherNode.type === 'person') {
                            people.add(otherNode);
                          }
                        }
                      });
                    });
                    
                    return Array.from(people).map(person => (
                      <div 
                        key={person.id}
                        className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg"
                      >
                        <User size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          {person.label}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a location to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerfulKnowledgeGraphTab;