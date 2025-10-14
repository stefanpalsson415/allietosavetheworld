import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Refresh,
  Upload,
  InsertDriveFile,
  Message,
  QuestionAnswer,
  LightbulbOutlined,
  Settings,
  Dashboard,
  Help,
  Summarize
} from '@mui/icons-material';

import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';
import useFamilyKnowledgeGraph from '../../hooks/useFamilyKnowledgeGraph';

/**
 * Knowledge Graph Dashboard component
 * Serves as the main interface for the Family Knowledge Graph system
 */
const FamilyKnowledgeDashboard = () => {
  const { familyId } = useParams();
  const {
    loading,
    error,
    graph,
    insights,
    initializeGraph,
    loadFamilyData,
    generateInsights,
    processContent,
    processBatch
  } = useFamilyKnowledgeGraph({ 
    familyId,
    autoLoad: true
  });
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [refreshKey, setRefreshKey] = useState(0);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  
  // Load family data
  useEffect(() => {
    if (familyId && graph) {
      loadFamilyData()
        .then(() => {
          showSnackbar('Family data loaded successfully', 'success');
          generateInsights();
        })
        .catch(err => {
          console.error('Error loading family data:', err);
          showSnackbar('Error loading family data', 'error');
        });
    }
  }, [familyId, graph, loadFamilyData, generateInsights]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };
  
  // Handle document processing
  const handleProcessDocuments = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('No files selected', 'warning');
      return;
    }
    
    setProcessingStatus('processing');
    
    try {
      // Create batch items
      const contentItems = selectedFiles.map(file => ({
        content: {
          id: `file_${Date.now()}_${file.name}`,
          name: file.name,
          file,
          mimeType: file.type
        },
        type: 'document'
      }));
      
      // Process batch
      const result = await processBatch(contentItems);
      
      showSnackbar(`Processed ${result.metadata.successCount} documents successfully`, 'success');
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setRefreshKey(prev => prev + 1);
      
      // Trigger insights generation
      generateInsights();
    } catch (err) {
      console.error('Error processing documents:', err);
      showSnackbar('Error processing documents', 'error');
    } finally {
      setProcessingStatus('idle');
    }
  };
  
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
  
  // Handle natural language query
  const handleNaturalLanguageQuery = async () => {
    if (!queryText) {
      showSnackbar('Please enter a query', 'warning');
      return;
    }
    
    setProcessingStatus('processing');
    
    try {
      // Process as a chat message
      const result = await processContent(
        {
          id: `query_${Date.now()}`,
          content: queryText,
          timestamp: new Date().toISOString()
        },
        'chat'
      );
      
      showSnackbar('Query processed successfully', 'success');
      setQueryDialogOpen(false);
      setQueryText('');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error processing query:', err);
      showSnackbar('Error processing query', 'error');
    } finally {
      setProcessingStatus('idle');
    }
  };
  
  // Handle insights generation
  const handleGenerateInsights = async () => {
    try {
      const newInsights = await generateInsights();
      
      showSnackbar(`Generated ${newInsights.length} insights`, 'success');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error generating insights:', err);
      showSnackbar('Error generating insights', 'error');
    }
  };
  
  // Render insight card
  const renderInsightCard = (insight) => {
    const severityColor = 
      insight.severity === 'high' ? '#f44336' :
      insight.severity === 'medium' ? '#ff9800' : 
      insight.severity === 'info' ? '#2196f3' : '#4caf50';
      
    return (
      <Card 
        key={insight.id} 
        sx={{ 
          mb: 2,
          borderLeft: `4px solid ${severityColor}`
        }}
      >
        <CardHeader
          title={insight.title}
          subheader={`Severity: ${insight.severity}`}
          titleTypographyProps={{ variant: 'h6' }}
          subheaderTypographyProps={{ variant: 'caption' }}
          action={
            <Tooltip title="View Details">
              <IconButton>
                <Summarize fontSize="small" />
              </IconButton>
            </Tooltip>
          }
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
    );
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
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Documents
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<QuestionAnswer />}
              onClick={() => setQueryDialogOpen(true)}
            >
              Ask a Question
            </Button>
            
            <Tooltip title="Refresh Knowledge Graph">
              <IconButton onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Graph Visualization" icon={<Dashboard />} iconPosition="start" />
          <Tab label="Insights" icon={<LightbulbOutlined />} iconPosition="start" />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Family Insights</Typography>
              
              <Button
                variant="contained"
                startIcon={<LightbulbOutlined />}
                onClick={handleGenerateInsights}
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
                    .map(renderInsightCard)}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Medium Priority
                  </Typography>
                  
                  {insights
                    .filter(insight => insight.severity === 'medium')
                    .map(renderInsightCard)}
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Information
                  </Typography>
                  
                  {insights
                    .filter(insight => insight.severity === 'info' || insight.severity === 'low')
                    .map(renderInsightCard)}
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                No insights available. Click "Generate New Insights" to analyze the knowledge graph.
              </Alert>
            )}
          </Box>
        )}
        
        {tabValue === 2 && (
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
                  <Typography variant="h6">Extraction Settings</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure how entities are extracted from content
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Settings would go here */}
                  <Alert severity="info">
                    Entity extraction settings coming soon.
                  </Alert>
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
      
      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Documents</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload documents to extract knowledge and add to the family knowledge graph.
            Supported file types: PDF, DOC, DOCX, TXT, JPG, PNG.
          </Typography>
          
          <Box 
            sx={{ 
              border: '2px dashed #ccc', 
              borderRadius: 2, 
              p: 4, 
              textAlign: 'center',
              mb: 3
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<InsertDriveFile />}
            >
              Select Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
            </Button>
            
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {selectedFiles.length} file(s) selected
                </Typography>
                <Box sx={{ mt: 1, textAlign: 'left' }}>
                  {selectedFiles.map((file, index) => (
                    <Typography key={index} variant="caption" display="block">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleProcessDocuments}
            disabled={selectedFiles.length === 0 || processingStatus === 'processing'}
          >
            {processingStatus === 'processing' ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Process Documents'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Query Dialog */}
      <Dialog
        open={queryDialogOpen}
        onClose={() => setQueryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ask a Question</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ask a question to extract knowledge from your query and add to the family knowledge graph.
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="e.g., 'Mark has a doctor's appointment next Tuesday at 3pm with Dr. Smith.'"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info" sx={{ mb: 2 }}>
            This feature will extract entities and relationships from your message.
            For example, if you mention an appointment, it will be added to your knowledge graph.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNaturalLanguageQuery}
            disabled={!queryText || processingStatus === 'processing'}
          >
            {processingStatus === 'processing' ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Process'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default FamilyKnowledgeDashboard;