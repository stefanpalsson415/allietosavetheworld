import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  LinearProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Refresh,
  Storage,
  Storage as DatabaseIcon,
  Merge,
  FilterList,
  Settings,
  CloudUpload,
  DataObject
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import GraphDbMigrationService from '../../services/database/GraphDbMigrationService';
import Neo4jGraphService from '../../services/database/Neo4jGraphService';
import FuzzyEntityResolutionService from '../../services/knowledge/FuzzyEntityResolutionService';

/**
 * Graph Database Migration component
 * Provides UI for migrating from Firebase to Neo4j and managing entity resolution
 */
const GraphDatabaseMigration = () => {
  const { familyId: paramFamilyId } = useParams();
  const { familyId: contextFamilyId } = useFamily();
  
  // Use either family ID from params, context, or options
  const familyId = paramFamilyId || contextFamilyId;
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [migrationResults, setMigrationResults] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateResolutionResults, setDuplicateResolutionResults] = useState(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    uri: process.env.REACT_APP_NEO4J_URI || 'neo4j://localhost:7687',
    username: process.env.REACT_APP_NEO4J_USER || 'neo4j',
    password: process.env.REACT_APP_NEO4J_PASSWORD || '',
    database: process.env.REACT_APP_NEO4J_DATABASE || 'family'
  });
  
  // Step definitions
  const steps = [
    { label: 'Connect to Neo4j', description: 'Establish connection to graph database' },
    { label: 'Initialize Schema', description: 'Create constraints and indexes' },
    { label: 'Migrate Data', description: 'Transfer data from Firebase to Neo4j' },
    { label: 'Validate Migration', description: 'Ensure all data was migrated correctly' },
    { label: 'Entity Resolution', description: 'Find and merge duplicate entities' }
  ];
  
  // Connect to Neo4j
  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Override connection config if provided
      if (dbConfig.uri) {
        Neo4jGraphService.config.uri = dbConfig.uri;
      }
      if (dbConfig.username) {
        Neo4jGraphService.config.user = dbConfig.username;
      }
      if (dbConfig.password) {
        Neo4jGraphService.config.password = dbConfig.password;
      }
      if (dbConfig.database) {
        Neo4jGraphService.config.database = dbConfig.database;
      }
      
      const success = await Neo4jGraphService.initialize();
      
      if (success) {
        setConnectionStatus('connected');
        setActiveStep(1);
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Error connecting to Neo4j:', error);
      setConnectionStatus('failed');
    }
  };
  
  // Initialize Neo4j schema
  const handleInitializeSchema = async () => {
    try {
      setMigrationStatus('initializing_schema');
      
      const success = await Neo4jGraphService.initializeSchema();
      
      if (success) {
        setActiveStep(2);
        setMigrationStatus('schema_initialized');
      } else {
        setMigrationStatus('schema_failed');
      }
    } catch (error) {
      console.error('Error initializing schema:', error);
      setMigrationStatus('schema_failed');
    }
  };
  
  // Migrate data
  const handleMigrateData = async () => {
    try {
      setMigrationStatus('migrating');
      
      const results = await GraphDbMigrationService.migrateFamily(familyId);
      
      setMigrationResults(results);
      setActiveStep(3);
      setMigrationStatus(results.status);
    } catch (error) {
      console.error('Error migrating data:', error);
      setMigrationStatus('migration_failed');
    }
  };
  
  // Validate migration
  const handleValidateMigration = async () => {
    try {
      setMigrationStatus('validating');
      
      const results = await GraphDbMigrationService.validateMigration(familyId);
      
      setValidationResults(results);
      setActiveStep(4);
      setMigrationStatus(results.status === 'passed' ? 'validation_passed' : 'validation_failed');
    } catch (error) {
      console.error('Error validating migration:', error);
      setMigrationStatus('validation_failed');
    }
  };
  
  // Find duplicates
  const handleFindDuplicates = async () => {
    try {
      setMigrationStatus('finding_duplicates');
      
      const duplicates = await FuzzyEntityResolutionService.findPotentialDuplicates(
        familyId,
        null,
        { minScore: 0.85 }
      );
      
      setDuplicates(duplicates);
      setSelectedDuplicates(duplicates.map(d => ({
        primaryId: d.primaryId,
        duplicateId: d.duplicateId,
        selected: true
      })));
      
      setMigrationStatus('duplicates_found');
    } catch (error) {
      console.error('Error finding duplicates:', error);
      setMigrationStatus('duplicates_failed');
    }
  };
  
  // Resolve duplicates
  const handleResolveDuplicates = async () => {
    try {
      setMigrationStatus('resolving_duplicates');
      
      // Filter selected duplicates
      const selectedDuplicatesList = selectedDuplicates
        .filter(d => d.selected)
        .map(d => ({
          primaryId: d.primaryId,
          duplicateId: d.duplicateId
        }));
      
      if (selectedDuplicatesList.length === 0) {
        setMigrationStatus('no_duplicates_selected');
        return;
      }
      
      const results = await FuzzyEntityResolutionService.resolveDuplicates(
        familyId,
        selectedDuplicatesList,
        { deleteDuplicates: true }
      );
      
      setDuplicateResolutionResults(results);
      setMigrationStatus('duplicates_resolved');
    } catch (error) {
      console.error('Error resolving duplicates:', error);
      setMigrationStatus('resolution_failed');
    }
  };
  
  // Toggle duplicate selection
  const toggleDuplicateSelection = (primaryId, duplicateId) => {
    setSelectedDuplicates(prev => 
      prev.map(item => 
        (item.primaryId === primaryId && item.duplicateId === duplicateId)
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };
  
  // Select all duplicates
  const selectAllDuplicates = (selected) => {
    setSelectedDuplicates(prev => 
      prev.map(item => ({ ...item, selected }))
    );
  };
  
  // Get migration status component
  const getMigrationStatusComponent = () => {
    switch (migrationStatus) {
      case 'idle':
        return <Typography>Ready to start migration</Typography>;
        
      case 'connecting':
      case 'initializing_schema':
      case 'migrating':
      case 'validating':
      case 'finding_duplicates':
      case 'resolving_duplicates':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography>
              {migrationStatus === 'connecting' && 'Connecting to Neo4j...'}
              {migrationStatus === 'initializing_schema' && 'Initializing schema...'}
              {migrationStatus === 'migrating' && 'Migrating data...'}
              {migrationStatus === 'validating' && 'Validating migration...'}
              {migrationStatus === 'finding_duplicates' && 'Finding duplicate entities...'}
              {migrationStatus === 'resolving_duplicates' && 'Resolving duplicate entities...'}
            </Typography>
          </Box>
        );
        
      case 'connected':
        return (
          <Alert severity="success">
            Connected to Neo4j successfully
          </Alert>
        );
        
      case 'schema_initialized':
        return (
          <Alert severity="success">
            Schema initialized successfully
          </Alert>
        );
        
      case 'completed':
      case 'completed_with_errors':
        return (
          <Alert severity={migrationStatus === 'completed' ? 'success' : 'warning'}>
            {migrationStatus === 'completed'
              ? 'Migration completed successfully'
              : 'Migration completed with some errors'}
          </Alert>
        );
        
      case 'validation_passed':
        return (
          <Alert severity="success">
            Validation passed. All data migrated successfully.
          </Alert>
        );
        
      case 'validation_failed':
        return (
          <Alert severity="warning">
            Validation failed. Some data may not have been migrated correctly.
          </Alert>
        );
        
      case 'duplicates_found':
        return (
          <Alert severity="info">
            Found {duplicates.length} potential duplicate entities.
          </Alert>
        );
        
      case 'duplicates_resolved':
        return (
          <Alert severity="success">
            Successfully resolved {duplicateResolutionResults?.resolved.length || 0} duplicate entities.
          </Alert>
        );
        
      case 'no_duplicates_selected':
        return (
          <Alert severity="warning">
            No duplicates selected for resolution.
          </Alert>
        );
        
      case 'failed':
      case 'schema_failed':
      case 'migration_failed':
      case 'duplicates_failed':
      case 'resolution_failed':
        return (
          <Alert severity="error">
            Error: {migrationStatus.replace('_', ' ')}
          </Alert>
        );
        
      default:
        return null;
    }
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Connect to Neo4j
        return (
          <Box>
            <Typography variant="body1" paragraph>
              First, establish a connection to your Neo4j database.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Connection Status: {connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </Typography>
              
              <Button
                variant="contained"
                onClick={handleConnect}
                startIcon={<DatabaseIcon />}
                disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
                sx={{ mr: 1 }}
              >
                Connect to Neo4j
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setConfigDialogOpen(true)}
                startIcon={<Settings />}
              >
                Configure Connection
              </Button>
            </Paper>
          </Box>
        );
        
      case 1: // Initialize Schema
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Initialize the Neo4j schema with constraints and indexes for entity types and relationships.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleInitializeSchema}
                startIcon={<DataObject />}
                disabled={
                  migrationStatus === 'initializing_schema' || 
                  migrationStatus === 'schema_initialized'
                }
              >
                Initialize Schema
              </Button>
            </Paper>
          </Box>
        );
        
      case 2: // Migrate Data
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Migrate family data from Firebase to Neo4j.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleMigrateData}
                startIcon={<CloudUpload />}
                disabled={
                  migrationStatus === 'migrating' || 
                  migrationStatus === 'completed' ||
                  migrationStatus === 'completed_with_errors'
                }
              >
                Migrate Data
              </Button>
            </Paper>
            
            {migrationResults && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Migration Results
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {migrationResults.entityCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Entities Migrated
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {migrationResults.relationshipCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Relationships Migrated
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {migrationResults.errors.length}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Errors
                    </Typography>
                  </Paper>
                </Box>
                
                {migrationResults.errors.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        Migration Errors ({migrationResults.errors.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {migrationResults.errors.slice(0, 10).map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Error color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${error.type}: ${error.id}`}
                              secondary={error.error}
                            />
                          </ListItem>
                        ))}
                        
                        {migrationResults.errors.length > 10 && (
                          <ListItem>
                            <ListItemText
                              primary={`... and ${migrationResults.errors.length - 10} more errors`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </Box>
        );
        
      case 3: // Validate Migration
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Validate that all data was migrated correctly.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleValidateMigration}
                startIcon={<CheckCircle />}
                disabled={
                  migrationStatus === 'validating' || 
                  migrationStatus === 'validation_passed'
                }
              >
                Validate Migration
              </Button>
            </Paper>
            
            {validationResults && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Validation Results
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {validationResults.firebaseEntityCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Firebase Entities
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {validationResults.neo4jEntityCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Neo4j Entities
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {validationResults.firebaseRelationshipCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Firebase Relationships
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {validationResults.neo4jRelationshipCount}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Neo4j Relationships
                    </Typography>
                  </Paper>
                </Box>
                
                {(validationResults.missingEntities.length > 0 || 
                  validationResults.missingRelationships.length > 0) && (
                  <Box>
                    {validationResults.missingEntities.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>
                            Missing Entities ({validationResults.missingEntities.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {validationResults.missingEntities.slice(0, 10).map((entity, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <Warning color="warning" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={entity.id}
                                  secondary={`Type: ${entity.type}`}
                                />
                              </ListItem>
                            ))}
                            
                            {validationResults.missingEntities.length > 10 && (
                              <ListItem>
                                <ListItemText
                                  primary={`... and ${validationResults.missingEntities.length - 10} more`}
                                />
                              </ListItem>
                            )}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {validationResults.missingRelationships.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>
                            Missing Relationships ({validationResults.missingRelationships.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {validationResults.missingRelationships.slice(0, 10).map((rel, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <Warning color="warning" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`${rel.sourceId} → ${rel.targetId}`}
                                  secondary={`Type: ${rel.type}`}
                                />
                              </ListItem>
                            ))}
                            
                            {validationResults.missingRelationships.length > 10 && (
                              <ListItem>
                                <ListItemText
                                  primary={`... and ${validationResults.missingRelationships.length - 10} more`}
                                />
                              </ListItem>
                            )}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
        
      case 4: // Entity Resolution
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Find and merge duplicate entities using fuzzy matching.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleFindDuplicates}
                startIcon={<FilterList />}
                disabled={
                  migrationStatus === 'finding_duplicates' || 
                  migrationStatus === 'resolving_duplicates'
                }
                sx={{ mr: 1 }}
              >
                Find Duplicates
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleResolveDuplicates}
                startIcon={<Merge />}
                disabled={
                  duplicates.length === 0 || 
                  migrationStatus === 'resolving_duplicates' ||
                  !selectedDuplicates.some(d => d.selected)
                }
              >
                Resolve Selected Duplicates
              </Button>
            </Paper>
            
            {duplicates.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Potential Duplicates ({duplicates.length})
                  </Typography>
                  
                  <Box>
                    <Button
                      size="small"
                      onClick={() => selectAllDuplicates(true)}
                      sx={{ mr: 1 }}
                    >
                      Select All
                    </Button>
                    
                    <Button
                      size="small"
                      onClick={() => selectAllDuplicates(false)}
                    >
                      Deselect All
                    </Button>
                  </Box>
                </Box>
                
                <List sx={{ bgcolor: 'background.paper', maxHeight: 400, overflow: 'auto' }}>
                  {duplicates.map((duplicate, index) => {
                    const isSelected = selectedDuplicates.find(
                      d => d.primaryId === duplicate.primaryId && d.duplicateId === duplicate.duplicateId
                    )?.selected;
                    
                    return (
                      <Accordion key={index} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Chip 
                              label={duplicate.entityType}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            
                            <Typography sx={{ flex: 1 }}>
                              {duplicate.properties1.name || duplicate.properties1.title || duplicate.primaryId} &
                              {duplicate.properties2.name || duplicate.properties2.title || duplicate.duplicateId}
                            </Typography>
                            
                            <Chip 
                              label={`Score: ${(duplicate.score * 100).toFixed(0)}%`}
                              color={duplicate.score >= 0.9 ? 'error' : 'warning'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            
                            <Button
                              size="small"
                              variant={isSelected ? 'contained' : 'outlined'}
                              color={isSelected ? 'primary' : 'default'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDuplicateSelection(duplicate.primaryId, duplicate.duplicateId);
                              }}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Primary Entity:
                              </Typography>
                              <Typography variant="body2" component="pre" sx={{ 
                                whiteSpace: 'pre-wrap',
                                backgroundColor: '#f5f5f5',
                                p: 1,
                                borderRadius: 1 
                              }}>
                                {JSON.stringify(duplicate.properties1, null, 2)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Duplicate Entity:
                              </Typography>
                              <Typography variant="body2" component="pre" sx={{ 
                                whiteSpace: 'pre-wrap',
                                backgroundColor: '#f5f5f5',
                                p: 1,
                                borderRadius: 1 
                              }}>
                                {JSON.stringify(duplicate.properties2, null, 2)}
                              </Typography>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </List>
              </Box>
            )}
            
            {duplicateResolutionResults && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Resolution Results
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {duplicateResolutionResults.resolved.length}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Duplicates Resolved
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {duplicateResolutionResults.failed.length}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Failures
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6" align="center">
                      {duplicateResolutionResults.skipped.length}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Skipped
                    </Typography>
                  </Paper>
                </Box>
                
                {duplicateResolutionResults.failed.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        Resolution Failures ({duplicateResolutionResults.failed.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {duplicateResolutionResults.failed.map((failure, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Error color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${failure.primaryId} → ${failure.duplicateId}`}
                              secondary={failure.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </Box>
        );
        
      default:
        return <Typography>Unknown step</Typography>;
    }
  };
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Graph Database Migration
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Migrate your family knowledge graph from Firebase to Neo4j for advanced graph capabilities.
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mb: 3 }}>
          {getMigrationStatusComponent()}
        </Box>
        
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={() => setActiveStep(prevStep => Math.max(0, prevStep - 1))}
            disabled={activeStep === 0 || migrationStatus.includes('ing')}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            onClick={() => {
              switch (activeStep) {
                case 0:
                  handleConnect();
                  break;
                case 1:
                  handleInitializeSchema();
                  break;
                case 2:
                  handleMigrateData();
                  break;
                case 3:
                  handleValidateMigration();
                  break;
                case 4:
                  handleFindDuplicates();
                  break;
                default:
                  break;
              }
            }}
            disabled={
              (activeStep === 0 && connectionStatus === 'connected') ||
              (activeStep === 1 && migrationStatus === 'schema_initialized') ||
              (activeStep === 2 && (migrationStatus === 'completed' || migrationStatus === 'completed_with_errors')) ||
              (activeStep === 3 && (migrationStatus === 'validation_passed' || migrationStatus === 'validation_failed')) ||
              migrationStatus.includes('ing')
            }
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </CardContent>
      
      {/* Database Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Neo4j Database Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="URI"
              value={dbConfig.uri}
              onChange={(e) => setDbConfig(prev => ({ ...prev, uri: e.target.value }))}
              placeholder="neo4j://localhost:7687"
              helperText="Neo4j database URI"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={dbConfig.username}
              onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
              placeholder="neo4j"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={dbConfig.password}
              onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Database Name"
              value={dbConfig.database}
              onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
              placeholder="family"
              helperText="Database name (default: neo4j)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfigDialogOpen(false);
              // Connection will be tested when Connect button is clicked
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default GraphDatabaseMigration;