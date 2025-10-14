// src/components/knowledge/KnowledgeGraphViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Database, 
  Zap, 
  Users, 
  Link, 
  Calendar,
  User, 
  FileText, 
  Activity,
  Lightbulb
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import FamilyKnowledgeGraph from '../../services/FamilyKnowledgeGraph';
import { MultimodalUnderstandingPipeline } from '../../services/knowledge';
import DocumentRelationshipVisualizer from '../document/DocumentRelationshipVisualizer';
import DocumentUploadZone from '../document/DocumentUploadZone';

const KnowledgeGraphViewer = () => {
  const { familyId } = useFamily();
  const [loading, setLoading] = useState(true);
  const [graphStats, setGraphStats] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [connections, setConnections] = useState([]);
  const [insights, setInsights] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [activeTab, setActiveTab] = useState('entities');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [pathSource, setPathSource] = useState(null);
  const [pathTarget, setPathTarget] = useState(null);
  const [pathResult, setPathResult] = useState(null);
  const [findingPath, setFindingPath] = useState(false);
  const [patternResults, setPatternResults] = useState(null);
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  
  // Icons for entity types
  const entityIcons = {
    family: <Users size={16} />,
    person: <User size={16} />,
    task: <FileText size={16} />,
    event: <Calendar size={16} />,
    provider: <User size={16} />,
    appointment: <Calendar size={16} />,
    document: <FileText size={16} />,
    insight: <Lightbulb size={16} />,
    milestone: <Activity size={16} />,
    preference: <Zap size={16} />
  };
  
  // Load graph data function
  const loadGraphData = async () => {
    if (!familyId) return;
    
    setLoading(true);
    try {
      // Initialize graph
      const graph = await FamilyKnowledgeGraph.getGraph(familyId);
      
      // Load family data if graph is empty
      if (Object.keys(graph.entities).length <= 1) {
        await FamilyKnowledgeGraph.loadFamilyData(familyId);
      }
      
      // Get updated graph
      const updatedGraph = await FamilyKnowledgeGraph.getGraph(familyId);
      
      // Set entities
      setEntities(Object.values(updatedGraph.entities));
      
      // Set graph stats
      setGraphStats({
        entityCount: updatedGraph.stats.entityCount,
        relationshipCount: updatedGraph.stats.relationshipCount,
        lastQuery: updatedGraph.stats.lastQuery
      });
      
      // Generate insights
      const graphInsights = await FamilyKnowledgeGraph.generateInsights(familyId);
      setInsights(graphInsights);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading knowledge graph:", error);
      setLoading(false);
    }
  };

  // Load graph data on mount
  useEffect(() => {
    loadGraphData();
    checkSyncStatus();
  }, [familyId]);
  
  // Check sync status
  const checkSyncStatus = async () => {
    if (!familyId) return;
    try {
      const status = await FamilyKnowledgeGraph.getSyncStatus(familyId);
      if (status.lastSync) {
        setLastSync(new Date(status.lastSync));
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
    }
  };
  
  // Handle comprehensive sync
  const handleComprehensiveSync = async () => {
    if (!familyId || syncing) return;
    
    setSyncing(true);
    try {
      const results = await FamilyKnowledgeGraph.performComprehensiveSync(familyId, {
        includeChatHistory: false // Skip chat history for now
      });
      
      console.log("Sync results:", results);
      
      // Reload graph data
      await loadGraphData();
      await checkSyncStatus();
      
      // Show success message
      alert(`Knowledge Graph sync complete! 
        - Surveys: ${results.dataSources.surveys?.relationshipSurveys || 0} relationship surveys, ${results.dataSources.surveys?.childInterests || 0} child interests
        - Calendar: ${results.dataSources.calendar?.events || 0} events
        - Chores/Rewards: ${results.dataSources.chores?.chores || 0} chores, ${results.dataSources.chores?.rewards || 0} rewards
        - Providers: ${results.dataSources.providers?.providers || 0} providers
        - Habits: ${results.dataSources.habits?.habits || 0} habits`);
    } catch (error) {
      console.error("Error during sync:", error);
      alert("Error syncing knowledge graph: " + error.message);
    } finally {
      setSyncing(false);
    }
  };
  
  // Handle entity selection
  const handleEntityClick = async (entity) => {
    setSelectedEntity(entity);
    
    try {
      // Get connections
      const entityConnections = await FamilyKnowledgeGraph.findConnectedEntities(
        familyId,
        entity.id
      );
      
      setConnections(entityConnections);
    } catch (error) {
      console.error("Error getting connections:", error);
      setConnections([]);
    }
  };
  
  // Handle query submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!queryInput.trim()) return;
    
    setLoadingQuery(true);
    try {
      // Import ClaudeService for AI-powered responses
      const ClaudeService = (await import('../../services/ClaudeService')).default;
      
      // Get graph context
      const graphData = await FamilyKnowledgeGraph.getGraph(familyId);
      
      // Create prompt for Claude
      const prompt = `
        You are analyzing a family knowledge graph with the following data:
        - ${Object.keys(graphData.entities).length} entities
        - ${graphData.stats.relationshipCount} relationships
        - Entity types: ${[...new Set(Object.values(graphData.entities).map(e => e.type))].join(', ')}
        
        Key family members:
        ${Object.values(graphData.entities)
          .filter(e => e.type === 'person')
          .map(e => `- ${e.properties.name} (${e.properties.role})`)
          .join('\n')}
        
        User question: ${queryInput}
        
        Please provide a helpful, specific answer based on the family data. If you need specific information that's not provided, suggest what data would be helpful to collect.
      `;
      
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { system: 'You are a helpful family assistant analyzing a knowledge graph. Provide specific, actionable insights based on the data available.' },
        { temperature: 0.7, max_tokens: 500 }
      );
      
      setQueryResult({
        message: response,
        timestamp: new Date().toISOString()
      });
      setQueryInput('');
    } catch (error) {
      console.error("Error executing query:", error);
      setQueryResult({
        message: "An error occurred while processing your query. Please try again."
      });
    } finally {
      setLoadingQuery(false);
    }
  };

  // Find path between two entities
  const handleFindPath = async () => {
    if (!pathSource || !pathTarget) {
      alert('Please select both source and target entities by clicking on them in the entity list.');
      return;
    }

    setFindingPath(true);
    try {
      // Simple BFS path finding
      const graph = await FamilyKnowledgeGraph.getGraph(familyId);
      const visited = new Set();
      const queue = [[pathSource, [pathSource]]];
      let foundPath = null;

      while (queue.length > 0 && !foundPath) {
        const [current, path] = queue.shift();
        
        if (current.id === pathTarget.id) {
          foundPath = path;
          break;
        }

        if (visited.has(current.id)) continue;
        visited.add(current.id);

        // Get connections
        const connections = await FamilyKnowledgeGraph.findConnectedEntities(
          familyId,
          current.id
        );

        for (const conn of connections) {
          if (!visited.has(conn.entity.id)) {
            queue.push([conn.entity, [...path, conn.entity]]);
          }
        }
      }

      setPathResult({
        found: !!foundPath,
        path: foundPath || []
      });
    } catch (error) {
      console.error('Error finding path:', error);
      setPathResult({
        found: false,
        path: [],
        error: error.message
      });
    } finally {
      setFindingPath(false);
    }
  };

  // Analyze patterns using Claude
  const handleAnalyzePatterns = async () => {
    setAnalyzingPatterns(true);
    try {
      const ClaudeService = (await import('../../services/ClaudeService')).default;
      const graph = await FamilyKnowledgeGraph.getGraph(familyId);
      
      // Gather comprehensive data
      const tasks = Object.values(graph.entities).filter(e => e.type === 'task');
      const events = Object.values(graph.entities).filter(e => e.type === 'event');
      const people = Object.values(graph.entities).filter(e => e.type === 'person');
      
      const prompt = `
        Analyze this family's data patterns and provide insights:
        
        Family Members: ${people.map(p => `${p.properties.name} (${p.properties.role})`).join(', ')}
        
        Tasks: ${tasks.length} total
        - Completed: ${tasks.filter(t => t.properties.completed).length}
        - Pending: ${tasks.filter(t => !t.properties.completed).length}
        
        Events: ${events.length} total
        - Past: ${events.filter(e => new Date(e.properties.date) < new Date()).length}
        - Upcoming: ${events.filter(e => new Date(e.properties.date) >= new Date()).length}
        
        Please identify:
        1. Task distribution patterns among family members
        2. Event participation patterns
        3. Time-based patterns (busy days, quiet periods)
        4. Potential areas for better family balance
        5. Recommendations for improving family organization
        
        Be specific and actionable in your insights.
      `;
      
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { system: 'You are an expert family data analyst. Identify meaningful patterns and provide actionable insights to help this family improve their organization and balance.' },
        { temperature: 0.7, max_tokens: 800 }
      );
      
      setPatternResults(response);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      setPatternResults('Error analyzing patterns. Please try again.');
    } finally {
      setAnalyzingPatterns(false);
    }
  };
  
  // Get filtered entities
  const getFilteredEntities = () => {
    if (entityTypeFilter === 'all') {
      return entities.filter(e => e.type !== 'family'); // Exclude family entity from list
    }
    return entities.filter(e => e.type === entityTypeFilter);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mx-auto font-roboto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg h-64"></div>
          <div className="bg-gray-100 p-4 rounded-lg h-64"></div>
          <div className="bg-gray-100 p-4 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow max-w-6xl mx-auto font-roboto">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 bg-indigo-100 p-3 rounded-full">
              <Database size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Family Knowledge Graph</h1>
              <p className="text-gray-500">
                Explore connections and insights from your family data
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {graphStats && (
              <div className="flex space-x-4 text-sm">
                <div className="bg-gray-100 px-3 py-1 rounded-md">
                  <span className="font-semibold">{graphStats.entityCount}</span> Entities
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-md">
                  <span className="font-semibold">{graphStats.relationshipCount}</span> Connections
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-md">
                  <span className="font-semibold">{insights.length}</span> Insights
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-end">
              <button
                onClick={handleComprehensiveSync}
                disabled={syncing}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300 text-sm flex items-center"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <Database size={16} className="mr-2" />
                    Sync All Data
                  </>
                )}
              </button>
              {lastSync && (
                <span className="text-xs text-gray-500 mt-1">
                  Last sync: {lastSync.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Query Section */}
      <div className="bg-indigo-50 p-4 border-b">
        <form onSubmit={handleQuerySubmit} className="flex">
          <div className="flex-1">
            <label htmlFor="query" className="font-medium text-indigo-700 mb-1 block">
              Ask a question about your family data
            </label>
            <div className="flex">
              <input
                id="query"
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="E.g., 'Show all children' or 'What insights do we have?'"
                className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loadingQuery}
              />
              <button
                type="submit"
                disabled={loadingQuery || !queryInput.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {loadingQuery ? 'Processing...' : 'Ask'}
              </button>
            </div>
          </div>
        </form>
        
        {/* Suggested Queries */}
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-indigo-700">Try asking:</span>
          <button
            onClick={() => setQueryInput("Show all children")}
            className="px-2 py-1 bg-white border border-indigo-200 rounded-md text-xs hover:bg-indigo-100"
          >
            Show all children
          </button>
          <button
            onClick={() => setQueryInput("What tasks are assigned to each person?")}
            className="px-2 py-1 bg-white border border-indigo-200 rounded-md text-xs hover:bg-indigo-100"
          >
            Task assignments
          </button>
          <button
            onClick={() => setQueryInput("What insights do we have?")}
            className="px-2 py-1 bg-white border border-indigo-200 rounded-md text-xs hover:bg-indigo-100"
          >
            Show insights
          </button>
        </div>
      </div>
      
      {/* Query Results */}
      {queryResult && (
        <div className="p-4 border-b">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Search size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="mb-3">{queryResult.message}</p>
                
                {queryResult.results && queryResult.results.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-medium mb-2">Results</h3>
                    <ul className="space-y-2">
                      {queryResult.results.map((result, index) => (
                        <li 
                          key={index} 
                          className="p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (result.entity) {
                              handleEntityClick(result.entity);
                              setActiveTab('entities');
                            } else if (result.id) {
                              // For insight results
                              const insightEntity = entities.find(e => e.id === result.id);
                              if (insightEntity) {
                                handleEntityClick(insightEntity);
                                setActiveTab('entities');
                              }
                            }
                          }}
                        >
                          {result.entity ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-indigo-600">
                                {entityIcons[result.entity.type] || <Database size={16} />}
                              </span>
                              <span>
                                {result.entity.properties.name || result.entity.id}
                                <span className="text-xs text-gray-500 ml-2">
                                  ({result.entity.type})
                                </span>
                              </span>
                            </div>
                          ) : result.title ? (
                            <div>
                              <div className="font-medium">{result.title}</div>
                              <div className="text-sm text-gray-600">{result.description}</div>
                            </div>
                          ) : (
                            <div>
                              {result.id || 'Result item'}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b px-6">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'entities' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('entities')}
          >
            Entities
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'insights' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'connections' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'analysis' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'entities' && (
          <>
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold">Entities</h2>
              
              {/* Entity type filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Filter by type:</label>
                <select
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="all">All Types</option>
                  {Array.from(new Set(entities.map(e => e.type))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredEntities().map(entity => (
                <div
                  key={entity.id}
                  className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedEntity?.id === entity.id ? 'border-indigo-500 bg-indigo-50' : ''
                  }`}
                  onClick={() => handleEntityClick(entity)}
                >
                  <div className="flex items-center mb-2">
                    <span className="mr-2 text-indigo-600">
                      {entityIcons[entity.type] || <Database size={16} />}
                    </span>
                    <span className="font-medium">
                      {entity.properties.name || entity.id}
                    </span>
                    <span className="text-xs bg-gray-100 rounded px-2 py-0.5 ml-2">
                      {entity.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {Object.entries(entity.properties)
                      .filter(([key]) => !['name', 'createdAt', 'updatedAt'].includes(key))
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500">{key}:</span>
                          <span>
                            {typeof value === 'object' 
                              ? JSON.stringify(value).substring(0, 20) + '...'
                              : String(value).substring(0, 20)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Selected Entity Details */}
            {selectedEntity && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  {selectedEntity.properties.name || selectedEntity.id}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Properties</h4>
                      <div className="space-y-1">
                        {Object.entries(selectedEntity.properties).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-500">{key}:</span>
                            <span>
                              {typeof value === 'object' 
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Connections ({connections.length})</h4>
                      {connections.length > 0 ? (
                        <div className="space-y-2">
                          {connections.slice(0, 5).map((conn, index) => (
                            <div 
                              key={index} 
                              className="p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleEntityClick(conn.entity)}
                            >
                              <div className="flex items-center">
                                <span className="mr-2 text-indigo-600">
                                  {entityIcons[conn.entity.type] || <Database size={16} />}
                                </span>
                                <span>
                                  {conn.entity.properties.name || conn.entity.id}
                                </span>
                                <span className="mx-2 text-gray-400">
                                  <Link size={12} />
                                </span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 rounded px-2 py-0.5">
                                  {conn.relationship.type}
                                </span>
                              </div>
                            </div>
                          ))}
                          {connections.length > 5 && (
                            <div className="text-sm text-center text-gray-500">
                              + {connections.length - 5} more connections
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          No connections found for this entity.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'insights' && (
          <>
            <div className="flex justify-between mb-3">
              <h2 className="text-lg font-semibold">Insights</h2>
              <button
                onClick={async () => {
                  try {
                    const newInsights = await FamilyKnowledgeGraph.generateInsights(familyId);
                    setInsights(newInsights);
                  } catch (error) {
                    console.error("Error generating insights:", error);
                  }
                }}
                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              >
                Refresh Insights
              </button>
            </div>
            
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                        insight.severity === 'high' ? 'bg-red-100' :
                        insight.severity === 'medium' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        <Lightbulb size={16} className={`${
                          insight.severity === 'high' ? 'text-red-600' :
                          insight.severity === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{insight.title}</h3>
                        <p className="text-gray-700 mb-2">{insight.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {insight.entities && insight.entities.map((entity, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                              {entity}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {insight.type}
                          </span>
                        </div>
                        <div className={`p-2 rounded text-sm ${
                          insight.severity === 'high' ? 'bg-red-50 text-red-700' :
                          insight.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {insight.actionItem}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Lightbulb size={40} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-500 mb-1">No Insights Yet</h3>
                <p className="text-gray-500 mb-4">
                  Add more data to your family knowledge graph to generate insights.
                </p>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'connections' && (
          <>
            <h2 className="text-lg font-semibold mb-3">Family Connections</h2>
            
            {/* Simple graph visualization */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="mb-4 text-gray-600">
                This view shows the relationships between entities in your family knowledge graph.
              </p>
              
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Parents Row */}
                  <div className="flex justify-center space-x-8 mb-8">
                    {entities
                      .filter(e => e.type === 'person' && e.properties.role === 'parent')
                      .map(parent => (
                        <div 
                          key={parent.id} 
                          className="p-3 bg-blue-100 rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-500"
                          onClick={() => handleEntityClick(parent)}
                        >
                          <div className="font-medium text-center">{parent.properties.name}</div>
                          <div className="text-xs text-center text-gray-600">{parent.properties.roleType}</div>
                        </div>
                      ))}
                  </div>
                  
                  {/* Connection Lines */}
                  <div className="flex justify-center mb-1">
                    <div className="w-16 h-8 border-l-2 border-r-2 border-t-2 border-gray-400"></div>
                  </div>
                  
                  {/* Family Entity */}
                  <div className="flex justify-center mb-1">
                    <div 
                      className="p-2 bg-indigo-100 rounded-lg cursor-pointer border-2 border-transparent hover:border-indigo-500"
                      onClick={() => handleEntityClick(entities.find(e => e.type === 'family'))}
                    >
                      <div className="font-medium text-center">
                        {entities.find(e => e.type === 'family')?.properties.name || 'Family'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connection Lines */}
                  <div className="flex justify-center mb-1">
                    <div className="w-32 h-8 border-l-2 border-r-2 border-t-2 border-gray-400"></div>
                  </div>
                  
                  {/* Children Row */}
                  <div className="flex justify-center space-x-8">
                    {entities
                      .filter(e => e.type === 'person' && e.properties.role === 'child')
                      .map(child => (
                        <div 
                          key={child.id} 
                          className="p-3 bg-green-100 rounded-lg cursor-pointer border-2 border-transparent hover:border-green-500"
                          onClick={() => handleEntityClick(child)}
                        >
                          <div className="font-medium text-center">{child.properties.name}</div>
                          <div className="text-xs text-center text-gray-600">Child</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-sm text-gray-500 italic text-center">
                Click on any entity to view details and connections.
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'analysis' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Graph Analysis</h2>
            
            {/* Path Finding Section */}
            <div className="mb-8">
              <h3 className="text-md font-semibold mb-3">Find Path Between Entities</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-4">
                  Select two entities to find the shortest path between them in the knowledge graph.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source Entity</label>
                    <select
                      value={pathSource?.id || ''}
                      onChange={(e) => {
                        const entity = entities.find(ent => ent.id === e.target.value);
                        setPathSource(entity || null);
                        setPathResult(null);
                      }}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select source entity</option>
                      {entities.filter(e => e.type !== 'family').map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.properties.name || entity.id} ({entity.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Entity</label>
                    <select
                      value={pathTarget?.id || ''}
                      onChange={(e) => {
                        const entity = entities.find(ent => ent.id === e.target.value);
                        setPathTarget(entity || null);
                        setPathResult(null);
                      }}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select target entity</option>
                      {entities.filter(e => e.type !== 'family' && e.id !== pathSource?.id).map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.properties.name || entity.id} ({entity.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleFindPath}
                  disabled={!pathSource || !pathTarget || findingPath}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  {findingPath ? 'Finding Path...' : 'Find Path'}
                </button>
                
                {pathResult && (
                  <div className="mt-4 p-4 bg-white rounded-md border">
                    {pathResult.found ? (
                      <>
                        <h4 className="font-medium text-green-600 mb-2">Path Found!</h4>
                        <div className="flex items-center flex-wrap gap-2">
                          {pathResult.path.map((entity, index) => (
                            <React.Fragment key={entity.id}>
                              <div 
                                className="px-3 py-1 bg-indigo-100 rounded-md cursor-pointer hover:bg-indigo-200"
                                onClick={() => handleEntityClick(entity)}
                              >
                                {entity.properties.name || entity.id}
                                <span className="text-xs text-gray-600 ml-1">({entity.type})</span>
                              </div>
                              {index < pathResult.path.length - 1 && (
                                <span className="text-gray-500">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-red-600">No path found between these entities.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Pattern Analysis Section */}
            <div>
              <h3 className="text-md font-semibold mb-3">Pattern Analysis</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-4">
                  Use AI to analyze patterns in your family's activities, tasks, and relationships.
                </p>
                
                <button
                  onClick={handleAnalyzePatterns}
                  disabled={analyzingPatterns}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  {analyzingPatterns ? 'Analyzing Patterns...' : 'Analyze Patterns'}
                </button>
                
                {patternResults && (
                  <div className="mt-4 p-4 bg-white rounded-md border">
                    <h4 className="font-medium mb-2">Analysis Results</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{patternResults}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'documents' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Memory-Graph Attachments</h2>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Drag any email, PDF, or photo onto the upload area below</li>
                  <li>Allie will OCR the content and extract information</li>
                  <li>Documents are automatically tagged to the Family Knowledge Graph</li>
                  <li>Links are created to related people, events, and tasks</li>
                  <li>Later you can ask: "Show me docs tied to Tegner's homework board"</li>
                </ol>
              </div>
              
              <DocumentUploadZone
                onUploadComplete={(result) => {
                  console.log('Document uploaded:', result);
                  // Refresh the knowledge graph to show new connections
                  if (result.success) {
                    // Reload graph data
                    loadGraphData();
                  }
                }}
                onError={(error) => {
                  console.error('Upload error:', error);
                  alert(`Error uploading document: ${error.message}`);
                }}
                maxFiles={10}
              />
              
              {/* Recent Documents */}
              <div className="mt-8">
                <h3 className="text-md font-semibold mb-4">Recent Documents in Knowledge Graph</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entities
                    .filter(e => e.type === 'document')
                    .slice(0, 6)
                    .map(doc => (
                      <div
                        key={doc.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleEntityClick(doc)}
                      >
                        <div className="flex items-start">
                          <FileText className="text-indigo-600 mr-3 mt-1" size={20} />
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.properties.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {doc.properties.category} • Uploaded {new Date(doc.properties.uploadedAt).toLocaleDateString()}
                            </p>
                            {doc.properties.tags && doc.properties.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.properties.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {entities.filter(e => e.type === 'document').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>No documents in the knowledge graph yet.</p>
                    <p className="text-sm mt-1">Upload documents above to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphViewer;