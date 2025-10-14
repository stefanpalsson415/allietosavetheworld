import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Alert,
  Badge,
  Snackbar
} from '@mui/material';
import {
  Refresh,
  Storage,
  Storage as StorageIcon,
  Dashboard,
  Insights,
  Settings,
  People,
  Compare
} from '@mui/icons-material';

import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';
import GraphDatabaseMigration from './GraphDatabaseMigration';
import ProactiveInsightsDashboard from './ProactiveInsightsDashboard';
import ActionableInsightsDashboard from './ActionableInsightsDashboard';
import EntityResolutionDashboard from './EntityResolutionDashboard';
import useFamilyKnowledgeGraph from '../../hooks/useFamilyKnowledgeGraph';
import { useFamily } from '../../contexts/FamilyContext';
import Neo4jGraphService from '../../services/database/Neo4jGraphService';

/**
 * Enhanced Knowledge Dashboard component
 * Includes Graph DB migration and management features
 */
const EnhancedKnowledgeDashboard = () => {
  const { familyId: paramFamilyId } = useParams();
  const { familyId: contextFamilyId, familyMembers } = useFamily();
  
  // Use either family ID from params, context, or options
  const familyId = paramFamilyId || contextFamilyId;
  
  const {
    loading,
    error,
    graph,
    insights,
    initializeGraph,
    loadFamilyData,
    generateInsights
  } = useFamilyKnowledgeGraph({ 
    familyId,
    autoLoad: true
  });
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [neo4jConnected, setNeo4jConnected] = useState(false);
  const [neo4jStatus, setNeo4jStatus] = useState('not_checked');
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Check Neo4j connection status on load
  useEffect(() => {
    const checkNeo4jConnection = async () => {
      try {
        setNeo4jStatus('checking');
        const connected = await Neo4jGraphService.initialize().catch(() => false);
        setNeo4jConnected(connected);
        setNeo4jStatus(connected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Error checking Neo4j connection:', error);
        setNeo4jConnected(false);
        setNeo4jStatus('error');
      }
    };
    
    checkNeo4jConnection();
  }, []);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handleSnackbarClose = () => setSnackbarOpen(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      await initializeGraph();
      await loadFamilyData();
      await generateInsights();
      
      setRefreshKey(prev => prev + 1);
      showSnackbar('Knowledge graph refreshed', 'success');
    } catch (err) {
      console.error('Error refreshing knowledge graph:', err);
      showSnackbar('Error refreshing knowledge graph', 'error');
    }
  };
  
  // Loading state
  if (!graph && loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Error loading knowledge graph: {error.message}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Family Knowledge Graph</Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={
              neo4jStatus === 'connected' ? 'Neo4j Connected' : 
              neo4jStatus === 'disconnected' ? 'Neo4j Disconnected' :
              neo4jStatus === 'checking' ? 'Checking Neo4j Connection...' :
              'Neo4j Connection Error'
            }>
              <IconButton color={neo4jConnected ? 'success' : 'default'}>
                <Badge 
                  variant="dot" 
                  color={neo4jConnected ? 'success' : 'error'}
                  invisible={neo4jStatus === 'checking'}
                >
                  <StorageIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Knowledge Graph">
              <IconButton onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Graph Visualization" icon={<Dashboard />} iconPosition="start" />
          <Tab label="Database Migration" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="Insights" icon={<Insights />} iconPosition="start" />
          <Tab label="Proactive Engine" icon={<Insights />} iconPosition="start" />
          <Tab label="ML Recommendations" icon={<Insights />} iconPosition="start" />
          <Tab label="Entity Resolution" icon={<Compare />} iconPosition="start" />
          <Tab label="Settings" icon={<Settings />} iconPosition="start" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box>
            <FamilyKnowledgeGraph 
              key={`graph-${refreshKey}`}
              options={{
                maxDepth: 2,
                recenterOnSelect: true,
                highlightConnections: true
              }}
            />
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <GraphDatabaseMigration />
          </Box>
        )}
        
        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Family Insights</Typography>
              
              <Button
                variant="contained"
                startIcon={<Insights />}
                onClick={generateInsights}
              >
                Generate New Insights
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : insights && insights.length > 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    High Priority
                  </Typography>
                  
                  {insights
                    .filter(insight => insight.severity === 'high')
                    .map(insight => (
                      <Card key={insight.id} sx={{ mb: 2, borderLeft: '4px solid #f44336' }}>
                        <CardHeader
                          title={insight.title}
                          subheader={`Severity: ${insight.severity}`}
                          titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                          <Typography variant="body2">
                            {insight.description}
                          </Typography>
                          
                          {insight.actionable && insight.actionItems && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Suggested Actions:
                              </Typography>
                              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                {insight.actionItems.map((action, index) => (
                                  <li key={index}>
                                    <Typography variant="caption">
                                      {action}
                                    </Typography>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Medium Priority
                  </Typography>
                  
                  {insights
                    .filter(insight => insight.severity === 'medium')
                    .map(insight => (
                      <Card key={insight.id} sx={{ mb: 2, borderLeft: '4px solid #ff9800' }}>
                        <CardHeader
                          title={insight.title}
                          subheader={`Severity: ${insight.severity}`}
                          titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                          <Typography variant="body2">
                            {insight.description}
                          </Typography>
                          
                          {insight.actionable && insight.actionItems && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Suggested Actions:
                              </Typography>
                              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                {insight.actionItems.map((action, index) => (
                                  <li key={index}>
                                    <Typography variant="caption">
                                      {action}
                                    </Typography>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Information
                  </Typography>
                  
                  {insights
                    .filter(insight => insight.severity === 'info' || insight.severity === 'low')
                    .map(insight => (
                      <Card key={insight.id} sx={{ mb: 2, borderLeft: '4px solid #2196f3' }}>
                        <CardHeader
                          title={insight.title}
                          subheader={`Severity: ${insight.severity}`}
                          titleTypographyProps={{ variant: 'h6' }}
                        />
                        <CardContent>
                          <Typography variant="body2">
                            {insight.description}
                          </Typography>
                          
                          {insight.actionable && insight.actionItems && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Suggested Actions:
                              </Typography>
                              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                {insight.actionItems.map((action, index) => (
                                  <li key={index}>
                                    <Typography variant="caption">
                                      {action}
                                    </Typography>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                No insights available. Click "Generate New Insights" to analyze the knowledge graph.
              </Alert>
            )}
          </Box>
        )}
        
        {tabValue === 3 && (
          <Box>
            <ProactiveInsightsDashboard />
          </Box>
        )}
        
        {tabValue === 4 && (
          <Box>
            <ActionableInsightsDashboard />
          </Box>
        )}
        
        {tabValue === 5 && (
          <Box>
            <EntityResolutionDashboard />
          </Box>
        )}
        
        {tabValue === 6 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>Knowledge Graph Settings</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6">Graph Visualization</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure how the knowledge graph is visualized
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Settings would go here */}
                  <Alert severity="info">
                    Graph visualization settings coming soon.
                  </Alert>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6">Neo4j Database Connection</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure your Neo4j connection settings
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: neo4jConnected ? 'success.main' : 'error.main',
                      mr: 1
                    }} />
                    <Typography>
                      {neo4jConnected ? 'Connected' : 'Not Connected'}
                    </Typography>
                  </Box>
                  
                  <Button variant="outlined" sx={{ mt: 1 }}>
                    Configure Connection
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6">Knowledge Graph Statistics</Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {graph?.stats?.entityCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Entities
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {graph?.stats?.relationshipCount || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Relationships
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {Object.keys(graph?.stats?.entityTypeCount || {}).length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Entity Types
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {Object.keys(graph?.stats?.relationshipTypeCount || {}).length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Relationship Types
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnhancedKnowledgeDashboard;