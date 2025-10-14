import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Tabs, 
  Tab,
  Button,
  IconButton,
  Chip,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Tooltip,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  Refresh, 
  Search, 
  Settings, 
  FilterList, 
  ViewList, 
  ViewModule, 
  Info,
  BubbleChart
} from '@mui/icons-material';
import * as d3 from 'd3';
import useFamilyKnowledgeGraph from '../../hooks/useFamilyKnowledgeGraph';

/**
 * Interactive Knowledge Graph Visualization component
 */
const FamilyKnowledgeGraph = ({ startEntityId, options = {} }) => {
  const { familyId } = useParams();
  const {
    loading,
    error,
    exportGraphForVisualization,
    findConnectedEntities,
    queryEntities,
    executeQuery
  } = useFamilyKnowledgeGraph({ familyId });
  
  // State
  const [graphData, setGraphData] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('graph'); // 'graph', 'list', 'grid'
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [entityTypeFilters, setEntityTypeFilters] = useState([]);
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [centerNode, setCenterNode] = useState(startEntityId);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  
  // Refs
  const svgRef = useRef(null);
  const graphContainerRef = useRef(null);
  
  // D3 visualization references
  const simulationRef = useRef(null);
  const nodesRef = useRef(null);
  const linksRef = useRef(null);
  
  // Load graph data
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const traversalOptions = {
          maxDepth: options.maxDepth || 2,
          relationshipTypes: options.relationshipTypes || [],
          entityTypes: options.entityTypes || [],
          excludeEntityTypes: options.excludeEntityTypes || [],
          direction: options.direction || 'both'
        };
        
        const data = await exportGraphForVisualization(
          centerNode || startEntityId,
          traversalOptions
        );
        
        if (data) {
          setGraphData(data);
          
          // Set available entity types for filtering
          const entityTypes = [...new Set(data.nodes.map(node => node.type))];
          setEntityTypeFilters(
            entityTypes.map(type => ({ type, enabled: true }))
          );
          
          // Set available relationship types for filtering
          const relationshipTypes = [...new Set(data.links.map(link => link.type))];
          setRelationshipTypeFilters(
            relationshipTypes.map(type => ({ type, enabled: true }))
          );
        }
      } catch (err) {
        console.error('Error loading graph data:', err);
      }
    };
    
    if (familyId) {
      loadGraph();
    }
  }, [familyId, centerNode, startEntityId, exportGraphForVisualization, options]);
  
  // Initialize force-directed graph
  useEffect(() => {
    if (!graphData || !svgRef.current || viewMode !== 'graph') return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Apply filters to data
    const enabledEntityTypes = entityTypeFilters
      .filter(f => f.enabled)
      .map(f => f.type);
      
    const enabledRelationshipTypes = relationshipTypeFilters
      .filter(f => f.enabled)
      .map(f => f.type);
    
    const filteredNodes = graphData.nodes.filter(node =>
      enabledEntityTypes.includes(node.type)
    );
    
    const filteredLinks = graphData.links.filter(link =>
      enabledRelationshipTypes.includes(link.type) &&
      filteredNodes.some(n => n.id === link.source) &&
      filteredNodes.some(n => n.id === link.target)
    );
    
    // SVG setup
    const width = graphContainerRef.current.clientWidth;
    const height = 600;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
      
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
      
    svg.call(zoom);
    
    // Create the main group for the graph
    const g = svg.append('g');
    
    // Optional initial zoom
    if (zoomLevel !== 1) {
      svg.call(zoom.transform, d3.zoomIdentity.scale(zoomLevel));
    }
    
    // Create arrow markers for links
    svg.append('defs').selectAll('marker')
      .data(enabledRelationshipTypes)
      .enter().append('marker')
        .attr('id', d => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
      .append('path')
        .attr('fill', '#999')
        .attr('d', 'M0,-5L10,0L0,5');
    
    // Create links
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
        .attr('stroke-width', d => Math.sqrt(d.value || 1))
        .attr('marker-end', d => `url(#arrow-${d.type})`)
        .attr('data-type', d => d.type);
    
    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('g')
        .attr('cursor', 'pointer')
        .attr('class', 'node')
        .on('click', (event, d) => {
          event.stopPropagation();
          selectNode(d);
        })
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
    
    // Node circles
    node.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Node labels
    node.append('text')
      .attr('dx', d => getNodeSize(d) + 5)
      .attr('dy', '.35em')
      .attr('font-size', '10px')
      .text(d => d.label);
    
    // Create the simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force('link', d3.forceLink(filteredLinks).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeSize(d) + 10));
    
    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
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
    
    // Store references
    simulationRef.current = simulation;
    nodesRef.current = node;
    linksRef.current = link;
    
    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graphData, viewMode, entityTypeFilters, relationshipTypeFilters, zoomLevel]);
  
  // Handler for selecting a node
  const selectNode = async (node) => {
    setSelectedEntity(node);
    
    // Optionally recenter the graph on this node
    if (options.recenterOnSelect) {
      setCenterNode(node.id);
    }
    
    // Optionally highlight connected nodes
    if (options.highlightConnections && nodesRef.current && linksRef.current) {
      try {
        const connections = await findConnectedEntities(node.id);
        const connectedIds = new Set(connections.map(c => c.entity.id));
        
        nodesRef.current
          .selectAll('circle')
          .attr('opacity', d => (connectedIds.has(d.id) || d.id === node.id) ? 1 : 0.2);
          
        linksRef.current
          .attr('opacity', d => 
            (d.source.id === node.id || d.target.id === node.id) ? 1 : 0.1
          );
      } catch (err) {
        console.error('Error finding connected entities:', err);
      }
    }
  };
  
  // Get node size based on type or importance
  const getNodeSize = (node) => {
    switch (node.type) {
      case 'family':
        return 15;
      case 'person':
        return 10;
      case 'event':
        return 8;
      case 'task':
        return 7;
      case 'location':
        return 7;
      case 'insight':
        return 9;
      default:
        return 6;
    }
  };
  
  // Get node color based on type
  const getNodeColor = (type) => {
    const colorMap = {
      family: '#3f51b5', // indigo
      person: '#f44336', // red
      event: '#4caf50', // green
      task: '#ff9800', // orange
      document: '#9c27b0', // purple
      location: '#2196f3', // blue
      provider: '#795548', // brown
      medication: '#00bcd4', // cyan
      interest: '#ffeb3b', // yellow
      insight: '#673ab7', // deep purple
      habit: '#e91e63', // pink
      milestone: '#009688', // teal
      communication: '#607d8b', // blue gray
      metric: '#cddc39', // lime
      preference: '#ff5722' // deep orange
    };
    
    return colorMap[type] || '#9e9e9e'; // default gray
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 10));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.1));
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      const results = await queryEntities({
        properties: {
          name: searchQuery,
          title: searchQuery
        }
      });
      
      if (results.length > 0) {
        setSelectedEntity(results[0]);
        
        if (options.recenterOnSearch) {
          setCenterNode(results[0].id);
        }
      }
    } catch (err) {
      console.error('Error searching entities:', err);
    }
  };
  
  // Handle natural language query
  const handleNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery) return;
    
    try {
      const result = await executeQuery(naturalLanguageQuery);
      setQueryResult(result);
      
      // If query returns entities, highlight them in the graph
      if (result && result.results && result.results.length > 0) {
        // ... highlight logic would go here
      }
    } catch (err) {
      console.error('Error executing natural language query:', err);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setCenterNode(startEntityId);
    setSelectedEntity(null);
    setQueryResult(null);
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleEntityTypeFilter = (type) => {
    setEntityTypeFilters(prev => 
      prev.map(filter => 
        filter.type === type ? { ...filter, enabled: !filter.enabled } : filter
      )
    );
  };
  
  const handleRelationshipTypeFilter = (type) => {
    setRelationshipTypeFilters(prev => 
      prev.map(filter => 
        filter.type === type ? { ...filter, enabled: !filter.enabled } : filter
      )
    );
  };
  
  // Entity detail component
  const EntityDetail = ({ entity }) => {
    if (!entity) return null;
    
    return (
      <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">{entity.label}</Typography>
        <Chip label={entity.type} size="small" sx={{ mb: 1, backgroundColor: getNodeColor(entity.type), color: 'white' }} />
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2">Properties</Typography>
        {entity.properties && Object.entries(entity.properties).map(([key, value]) => (
          <Box key={key} sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{key}:</Typography>
            <Typography variant="body2">
              {typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value)}
            </Typography>
          </Box>
        ))}
        
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ mt: 2 }}
          onClick={() => setCenterNode(entity.id)}
        >
          Focus on this entity
        </Button>
      </Paper>
    );
  };
  
  // Query result component
  const QueryResultComponent = ({ result }) => {
    if (!result) return null;
    
    return (
      <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Query Result</Typography>
        <Typography variant="subtitle1">
          {result.message}
        </Typography>
        
        {result.results && result.results.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">
              Found {result.results.length} results
            </Typography>
            
            <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
              {result.results.map((item, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  {item.entity ? (
                    <Box onClick={() => setSelectedEntity(item.entity)} sx={{ cursor: 'pointer' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.entity.properties.name || item.entity.properties.title || item.entity.id}
                      </Typography>
                      <Chip 
                        label={item.entity.type} 
                        size="small" 
                        sx={{ backgroundColor: getNodeColor(item.entity.type), color: 'white' }} 
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2">
                      {JSON.stringify(item)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Paper>
    );
  };
  
  if (error) {
    return <Alert severity="error">Error loading knowledge graph: {error.message}</Alert>;
  }
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Family Knowledge Graph</Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Graph">
              <IconButton onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter">
              <IconButton onClick={handleFilterMenuOpen}>
                <FilterList />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={`View: ${viewMode}`}>
              <IconButton 
                onClick={() => setViewMode(
                  viewMode === 'graph' ? 'list' : 
                  viewMode === 'list' ? 'grid' : 'graph'
                )}
              >
                {viewMode === 'graph' ? <BubbleChart /> : 
                 viewMode === 'list' ? <ViewList /> : <ViewModule />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1, mr: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Visualization" />
          <Tab label="Natural Language Query" />
          <Tab label="Details" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box sx={{ position: 'relative', height: 600 }}>
            {loading && (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 10,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}>
                <CircularProgress />
              </Box>
            )}
            
            <Box 
              ref={graphContainerRef} 
              sx={{ 
                width: '100%', 
                height: '100%',
                border: '1px solid #eee',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              {viewMode === 'graph' ? (
                <svg ref={svgRef} width="100%" height="100%"></svg>
              ) : viewMode === 'list' ? (
                <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
                  {graphData && graphData.nodes.map(node => (
                    <Box 
                      key={node.id} 
                      sx={{ 
                        mb: 1, 
                        p: 1, 
                        border: '1px solid #eee', 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        backgroundColor: selectedEntity?.id === node.id ? '#e3f2fd' : 'transparent'
                      }}
                      onClick={() => selectNode(node)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            backgroundColor: getNodeColor(node.type),
                            mr: 1
                          }} 
                        />
                        <Typography variant="body1">{node.label}</Typography>
                      </Box>
                      <Chip label={node.type} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  overflowY: 'auto', 
                  p: 2,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 2
                }}>
                  {graphData && graphData.nodes.map(node => (
                    <Paper 
                      key={node.id} 
                      elevation={selectedEntity?.id === node.id ? 3 : 1}
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        backgroundColor: selectedEntity?.id === node.id ? '#e3f2fd' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 120
                      }}
                      onClick={() => selectNode(node)}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 1
                      }}>
                        <Box 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            backgroundColor: getNodeColor(node.type),
                            mr: 1
                          }} 
                        />
                        <Typography 
                          variant="body1" 
                          noWrap 
                          sx={{ fontWeight: 'bold' }}
                        >
                          {node.label}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={node.type} 
                        size="small" 
                        sx={{ 
                          alignSelf: 'flex-start',
                          backgroundColor: getNodeColor(node.type),
                          color: 'white'
                        }} 
                      />
                      
                      <Box sx={{ flexGrow: 1, overflow: 'hidden', mt: 1 }}>
                        <Typography variant="caption" noWrap>
                          {node.properties && Object.entries(node.properties)
                            .slice(0, 2)
                            .map(([key, value]) => 
                              `${key}: ${typeof value === 'object' ? '...' : value}`
                            )
                            .join(', ')
                          }
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
            
            {selectedEntity && (
              <EntityDetail entity={selectedEntity} />
            )}
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Ask questions about your family knowledge graph
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g., 'Show all tasks assigned to mom' or 'What events are happening next week?'"
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageQuery()}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleNaturalLanguageQuery}
              sx={{ mb: 3 }}
            >
              Ask
            </Button>
            
            <QueryResultComponent result={queryResult} />
          </Box>
        )}
        
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6">Knowledge Graph Statistics</Typography>
            
            {graphData && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Entities:</strong> {graphData.nodes.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Relationships:</strong> {graphData.links.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Entity Types:</strong> {entityTypeFilters.length}
                </Typography>
                <Typography variant="body2">
                  <strong>Relationship Types:</strong> {relationshipTypeFilters.length}
                </Typography>
              </Box>
            )}
            
            <Typography variant="h6" sx={{ mt: 3 }}>Entity Type Distribution</Typography>
            {graphData && (
              <Box sx={{ mt: 1 }}>
                {entityTypeFilters.map(filter => {
                  const count = graphData.nodes.filter(node => node.type === filter.type).length;
                  return (
                    <Box key={filter.type} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: getNodeColor(filter.type),
                          mr: 1
                        }} 
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {filter.type}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Entity Types
        </Typography>
        
        {entityTypeFilters.map(filter => (
          <MenuItem 
            key={filter.type}
            onClick={() => handleEntityTypeFilter(filter.type)}
            sx={{ 
              backgroundColor: filter.enabled ? 'transparent' : '#f5f5f5'
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: getNodeColor(filter.type),
                mr: 1,
                opacity: filter.enabled ? 1 : 0.3
              }} 
            />
            <Typography 
              variant="body2"
              sx={{ opacity: filter.enabled ? 1 : 0.5 }}
            >
              {filter.type}
            </Typography>
          </MenuItem>
        ))}
        
        <Divider />
        
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Relationship Types
        </Typography>
        
        {relationshipTypeFilters.map(filter => (
          <MenuItem 
            key={filter.type}
            onClick={() => handleRelationshipTypeFilter(filter.type)}
            sx={{ 
              backgroundColor: filter.enabled ? 'transparent' : '#f5f5f5'
            }}
          >
            <Typography 
              variant="body2"
              sx={{ opacity: filter.enabled ? 1 : 0.5 }}
            >
              {filter.type}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
};

export default FamilyKnowledgeGraph;