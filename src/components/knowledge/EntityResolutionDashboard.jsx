/**
 * EntityResolutionDashboard.jsx
 * 
 * UI component for entity resolution in the knowledge graph.
 * Provides interface for finding, reviewing, and resolving duplicate entities.
 */

import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  Chip, 
  FormControl, 
  FormControlLabel, 
  Radio, 
  RadioGroup, 
  Select, 
  MenuItem, 
  TextField, 
  InputLabel, 
  IconButton, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Slider, 
  Alert, 
  Snackbar, 
  Switch
} from '@mui/material';
import { 
  Search, 
  Merge, 
  CompareArrows, 
  Close, 
  Check, 
  Refresh, 
  Settings, 
  DeleteOutline, 
  Save, 
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import FuzzyEntityResolutionService from '../../services/knowledge/FuzzyEntityResolutionService';
import Neo4jGraphService from '../../services/database/Neo4jGraphService';

/**
 * Dashboard for entity resolution management
 */
const EntityResolutionDashboard = () => {
  const { currentUser } = useAuth();
  const { familyId, familyMembers } = useFamily();
  
  // State
  const [entityType, setEntityType] = useState('person');
  const [matchThreshold, setMatchThreshold] = useState(0.7);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entityCounts, setEntityCounts] = useState({});
  const [duplicatesFound, setDuplicatesFound] = useState(0);
  const [duplicatesResolved, setDuplicatesResolved] = useState(0);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [mergeStatus, setMergeStatus] = useState('idle'); // idle, merging, success, error
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [mergeSelections, setMergeSelections] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [autoResolveEnabled, setAutoResolveEnabled] = useState(false);
  const [autoResolveThreshold, setAutoResolveThreshold] = useState(0.95);
  
  const entityTypes = [
    { value: 'person', label: 'Person' },
    { value: 'event', label: 'Event' },
    { value: 'task', label: 'Task' },
    { value: 'location', label: 'Location' },
    { value: 'document', label: 'Document' },
    { value: 'organization', label: 'Organization' },
    { value: 'skill', label: 'Skill' },
    { value: 'interest', label: 'Interest' }
  ];
  
  // Load initial data
  useEffect(() => {
    if (familyId) {
      loadEntityCounts();
    }
  }, [familyId]);
  
  // Load entity counts
  const loadEntityCounts = async () => {
    try {
      await Neo4jGraphService.initialize();
      
      const result = await Neo4jGraphService.executeQuery(`
        MATCH (n)
        WHERE n.familyId = $familyId
        RETURN labels(n)[0] as type, count(n) as count
      `, { familyId });
      
      const countsByType = {};
      result.forEach(row => {
        countsByType[row.type.toLowerCase()] = row.count;
      });
      
      setEntityCounts(countsByType);
    } catch (error) {
      console.error('Error loading entity counts:', error);
      setSnackbarMessage('Error loading entity counts: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Find duplicate candidates
  const findDuplicates = async () => {
    try {
      setLoading(true);
      setDuplicateCandidates([]);
      setSelectedDuplicate(null);
      
      // Initialize services
      await Neo4jGraphService.initialize();
      
      // Find potential duplicates
      const results = await FuzzyEntityResolutionService.findPotentialDuplicates(
        familyId,
        entityType,
        { threshold: matchThreshold }
      );
      
      // Process results
      const candidates = results.map(result => ({
        entities: result.entities,
        matchScore: result.matchScore,
        matchDetails: result.matchDetails,
        status: 'pending', // pending, merged, skipped
        selectedMasterEntity: result.entities[0].id, // Default to first entity as master
        mergedProperties: {}
      }));
      
      setDuplicateCandidates(candidates);
      setDuplicatesFound(candidates.length);
      
      // Auto-resolve if enabled and threshold met
      if (autoResolveEnabled) {
        const autoResolved = candidates.filter(candidate => 
          candidate.matchScore >= autoResolveThreshold
        );
        
        if (autoResolved.length > 0) {
          let resolvedCount = 0;
          
          for (const candidate of autoResolved) {
            try {
              await resolveDuplicate(candidate, candidate.entities[0].id);
              resolvedCount++;
            } catch (error) {
              console.error('Error auto-resolving duplicate:', error);
            }
          }
          
          if (resolvedCount > 0) {
            setSnackbarMessage(`Auto-resolved ${resolvedCount} high-confidence duplicates`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            
            // Refresh duplicates
            findDuplicates();
            return;
          }
        }
      }
      
      // Select first candidate if available
      if (candidates.length > 0) {
        selectDuplicate(candidates[0]);
      } else {
        setSnackbarMessage(`No potential duplicates found for entity type: ${entityType}`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error finding duplicates:', error);
      setSnackbarMessage('Error finding duplicates: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Select a duplicate candidate for review
  const selectDuplicate = (duplicate) => {
    setSelectedDuplicate(duplicate);
    
    // Initialize merge selections with properties from first entity
    const mergeProps = {};
    const primaryEntity = duplicate.entities[0];
    
    // Collect all unique property keys
    const allKeys = new Set();
    duplicate.entities.forEach(entity => {
      Object.keys(entity).forEach(key => {
        if (key !== 'id' && key !== 'type') {
          allKeys.add(key);
        }
      });
    });
    
    // Initialize with first entity's values
    allKeys.forEach(key => {
      mergeProps[key] = {
        value: primaryEntity[key] || '',
        sourceId: primaryEntity.id
      };
    });
    
    setMergeSelections(mergeProps);
  };
  
  // Update property selection for merge
  const selectPropertyValue = (propertyKey, value, sourceId) => {
    setMergeSelections(prev => ({
      ...prev,
      [propertyKey]: { value, sourceId }
    }));
  };
  
  // Create merged entity
  const createMergedProperties = () => {
    const mergedProps = { type: entityType, familyId };
    
    // Add selected properties
    Object.entries(mergeSelections).forEach(([key, selection]) => {
      if (selection.value !== undefined && selection.value !== null) {
        mergedProps[key] = selection.value;
      }
    });
    
    return mergedProps;
  };
  
  // Resolve a duplicate
  const resolveDuplicate = async (duplicate, masterId) => {
    try {
      setMergeStatus('merging');
      
      const otherIds = duplicate.entities
        .map(e => e.id)
        .filter(id => id !== masterId);
      
      let mergedProperties;
      
      if (masterId === 'create_new') {
        // Create new entity with merged properties
        mergedProperties = createMergedProperties();
      } else {
        // Use the selected master entity and update with merge selections
        const masterEntity = duplicate.entities.find(e => e.id === masterId);
        
        mergedProperties = { ...masterEntity };
        
        // Add selected properties
        Object.entries(mergeSelections).forEach(([key, selection]) => {
          if (selection.value !== undefined && selection.value !== null) {
            mergedProperties[key] = selection.value;
          }
        });
      }
      
      // Resolve the duplicate
      const result = await FuzzyEntityResolutionService.resolveDuplicateEntities(
        familyId,
        entityType,
        masterId === 'create_new' ? null : masterId,
        otherIds,
        mergedProperties
      );
      
      // Update UI
      setDuplicatesResolved(prev => prev + 1);
      
      // Update duplicate status
      setDuplicateCandidates(prev => 
        prev.map(item => 
          item === duplicate ? { ...item, status: 'merged' } : item
        )
      );
      
      setSelectedDuplicate(null);
      setMergeStatus('success');
      
      // Show success message
      setSnackbarMessage('Entities successfully merged');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      return result;
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      setMergeStatus('error');
      
      // Show error message
      setSnackbarMessage('Error merging entities: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      throw error;
    }
  };
  
  // Skip a duplicate
  const skipDuplicate = (duplicate) => {
    // Update duplicate status
    setDuplicateCandidates(prev => 
      prev.map(item => 
        item === duplicate ? { ...item, status: 'skipped' } : item
      )
    );
    
    setSelectedDuplicate(null);
    
    // Show message
    setSnackbarMessage('Duplicate skipped');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Entity Resolution</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Find and resolve duplicate entities in your family knowledge graph using fuzzy matching algorithms.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Search & Stats */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Find Duplicates</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="entity-type-label">Entity Type</InputLabel>
              <Select
                labelId="entity-type-label"
                value={entityType}
                label="Entity Type"
                onChange={(e) => setEntityType(e.target.value)}
              >
                {entityTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} {entityCounts[type.value] ? `(${entityCounts[type.value]})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Match Threshold: {matchThreshold}</Typography>
              <Slider
                value={matchThreshold}
                onChange={(e, newValue) => setMatchThreshold(newValue)}
                step={0.05}
                marks
                min={0.5}
                max={1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={advancedMode}
                    onChange={(e) => setAdvancedMode(e.target.checked)}
                  />
                }
                label="Advanced Mode"
              />
              
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadEntityCounts}
                size="small"
              >
                Refresh
              </Button>
            </Box>
            
            {advancedMode && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Auto-Resolution</Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoResolveEnabled}
                      onChange={(e) => setAutoResolveEnabled(e.target.checked)}
                    />
                  }
                  label="Auto-resolve duplicates"
                />
                
                {autoResolveEnabled && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" gutterBottom>
                      Auto-resolve threshold: {autoResolveThreshold}
                    </Typography>
                    <Slider
                      value={autoResolveThreshold}
                      onChange={(e, newValue) => setAutoResolveThreshold(newValue)}
                      step={0.01}
                      min={0.9}
                      max={1}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Automatically resolve entities with match scores above this threshold
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            <Button
              variant="contained"
              fullWidth
              startIcon={<Search />}
              onClick={findDuplicates}
              disabled={loading || !familyId}
            >
              {loading ? <CircularProgress size={24} /> : 'Find Duplicates'}
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Duplicates Found:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {duplicatesFound}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Duplicates Resolved:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {duplicatesResolved}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Current Entity Type:</Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                {entityType}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Entity Count:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {entityCounts[entityType] || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Middle column - Duplicate Candidates */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Potential Duplicates
              <Chip 
                label={duplicateCandidates.length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {!loading && duplicateCandidates.length === 0 && (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                <Typography variant="body2">
                  No duplicate candidates found. Try adjusting the threshold or changing entity type.
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {duplicateCandidates.map((duplicate, index) => (
                <Card 
                  key={index}
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedDuplicate === duplicate ? '2px solid' : '1px solid',
                    borderColor: selectedDuplicate === duplicate ? 'primary.main' : 'divider',
                    bgcolor: duplicate.status === 'merged' ? 'success.50' : 
                             duplicate.status === 'skipped' ? 'grey.100' : 'background.paper',
                    opacity: duplicate.status !== 'pending' ? 0.7 : 1
                  }}
                  onClick={() => duplicate.status === 'pending' && selectDuplicate(duplicate)}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Match Group #{index + 1}
                      </Typography>
                      <Chip 
                        label={`${Math.round(duplicate.matchScore * 100)}%`}
                        size="small"
                        color={
                          duplicate.matchScore >= 0.9 ? 'success' :
                          duplicate.matchScore >= 0.75 ? 'primary' :
                          'warning'
                        }
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {duplicate.entities.length} potential {duplicate.entities.length > 1 ? 'duplicates' : 'duplicate'}
                    </Typography>
                    
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {duplicate.entities.slice(0, 2).map((entity, eIdx) => (
                        <Typography 
                          key={eIdx} 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}
                        >
                          {entity.name || entity.title || entity.label || entity.id}
                        </Typography>
                      ))}
                      
                      {duplicate.entities.length > 2 && (
                        <Typography variant="body2" color="text.secondary">
                          +{duplicate.entities.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    {duplicate.status === 'merged' && (
                      <Chip size="small" label="Merged" color="success" />
                    )}
                    
                    {duplicate.status === 'skipped' && (
                      <Chip size="small" label="Skipped" color="default" />
                    )}
                  </CardActions>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Right column - Duplicate Resolution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Entity Resolution</Typography>
            
            {!selectedDuplicate ? (
              <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  No duplicate selected
                </Typography>
                <Typography variant="body2">
                  Select a potential duplicate from the list to review and resolve it.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Reviewing {selectedDuplicate.entities.length} potential duplicates
                    <Chip 
                      label={`${Math.round(selectedDuplicate.matchScore * 100)}% match`}
                      size="small"
                      color={
                        selectedDuplicate.matchScore >= 0.9 ? 'success' :
                        selectedDuplicate.matchScore >= 0.75 ? 'primary' :
                        'warning'
                      }
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select master entity or create new:
                    </Typography>
                    
                    <RadioGroup
                      value={selectedDuplicate.selectedMasterEntity}
                      onChange={(e) => {
                        setSelectedDuplicate({
                          ...selectedDuplicate,
                          selectedMasterEntity: e.target.value
                        });
                      }}
                    >
                      {selectedDuplicate.entities.map((entity, index) => (
                        <FormControlLabel
                          key={entity.id}
                          value={entity.id}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body2">
                                {entity.name || entity.title || entity.label || entity.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {entity.id}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                      
                      {advancedMode && (
                        <FormControlLabel
                          value="create_new"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body2">
                                Create new merged entity
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                (Combine selected properties and create a new entity)
                              </Typography>
                            </Box>
                          }
                        />
                      )}
                    </RadioGroup>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Property resolution:
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          {selectedDuplicate.entities.map((entity, index) => (
                            <TableCell key={index} align="center">
                              Entity {index + 1}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.keys(mergeSelections).map(propertyKey => (
                          <TableRow key={propertyKey}>
                            <TableCell component="th" scope="row">
                              {propertyKey}
                            </TableCell>
                            
                            {selectedDuplicate.entities.map((entity, index) => (
                              <TableCell key={index} align="center">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    {formatPropertyValue(entity[propertyKey])}
                                  </Typography>
                                  
                                  <Radio
                                    size="small"
                                    checked={mergeSelections[propertyKey]?.sourceId === entity.id}
                                    onChange={() => selectPropertyValue(
                                      propertyKey, 
                                      entity[propertyKey], 
                                      entity.id
                                    )}
                                  />
                                </Box>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={() => skipDuplicate(selectedDuplicate)}
                  >
                    Skip
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={mergeStatus === 'merging' ? <CircularProgress size={20} /> : <Merge />}
                    onClick={() => resolveDuplicate(
                      selectedDuplicate, 
                      selectedDuplicate.selectedMasterEntity
                    )}
                    disabled={mergeStatus === 'merging'}
                  >
                    {mergeStatus === 'merging' ? 'Merging...' : 'Merge Entities'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper component for property table
const Table = ({ children }) => (
  <Box sx={{ width: '100%', overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {children}
    </table>
  </Box>
);

const TableHead = ({ children }) => <thead>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children }) => <tr>{children}</tr>;
const TableCell = ({ children, component, scope, align }) => (
  <td 
    style={{ 
      padding: '8px 16px', 
      borderBottom: '1px solid rgba(224, 224, 224, 1)',
      textAlign: align || 'left' 
    }}
  >
    {children}
  </td>
);

// Helper function to format property values for display
const formatPropertyValue = (value) => {
  if (value === undefined || value === null) {
    return <span style={{ color: 'rgba(0, 0, 0, 0.38)' }}>N/A</span>;
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Empty array';
    }
    return JSON.stringify(value);
  }
  
  return String(value);
};

export default EntityResolutionDashboard;