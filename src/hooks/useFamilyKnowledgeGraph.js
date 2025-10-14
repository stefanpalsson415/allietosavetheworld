/**
 * useFamilyKnowledgeGraph.js
 * 
 * React hook for interacting with the Family Knowledge Graph.
 * Provides methods for querying, visualizing, and analyzing the graph.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import EnhancedFamilyKnowledgeGraph from '../services/knowledge/EnhancedFamilyKnowledgeGraph';
import MultimodalUnderstandingPipeline from '../services/knowledge/MultimodalUnderstandingPipeline';

/**
 * Hook for using the family knowledge graph
 * @param {Object} options - Hook options
 * @returns {Object} Knowledge graph operations and state
 */
const useFamilyKnowledgeGraph = (options = {}) => {
  const { familyId: paramFamilyId } = useParams();
  const { familyId: contextFamilyId } = useFamily();
  
  // Use either family ID from params, context, or options
  const familyId = options.familyId || paramFamilyId || contextFamilyId;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graph, setGraph] = useState(null);
  const [entities, setEntities] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [insights, setInsights] = useState([]);
  const [lastQuery, setLastQuery] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [processingResults, setProcessingResults] = useState(null);
  
  // Initialize the knowledge graph
  const initializeGraph = useCallback(async () => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const graph = await EnhancedFamilyKnowledgeGraph.getGraph(familyId);
      setGraph(graph);
      
      return graph;
    } catch (err) {
      console.error('Error initializing knowledge graph:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Load all entities of specific type
  const loadEntities = useCallback(async (entityType) => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const entities = await EnhancedFamilyKnowledgeGraph.queryEntitiesByType(familyId, entityType);
      setEntities(entities);
      
      return entities;
    } catch (err) {
      console.error(`Error loading ${entityType} entities:`, err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Get traversal from specific entity
  const getEntityTraversal = useCallback(async (entityId, options = {}) => {
    if (!familyId || !entityId) {
      setError(new Error('Family ID and entity ID are required'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const traversalResult = await EnhancedFamilyKnowledgeGraph.executeTraversal(
        familyId,
        entityId,
        options
      );
      
      return traversalResult;
    } catch (err) {
      console.error('Error executing traversal:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Find paths between entities
  const findPaths = useCallback(async (sourceId, targetId, maxDepth = 3) => {
    if (!familyId || !sourceId || !targetId) {
      setError(new Error('Family ID, source ID, and target ID are required'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const paths = await EnhancedFamilyKnowledgeGraph.findPaths(
        familyId,
        sourceId,
        targetId,
        maxDepth
      );
      
      return paths;
    } catch (err) {
      console.error('Error finding paths:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Find connected entities
  const findConnectedEntities = useCallback(async (entityId, relationType = null, direction = 'both') => {
    if (!familyId || !entityId) {
      setError(new Error('Family ID and entity ID are required'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const connections = await EnhancedFamilyKnowledgeGraph.findConnectedEntities(
        familyId,
        entityId,
        relationType,
        direction
      );
      
      return connections;
    } catch (err) {
      console.error('Error finding connected entities:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Advanced entity query
  const queryEntities = useCallback(async (queryParams) => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await EnhancedFamilyKnowledgeGraph.queryEntities(familyId, queryParams);
      
      return results;
    } catch (err) {
      console.error('Error querying entities:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Advanced relationship query
  const queryRelationships = useCallback(async (queryParams) => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await EnhancedFamilyKnowledgeGraph.queryRelationships(familyId, queryParams);
      
      return results;
    } catch (err) {
      console.error('Error querying relationships:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Execute natural language query
  const executeQuery = useCallback(async (query) => {
    if (!familyId || !query) {
      setError(new Error('Family ID and query are required'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      setLastQuery(query);
      
      const results = await EnhancedFamilyKnowledgeGraph.executeNaturalLanguageQuery(familyId, query);
      setQueryResults(results);
      
      return results;
    } catch (err) {
      console.error('Error executing query:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Generate insights
  const generateInsights = useCallback(async () => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const newInsights = await EnhancedFamilyKnowledgeGraph.generateInsights(familyId);
      setInsights(newInsights);
      
      return newInsights;
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Load family data into knowledge graph
  const loadFamilyData = useCallback(async () => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedGraph = await EnhancedFamilyKnowledgeGraph.loadFamilyData(familyId);
      setGraph(updatedGraph);
      
      return updatedGraph;
    } catch (err) {
      console.error('Error loading family data:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Process content through understanding pipeline
  const processContent = useCallback(async (content, contentType, pipelineOptions = {}) => {
    if (!familyId || !content || !contentType) {
      setError(new Error('Family ID, content, and content type are required'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await MultimodalUnderstandingPipeline.process(
        familyId,
        content,
        contentType,
        pipelineOptions
      );
      
      setProcessingResults(result);
      
      return result;
    } catch (err) {
      console.error('Error processing content:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Process batch content through understanding pipeline
  const processBatch = useCallback(async (contentItems, pipelineOptions = {}) => {
    if (!familyId || !contentItems || !contentItems.length) {
      setError(new Error('Family ID and content items are required'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await MultimodalUnderstandingPipeline.processBatch(
        familyId,
        contentItems,
        pipelineOptions
      );
      
      setProcessingResults(result);
      
      return result;
    } catch (err) {
      console.error('Error processing batch content:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Export graph to D3.js format for visualization
  const exportGraphForVisualization = useCallback(async (startEntityId = null, options = {}) => {
    if (!familyId) {
      setError(new Error('No family ID provided'));
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let graphData;
      
      if (startEntityId) {
        // Get traversal from specific entity
        graphData = await EnhancedFamilyKnowledgeGraph.executeTraversal(
          familyId,
          startEntityId,
          options
        );
      } else {
        // Get whole graph
        graphData = await EnhancedFamilyKnowledgeGraph.getGraph(familyId);
      }
      
      // Convert to D3 format
      const d3Data = EnhancedFamilyKnowledgeGraph.exportToD3Format(graphData);
      
      return d3Data;
    } catch (err) {
      console.error('Error exporting graph for visualization:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [familyId]);
  
  // Load graph data on mount if autoLoad is enabled
  useEffect(() => {
    if (options.autoLoad && familyId) {
      initializeGraph();
    }
  }, [options.autoLoad, familyId, initializeGraph]);
  
  return {
    // State
    loading,
    error,
    graph,
    entities,
    relationships,
    insights,
    lastQuery,
    queryResults,
    processingResults,
    familyId,
    
    // Graph operations
    initializeGraph,
    loadEntities,
    getEntityTraversal,
    findPaths,
    findConnectedEntities,
    queryEntities,
    queryRelationships,
    executeQuery,
    generateInsights,
    loadFamilyData,
    
    // Content processing
    processContent,
    processBatch,
    
    // Visualization
    exportGraphForVisualization
  };
};

export default useFamilyKnowledgeGraph;