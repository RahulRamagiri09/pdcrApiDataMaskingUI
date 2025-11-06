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
import Grid from '@mui/material/Grid'
import {
  ArrowBack as ArrowBackIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { singleServerConnectionsAPI, singleServerWorkflowsAPI, singleServerMaskingAPI } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import { getCurrentUser } from '../../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme with green accent for single-server
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green theme
    },
    secondary: {
      main: '#ed6c02', // Orange accent
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
    connection_id: '',
    schema_name: '',
    table_name: '',
    column_mappings: []
  });

  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);

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
    const columnInfo = columns.find(col => col.name === columnName);
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
        singleServerConnectionsAPI.getAll(),
        singleServerWorkflowsAPI.getPiiAttributes()
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
      const response = await singleServerWorkflowsAPI.getById(id);
      const workflowData = response.data?.data || response.data;

      // Handle both old and new payload structures
      // New structure: { table_mappings: [{ table_name, schema_name, column_mappings }] }
      // Old structure: { schema_name, table_name, column_mappings }
      let schemaName, tableName, columnMappings;

      if (workflowData.table_mappings && Array.isArray(workflowData.table_mappings) && workflowData.table_mappings.length > 0) {
        // New structure with table_mappings array
        const firstTableMapping = workflowData.table_mappings[0];
        schemaName = firstTableMapping.schema_name;
        tableName = firstTableMapping.table_name;
        columnMappings = firstTableMapping.column_mappings || [];
      } else {
        // Old structure with flat fields
        schemaName = workflowData.schema_name;
        tableName = workflowData.table_name;
        columnMappings = workflowData.column_mappings || [];
      }

      // Populate formData with existing workflow
      setFormData({
        name: workflowData.name,
        description: workflowData.description,
        connection_id: workflowData.connection_id,
        schema_name: schemaName,
        table_name: tableName,
        column_mappings: columnMappings.map(col => ({
          ...col,
          pii_attribute: col.pii_attribute || '' // Convert null/undefined to empty string for placeholder
        }))
      });

      setSelectedSchema(schemaName);

      // Load schemas for dropdown
      await loadSchemas(workflowData.connection_id);

      // Load tables for selected schema
      await loadTablesBySchema(schemaName, workflowData.connection_id);

      // Load columns for display - fetch actual data types from database
      try {
        const columnsResponse = await singleServerConnectionsAPI.getTableColumns(
          workflowData.connection_id,
          schemaName,
          tableName
        );
        const columnsData = columnsResponse.data?.data || columnsResponse.data || [];
        setColumns(Array.isArray(columnsData) ? columnsData : []);
      } catch (err) {
        console.error('Failed to load column types:', err);
        // Fallback to stored data with varchar default
        setColumns(columnMappings.map(col => ({
          name: col.column_name,
          data_type: 'varchar'
        })));
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
        if (!formData.name || !formData.connection_id) {
          setError('Please fill in all required fields');
          return;
        }
        // Load schemas for the selected connection
        await loadSchemas(formData.connection_id);
      } else if (activeStep === 1) {
        // Validate schema and table selection
        if (!selectedSchema) {
          setError('Please select a schema');
          return;
        }
        if (!formData.table_name) {
          setError('Please select a table');
          return;
        }
        // Update formData with schema
        setFormData(prev => ({
          ...prev,
          schema_name: selectedSchema
        }));
        await loadColumns();
      } else if (activeStep === 2) {
        // Validate column mappings
        if (formData.column_mappings.length === 0) {
          setError('Please configure at least one column mapping');
          return;
        }
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

  const loadSchemas = async (connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.connection_id;
      const response = await singleServerConnectionsAPI.getSchemas(connId);

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setSchemas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTablesBySchema = async (schemaName, connectionId) => {
    try {
      setLoading(true);
      const connId = connectionId || formData.connection_id;
      const response = await singleServerConnectionsAPI.getTablesBySchema(
        connId,
        schemaName
      );

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadColumns = async () => {
    try {
      setLoading(true);
      const response = await singleServerConnectionsAPI.getTableColumns(
        formData.connection_id,
        selectedSchema,
        formData.table_name
      );

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setColumns(Array.isArray(data) ? data : []);

      // Initialize column mappings
      const columnMappings = data.map(col => ({
        column_name: col.name,
        data_type: col.data_type,
        is_pii: false,
        pii_attribute: ''
      }));

      setFormData(prev => ({
        ...prev,
        column_mappings: columnMappings
      }));
    } catch (err) {
      setError(err.message);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingChange = (index, field, value) => {
    setFormData(prev => ({
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
      const response = await singleServerMaskingAPI.generateSampleData(attribute, 5);

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

      // Transform payload to match API expectations
      // API expects: { name, description, connection_id, table_mappings: [{ table_name, schema_name, column_mappings }] }
      const transformedPayload = {
        name: formData.name,
        description: formData.description,
        connection_id: formData.connection_id,
        table_mappings: [
          {
            table_name: formData.table_name,
            schema_name: formData.schema_name,
            column_mappings: formData.column_mappings.map(col => ({
              column_name: col.column_name,
              is_pii: col.is_pii,
              pii_attribute: col.is_pii && col.pii_attribute ? col.pii_attribute : null
            }))
          }
        ]
      };

      if (isEditMode) {
        await singleServerWorkflowsAPI.update(workflowId, transformedPayload);
      } else {
        await singleServerWorkflowsAPI.create(transformedPayload);
      }
      navigate('/single-server/workflows');
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
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Connection</InputLabel>
                <Select
                  value={formData.connection_id}
                  onChange={handleInputChange('connection_id')}
                  label="Connection"
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
            {/* Schema and Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Schema</InputLabel>
                <Select
                  value={selectedSchema}
                  onChange={(e) => {
                    const schema = e.target.value;
                    setSelectedSchema(schema);
                    setFormData(prev => ({
                      ...prev,
                      schema_name: schema,
                      table_name: ''
                    }));
                    setTables([]);
                    if (schema) {
                      loadTablesBySchema(schema, formData.connection_id);
                    }
                  }}
                  label="Schema"
                >
                  {schemas.map((schema) => {
                    const schemaName = typeof schema === 'object' ? schema.name : schema;
                    return (
                      <MenuItem key={schemaName} value={schemaName}>
                        {schemaName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required disabled={!selectedSchema}>
                <InputLabel>Table</InputLabel>
                <Select
                  value={formData.table_name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      table_name: e.target.value
                    }));
                  }}
                  label="Table"
                >
                  {tables.map((table) => {
                    const tableName = typeof table === 'object' ? table.name : table;
                    return (
                      <MenuItem key={tableName} value={tableName}>
                        {tableName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                Select the schema and table where PII masking will be performed in-place (same database/schema/table).
              </Typography>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Column Mappings for {formData.table_name}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Column Name</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Is PII</TableCell>
                    <TableCell>PII Attribute</TableCell>
                    <TableCell>Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.column_mappings.map((mapping, index) => {
                    const columnInfo = columns.find(col => col.name === mapping.column_name);
                    return (
                      <TableRow key={index}>
                        <TableCell><strong>{mapping.column_name}</strong></TableCell>
                        <TableCell>
                          <Chip
                            label={columnInfo?.data_type || mapping.data_type || 'Unknown'}
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
                              {getFilteredPiiAttributes(mapping.column_name).map((attr) => (
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
        const selectedConnection = connections.find(c => c.id === formData.connection_id);
        const piiColumns = formData.column_mappings.filter(col => col.is_pii);

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
                <Typography variant="subtitle1">Connection</Typography>
                <Typography variant="body2">
                  {selectedConnection?.name} ({selectedConnection?.server}/{selectedConnection?.database})
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1">Table</Typography>
                <Typography variant="body2">
                  {formData.schema_name}.{formData.table_name}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle1">PII Columns ({piiColumns.length})</Typography>
                <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {piiColumns.map((col, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{col.column_name}</strong> ({col.data_type}) → <Chip label={col.pii_attribute} size="small" color="primary" />
                      </Typography>
                    </Box>
                  ))}
                </Box>
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
          <IconButton onClick={() => navigate('/single-server/workflows')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {isEditMode ? 'Edit Single Server Workflow' : 'Create New Single Server Workflow'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {isEditMode
                ? 'Modify your in-place PII masking workflow configuration'
                : 'Set up a new in-place PII masking workflow (same database/schema/table)'}
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
