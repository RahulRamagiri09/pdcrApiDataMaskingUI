import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
// import Grid from '@mui/material/Unstable_Grid';
import Grid from '@mui/material/Grid'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { connectionsAPI, workflowsAPI, maskingAPI } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import { getCurrentUser } from '../../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0b2677',
    },
    secondary: {
      main: '#0b2677',
    },
  },
});

const CreateWorkflowPage = () => {
  const navigate = useNavigate();
  const { id: workflowId } = useParams();
  const user = getCurrentUser();
  const isEditMode = Boolean(workflowId);
  const [activeStep, setActiveStep] = useState(isEditMode ? 2 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connections, setConnections] = useState([]);
  const [piiAttributes, setPiiAttributes] = useState([]);
  const [categorizedPiiAttributes, setCategorizedPiiAttributes] = useState({
    string: [],
    date: [],
    datetime: [],
    numeric: [],
    boolean: []
  });
  const [previewDialog, setPreviewDialog] = useState({ open: false, attribute: '', samples: [] });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source_connection_id: '',
    destination_connection_id: '',
    table_mappings: []
  });

  const [currentTableMapping, setCurrentTableMapping] = useState({
    source_schema: '',
    source_table: '',
    destination_schema: '',
    destination_table: '',
    column_mappings: []
  });

  const [sourceSchemas, setSourceSchemas] = useState([]);
  const [destinationSchemas, setDestinationSchemas] = useState([]);
  const [selectedSourceSchema, setSelectedSourceSchema] = useState('');
  const [selectedDestinationSchema, setSelectedDestinationSchema] = useState('');
  const [sourceTables, setSourceTables] = useState([]);
  const [destinationTables, setDestinationTables] = useState([]);
  const [sourceColumns, setSourceColumns] = useState([]);

  const steps = ['Basic Info', 'Select Tables', 'Configure Mapping', 'Review & Create'];

  // Map SQL data types to PII attribute categories
  const getAttributeCategoryForDataType = (dataType) => {
    if (!dataType) return 'string'; // Default to string if no data type

    const type = dataType.toLowerCase();

    // Numeric types
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') ||
        type.includes('float') || type.includes('real') || type.includes('money')) {
      return 'numeric';
    }

    // Date types (no time component)
    if (type === 'date') {
      return 'date';
    }

    // DateTime types (with time component)
    if (type.includes('datetime') || type.includes('timestamp') || type.includes('time')) {
      return 'datetime';
    }

    // Boolean types
    if (type === 'bit' || type === 'bool' || type === 'boolean') {
      return 'boolean';
    }

    // String types (default) - varchar, nvarchar, char, nchar, text, ntext, etc.
    return 'string';
  };

  // Get filtered PII attributes based on column data type
  const getFilteredPiiAttributes = (columnName) => {
    const columnInfo = sourceColumns.find(col => col.name === columnName);
    if (!columnInfo || !columnInfo.data_type) {
      return piiAttributes; // Fallback to all if no data type info
    }

    const category = getAttributeCategoryForDataType(columnInfo.data_type);
    return categorizedPiiAttributes[category] || [];
  };

  useEffect(() => {
    loadInitialData();

    // Load workflow data if in edit mode
    if (isEditMode && workflowId) {
      loadWorkflowForEdit(workflowId);
    }
  }, [workflowId, isEditMode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [connectionsRes, piiRes] = await Promise.all([
        connectionsAPI.getAll(),
        workflowsAPI.getPiiAttributes()
      ]);

      // Handle different response structures safely
      const connectionsData = connectionsRes.data?.data || connectionsRes.data || [];
      const piiData = piiRes.data?.data || piiRes.data || [];

      setConnections(Array.isArray(connectionsData) ? connectionsData : []);

      // Handle both old (flat array) and new (categorized object) API response formats
      if (piiData && typeof piiData === 'object' && !Array.isArray(piiData)) {
        // New categorized format: { string: [...], date: [...], datetime: [...], numeric: [...], boolean: [...] }
        const flatArray = [
          ...(Array.isArray(piiData.string) ? piiData.string : []),
          ...(Array.isArray(piiData.date) ? piiData.date : []),
          ...(Array.isArray(piiData.datetime) ? piiData.datetime : []),
          ...(Array.isArray(piiData.numeric) ? piiData.numeric : []),
          ...(Array.isArray(piiData.boolean) ? piiData.boolean : [])
        ];
        setPiiAttributes(flatArray);

        // Store categorized structure for smart filtering
        setCategorizedPiiAttributes({
          string: Array.isArray(piiData.string) ? piiData.string : [],
          date: Array.isArray(piiData.date) ? piiData.date : [],
          datetime: Array.isArray(piiData.datetime) ? piiData.datetime : [],
          numeric: Array.isArray(piiData.numeric) ? piiData.numeric : [],
          boolean: Array.isArray(piiData.boolean) ? piiData.boolean : []
        });
      } else if (Array.isArray(piiData)) {
        // Old flat array format: ["first_name", "last_name", ...]
        setPiiAttributes(piiData);
        // No categorized data available, fallback to showing all attributes for all types
        setCategorizedPiiAttributes({
          string: piiData,
          date: piiData,
          datetime: piiData,
          numeric: piiData,
          boolean: piiData
        });
      } else {
        // Invalid or empty response
        setPiiAttributes([]);
        setCategorizedPiiAttributes({
          string: [],
          date: [],
          datetime: [],
          numeric: [],
          boolean: []
        });
      }
    } catch (err) {
      setError(err.message);
      setConnections([]);
      setPiiAttributes([]);
      setCategorizedPiiAttributes({
        string: [],
        date: [],
        datetime: [],
        numeric: [],
        boolean: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowForEdit = async (id) => {
    try {
      setLoading(true);
      const response = await workflowsAPI.getById(id);
      const workflowData = response.data?.data || response.data;

      // Populate formData with existing workflow
      setFormData({
        name: workflowData.name,
        description: workflowData.description,
        source_connection_id: workflowData.source_connection_id,
        destination_connection_id: workflowData.destination_connection_id,
        table_mappings: workflowData.table_mappings || []
      });

      // If there's at least one table mapping, populate current table mapping
      if (workflowData.table_mappings && workflowData.table_mappings.length > 0) {
        const firstMapping = workflowData.table_mappings[0];

        // Extract schema from schema-qualified table names (e.g., "dbo.Users_sample_pp")
        const [sourceSchema, sourceTable] = firstMapping.source_table.split('.');
        const [destSchema, destTable] = firstMapping.destination_table.split('.');

        setSelectedSourceSchema(sourceSchema);
        setSelectedDestinationSchema(destSchema);

        // Load schemas for dropdowns - pass connection IDs directly
        await Promise.all([
          loadSourceSchemas(workflowData.source_connection_id),
          loadDestinationSchemas(workflowData.destination_connection_id)
        ]);

        // Load tables for selected schemas - pass connection IDs directly
        await Promise.all([
          loadSourceTablesBySchema(sourceSchema, workflowData.source_connection_id),
          loadDestinationTablesBySchema(destSchema, workflowData.destination_connection_id)
        ]);

        // Set current table mapping (without schema-qualified names for editing)
        setCurrentTableMapping({
          source_schema: sourceSchema,
          source_table: sourceTable,
          destination_schema: destSchema,
          destination_table: destTable,
          column_mappings: firstMapping.column_mappings || []
        });

        // Load source columns for display - fetch actual data types from database
        try {
          const columnsResponse = await connectionsAPI.getSourceTableColumns(
            workflowData.source_connection_id,
            sourceSchema,
            sourceTable
          );
          const columnsData = columnsResponse.data?.data || columnsResponse.data || [];
          setSourceColumns(Array.isArray(columnsData) ? columnsData : []);
        } catch (err) {
          console.error('Failed to load column types:', err);
          // Fallback to stored data with varchar default
          setSourceColumns(firstMapping.column_mappings.map(col => ({
            name: col.source_column,
            data_type: 'varchar'
          })));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(null);
  };

  const handleNext = async () => {
    try {
      if (activeStep === 0) {
        // Validate basic info
        if (!formData.name || !formData.source_connection_id || !formData.destination_connection_id) {
          setError('Please fill in all required fields');
          return;
        }
        if (formData.source_connection_id === formData.destination_connection_id) {
          setError('Source and destination connections must be different');
          return;
        }
        // Load schemas for both source and destination connections
        await Promise.all([
          loadSourceSchemas(formData.source_connection_id),
          loadDestinationSchemas(formData.destination_connection_id)
        ]);
      } else if (activeStep === 1) {
        // Validate schema and table selection
        if (!selectedSourceSchema || !selectedDestinationSchema) {
          setError('Please select both source and destination schemas');
          return;
        }
        if (!currentTableMapping.source_table || !currentTableMapping.destination_table) {
          setError('Please select both source and destination tables');
          return;
        }
        await loadSourceColumns();
      } else if (activeStep === 2) {
        // Validate column mappings
        if (currentTableMapping.column_mappings.length === 0) {
          setError('Please configure at least one column mapping');
          return;
        }
        // Add or update table mapping with schema-qualified table names
        const mappingToSave = {
          ...currentTableMapping,
          source_table: `${currentTableMapping.source_schema}.${currentTableMapping.source_table}`,
          destination_table: `${currentTableMapping.destination_schema}.${currentTableMapping.destination_table}`
        };

        setFormData(prev => {
          if (isEditMode) {
            // In edit mode, replace the first table mapping
            const updatedMappings = [...prev.table_mappings];
            updatedMappings[0] = mappingToSave;
            return {
              ...prev,
              table_mappings: updatedMappings
            };
          } else {
            // In create mode, add the new table mapping
            return {
              ...prev,
              table_mappings: [...prev.table_mappings, mappingToSave]
            };
          }
        });
      }

      setActiveStep(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const loadSourceSchemas = async (connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.source_connection_id;
      const response = await connectionsAPI.getSourceSchemas(connId);

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setSourceSchemas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSourceSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDestinationSchemas = async (connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.destination_connection_id;
      const response = await connectionsAPI.getDestinationSchemas(connId);

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setDestinationSchemas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setDestinationSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSourceTablesBySchema = async (schemaName, connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.source_connection_id;
      const response = await connectionsAPI.getSourceTablesBySchema(
        connId,
        schemaName
      );

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setSourceTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSourceTables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDestinationTablesBySchema = async (schemaName, connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.destination_connection_id;
      const response = await connectionsAPI.getDestinationTablesBySchema(
        connId,
        schemaName
      );

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setDestinationTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setDestinationTables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSourceColumns = async () => {
    try {
      setLoading(true);
      const response = await connectionsAPI.getSourceTableColumns(
        formData.source_connection_id,
        currentTableMapping.source_schema,
        currentTableMapping.source_table
      );

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setSourceColumns(Array.isArray(data) ? data : []);

      // Initialize column mappings
      const columnMappings = data.map(col => ({
        source_column: col.name,
        destination_column: col.name,
        is_pii: false,
        pii_attribute: ''
      }));

      setCurrentTableMapping(prev => ({
        ...prev,
        column_mappings: columnMappings
      }));
    } catch (err) {
      setError(err.message);
      setSourceColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingChange = (index, field, value) => {
    setCurrentTableMapping(prev => ({
      ...prev,
      column_mappings: prev.column_mappings.map((mapping, i) => {
        if (i === index) {
          const updatedMapping = { ...mapping, [field]: value };
          // When unchecking "Is PII", also clear the PII attribute
          if (field === 'is_pii' && value === false) {
            updatedMapping.pii_attribute = '';
          }
          return updatedMapping;
        }
        return mapping;
      })
    }));
  };

  const handlePreviewSample = async (attribute) => {
    try {
      const response = await maskingAPI.generateSampleData(attribute, 5);

      // Handle different response structures safely
      const samples = response.data?.data?.samples || response.data?.samples || [];
      setPreviewDialog({
        open: true,
        attribute,
        samples: Array.isArray(samples) ? samples : []
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      setLoading(true);
      if (isEditMode) {
        await workflowsAPI.update(workflowId, formData);
      } else {
        await workflowsAPI.create(formData);
      }
      navigate('/workflows');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Workflow Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Source Connection</InputLabel>
                <Select
                  value={formData.source_connection_id}
                  onChange={handleInputChange('source_connection_id')}
                  label="Source Connection"
                >
                  {connections.map((conn) => (
                    <MenuItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.server}/{conn.database})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Destination Connection</InputLabel>
                <Select
                  value={formData.destination_connection_id}
                  onChange={handleInputChange('destination_connection_id')}
                  label="Destination Connection"
                >
                  {connections.map((conn) => (
                    <MenuItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.server}/{conn.database})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Source Schema and Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Source Schema</InputLabel>
                <Select
                  value={selectedSourceSchema}
                  onChange={(e) => {
                    const schema = e.target.value;
                    setSelectedSourceSchema(schema);
                    setCurrentTableMapping(prev => ({
                      ...prev,
                      source_schema: schema,
                      source_table: ''
                    }));
                    setSourceTables([]);
                    if (schema) {
                      loadSourceTablesBySchema(schema, formData.source_connection_id);
                    }
                  }}
                  label="Source Schema"
                >
                  {sourceSchemas.map((schema) => (
                    <MenuItem key={schema} value={schema}>
                      {schema}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required disabled={!selectedSourceSchema}>
                <InputLabel>Source Table</InputLabel>
                <Select
                  value={currentTableMapping.source_table}
                  onChange={(e) => {
                    setCurrentTableMapping(prev => ({
                      ...prev,
                      source_table: e.target.value
                    }));
                  }}
                  label="Source Table"
                >
                  {sourceTables.map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Destination Schema and Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Destination Schema</InputLabel>
                <Select
                  value={selectedDestinationSchema}
                  onChange={(e) => {
                    const schema = e.target.value;
                    setSelectedDestinationSchema(schema);
                    setCurrentTableMapping(prev => ({
                      ...prev,
                      destination_schema: schema,
                      destination_table: ''
                    }));
                    setDestinationTables([]);
                    if (schema) {
                      loadDestinationTablesBySchema(schema, formData.destination_connection_id);
                    }
                  }}
                  label="Destination Schema"
                >
                  {destinationSchemas.map((schema) => (
                    <MenuItem key={schema} value={schema}>
                      {schema}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required disabled={!selectedDestinationSchema}>
                <InputLabel>Destination Table</InputLabel>
                <Select
                  value={currentTableMapping.destination_table}
                  onChange={(e) => {
                    setCurrentTableMapping(prev => ({
                      ...prev,
                      destination_table: e.target.value
                    }));
                  }}
                  label="Destination Table"
                >
                  {destinationTables.map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                First select schemas for source and destination, then select the tables to copy data from and to.
              </Typography>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Column Mappings for {currentTableMapping.source_table}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Source Column</TableCell>
                    <TableCell>Destination Column</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Is PII</TableCell>
                    <TableCell>PII Attribute</TableCell>
                    <TableCell>Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentTableMapping.column_mappings.map((mapping, index) => {
                    const columnInfo = sourceColumns.find(col => col.name === mapping.source_column);
                    return (
                      <TableRow key={index}>
                        <TableCell>{mapping.source_column}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={mapping.destination_column}
                            onChange={(e) => handleColumnMappingChange(index, 'destination_column', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={columnInfo?.data_type || 'Unknown'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={mapping.is_pii}
                            onChange={(e) => handleColumnMappingChange(index, 'is_pii', e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 150 }} disabled={!mapping.is_pii}>
                            <Select
                              value={mapping.pii_attribute}
                              onChange={(e) => handleColumnMappingChange(index, 'pii_attribute', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">Select attribute</MenuItem>
                              {getFilteredPiiAttributes(mapping.source_column).map((attr) => (
                                <MenuItem key={attr} value={attr}>
                                  {attr.replace(/_/g, ' ')}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {mapping.is_pii && mapping.pii_attribute && (
                            <IconButton
                              size="small"
                              onClick={() => handlePreviewSample(mapping.pii_attribute)}
                            >
                              <PreviewIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Workflow Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="subtitle1">Basic Information</Typography>
                <Typography variant="body2">Name: {formData.name}</Typography>
                <Typography variant="body2">Description: {formData.description || 'No description'}</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1">Connections</Typography>
                <Typography variant="body2">
                  Source: {connections.find(c => c.id === formData.source_connection_id)?.name}
                </Typography>
                <Typography variant="body2">
                  Destination: {connections.find(c => c.id === formData.destination_connection_id)?.name}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1">Table Mappings</Typography>
                {formData.table_mappings.map((mapping, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {mapping.source_table} → {mapping.destination_table}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mapping.column_mappings.filter(col => col.is_pii).length} PII columns configured
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const createWorkflowContent = () => {
    if (loading && activeStep === 0) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/workflows')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {isEditMode ? 'Edit Workflow' : 'Create New Workflow'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {isEditMode
                ? 'Modify your PII masking and data copy workflow configuration'
                : 'Set up a new PII masking and data copy workflow'}
            </Typography>
          </Box>
        </Box>

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {renderStepContent()}

            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
              >
                Back
              </Button>

              <Button
                onClick={activeStep === steps.length - 1 ? handleCreateWorkflow : handleNext}
                variant="contained"
                disabled={loading}
              >
                {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                {activeStep === steps.length - 1
                  ? (isEditMode ? 'Update Workflow' : 'Create Workflow')
                  : 'Next'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Sample Data Preview Dialog */}
        <Dialog
          open={previewDialog.open}
          onClose={() => setPreviewDialog({ open: false, attribute: '', samples: [] })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Sample Data Preview: {previewDialog.attribute?.replace('_', ' ')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Here are some sample values that will be generated for this PII attribute:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {previewDialog.samples.map((sample, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" component="code" sx={{
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: 1
                  }}>
                    {sample}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog({ open: false, attribute: '', samples: [] })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen flex flex-col bg-gray-50">
        <Navbar user={user} />
        <div className="flex-1 overflow-auto">
          <Box sx={{ maxWidth: '1440px', width: '100%', mx: 'auto', mt: 3, mb: 3, px: 3 }}>
            {createWorkflowContent()}
          </Box>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default CreateWorkflowPage;