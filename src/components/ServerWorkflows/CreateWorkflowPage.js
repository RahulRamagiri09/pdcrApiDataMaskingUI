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
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { serverConnectionsAPI, serverWorkflowsAPI, serverMaskingAPI } from '../../services/api';
import { getCurrentUser } from '../../utils/auth';
import PageHeader from '../common/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme with blue accent for server
const theme = createTheme({
  palette: {
    primary: {
      main: '#0b2677', // Blue theme
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

  // RBAC permissions
  const canCreate = usePermission('workflow.create');
  const canUpdate = usePermission('workflow.update');

  const [activeStep, setActiveStep] = useState(isEditMode ? 2 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nameError, setNameError] = useState('');
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
    column_mappings: [],
    where_conditions: []  // Array of { column, operator, value, logic }
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

  // Validate workflow name - same rules as connection name
  const validateWorkflowName = (name) => {
    const regex = /^[a-zA-Z0-9 ]*$/;
    if (!regex.test(name)) {
      return 'Workflow name can only contain letters, numbers, and spaces';
    }
    return '';
  };

  // Check permissions and redirect if unauthorized
  // Permission hooks return: null = loading, true = has permission, false = no permission
  useEffect(() => {
    const hasPermission = isEditMode ? canUpdate : canCreate;

    // Only show error if permission is explicitly false (not null/loading)
    if (hasPermission === false) {
      setError(`You do not have permission to ${isEditMode ? 'edit' : 'create'} workflows. This action requires Admin role.`);
      setTimeout(() => {
        navigate('/server/workflows');
      }, 2000);
    }
  }, [canCreate, canUpdate, isEditMode, navigate]);

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
        serverConnectionsAPI.getAll(),
        serverWorkflowsAPI.getPiiAttributes()
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
      const response = await serverWorkflowsAPI.getById(id);
      const workflowData = response.data?.data || response.data;

      // Handle both old and new payload structures
      // New structure: { table_mappings: [{ table_name, schema_name, column_mappings, where_conditions }] }
      // Old structure: { schema_name, table_name, column_mappings }
      let schemaName, tableName, columnMappings, whereConditions;

      if (workflowData.table_mappings && Array.isArray(workflowData.table_mappings) && workflowData.table_mappings.length > 0) {
        // New structure with table_mappings array
        const firstTableMapping = workflowData.table_mappings[0];
        schemaName = firstTableMapping.schema_name;
        tableName = firstTableMapping.table_name;
        columnMappings = firstTableMapping.column_mappings || [];
        // Support both old single where_condition and new where_conditions array
        whereConditions = firstTableMapping.where_conditions ||
          (firstTableMapping.where_condition ? [firstTableMapping.where_condition] : []);
      } else {
        // Old structure with flat fields
        schemaName = workflowData.schema_name;
        tableName = workflowData.table_name;
        columnMappings = workflowData.column_mappings || [];
        whereConditions = workflowData.where_conditions ||
          (workflowData.where_condition ? [workflowData.where_condition] : []);
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
        })),
        where_conditions: Array.isArray(whereConditions) ? whereConditions.map(c => ({
          column: c?.column || '',
          operator: c?.operator || '=',
          value: c?.value || '',
          logic: c?.logic || 'AND'
        })) : []
      });

      setSelectedSchema(schemaName);

      // Load schemas for dropdown
      await loadSchemas(workflowData.connection_id);

      // Load tables for selected schema
      await loadTablesBySchema(schemaName, workflowData.connection_id);

      // Load columns for display - fetch actual data types from database
      try {
        const columnsResponse = await serverConnectionsAPI.getTableColumns(
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
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);

    // Validate workflow name
    if (field === 'name') {
      setNameError(validateWorkflowName(value));
    }
  };

  const handleNext = async () => {
    try {
      if (activeStep === 0) {
        // Validate basic info
        if (!formData.name || !formData.connection_id) {
          setError('Please fill in all required fields');
          return;
        }
        // Validate workflow name for special characters
        if (nameError) {
          setError('Please fix the workflow name error');
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
      const response = await serverConnectionsAPI.getSchemas(connId);

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
      const response = await serverConnectionsAPI.getTablesBySchema(
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
      const response = await serverConnectionsAPI.getTableColumns(
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
      const response = await serverMaskingAPI.generateSampleData(attribute, 5);

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
      // API expects: { name, description, connection_id, table_mappings: [{ table_name, schema_name, column_mappings, where_conditions }] }
      // Filter out incomplete conditions (must have column and value, except for pattern operators like IS_PHONE, IS_EMAIL)
      const patternOperators = ['IS_PHONE', 'IS_EMAIL'];
      const validConditions = formData.where_conditions.filter(c =>
        c.column && (patternOperators.includes(c.operator) || c.value)
      );

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
            })),
            where_conditions: validConditions.length > 0 ? validConditions.map(c => ({
              column: c.column,
              operator: c.operator,
              value: c.value,
              logic: c.logic
            })) : null
          }
        ]
      };

      if (isEditMode) {
        await serverWorkflowsAPI.update(workflowId, transformedPayload);
      } else {
        await serverWorkflowsAPI.create(transformedPayload);
      }
      navigate('/server/workflows');
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
                error={!!nameError}
                helperText={nameError || "A unique name for this workflow (letters, numbers, and spaces only)"}
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
            <TableContainer component={Paper} sx={{
                overflow: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#0b2677', color: '#ffffff', fontWeight: 'bold', py: 1 }}>Column Name</TableCell>
                    <TableCell sx={{ backgroundColor: '#0b2677', color: '#ffffff', fontWeight: 'bold', py: 1 }}>Data Type</TableCell>
                    <TableCell sx={{ backgroundColor: '#0b2677', color: '#ffffff', fontWeight: 'bold', py: 1 }}>Is PII</TableCell>
                    <TableCell sx={{ backgroundColor: '#0b2677', color: '#ffffff', fontWeight: 'bold', py: 1 }}>PII Attribute</TableCell>
                    <TableCell sx={{ backgroundColor: '#0b2677', color: '#ffffff', fontWeight: 'bold', py: 1 }}>Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.column_mappings.map((mapping, index) => {
                    const columnInfo = columns.find(col => col.name === mapping.column_name);
                    return (
                      <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                        <TableCell sx={{ py: 0.5 }}><strong>{mapping.column_name}</strong></TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip
                            label={columnInfo?.data_type || mapping.data_type || 'Unknown'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Checkbox
                            checked={mapping.is_pii}
                            onChange={(e) => handleColumnMappingChange(index, 'is_pii', e.target.checked)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
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
                        <TableCell sx={{ py: 0.5 }}>
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

            {/* WHERE Conditions Section */}
            <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    WHERE Conditions (Optional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filter rows to mask based on conditions. Only rows matching these conditions will be processed.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    where_conditions: [...prev.where_conditions, { column: '', operator: '=', value: '', logic: 'AND' }]
                  }))}
                >
                  Add Condition
                </Button>
              </Box>

              {formData.where_conditions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  No conditions added. Click "Add Condition" to filter rows.
                </Typography>
              ) : (
                formData.where_conditions.map((condition, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fff' }}>
                    <Grid container spacing={2} alignItems="center">
                      {index > 0 && (
                        <Grid size={{ xs: 12, md: 1 }}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={condition.logic}
                              onChange={(e) => {
                                const newConditions = [...formData.where_conditions];
                                newConditions[index].logic = e.target.value;
                                setFormData(prev => ({ ...prev, where_conditions: newConditions }));
                              }}
                            >
                              <MenuItem value="AND">AND</MenuItem>
                              <MenuItem value="OR">OR</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, md: index > 0 ? 3 : 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Column Name</InputLabel>
                          <Select
                            value={condition.column}
                            onChange={(e) => {
                              const newConditions = [...formData.where_conditions];
                              newConditions[index].column = e.target.value;
                              setFormData(prev => ({ ...prev, where_conditions: newConditions }));
                            }}
                            label="Column Name"
                          >
                            <MenuItem value="">Select Column</MenuItem>
                            {columns.map((col) => (
                              <MenuItem key={col.name} value={col.name}>
                                {col.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={condition.operator}
                            onChange={(e) => {
                              const newConditions = [...formData.where_conditions];
                              newConditions[index].operator = e.target.value;
                              // Clear value for pattern operators that don't need input
                              if (['IS_PHONE', 'IS_EMAIL'].includes(e.target.value)) {
                                newConditions[index].value = '';
                              }
                              setFormData(prev => ({ ...prev, where_conditions: newConditions }));
                            }}
                            label="Operator"
                            disabled={!condition.column}
                          >
                            <MenuItem value="=">=</MenuItem>
                            <MenuItem value="!=">!=</MenuItem>
                            <MenuItem value=">">&gt;</MenuItem>
                            <MenuItem value="<">&lt;</MenuItem>
                            <MenuItem value=">=">≥</MenuItem>
                            <MenuItem value="<=">≤</MenuItem>
                            <MenuItem value="LIKE">LIKE</MenuItem>
                            <MenuItem value="IN">IN</MenuItem>
                            <MenuItem value="IS_PHONE" sx={{ borderTop: '1px solid #e0e0e0', mt: 1 }}>IS PHONE</MenuItem>
                            <MenuItem value="IS_EMAIL">IS EMAIL</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: index > 0 ? 4 : 5 }}>
                        {['IS_PHONE', 'IS_EMAIL'].includes(condition.operator) ? (
                          <Typography variant="body2" sx={{ py: 1, px: 2, backgroundColor: '#e8f5e9', borderRadius: 1, color: '#2e7d32' }}>
                            {condition.operator === 'IS_PHONE' ? 'Matches phone number pattern (digits, +, -, spaces)' : 'Matches email pattern (contains @)'}
                          </Typography>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            value={condition.value}
                            onChange={(e) => {
                              const newConditions = [...formData.where_conditions];
                              newConditions[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, where_conditions: newConditions }));
                            }}
                            disabled={!condition.column}
                            placeholder={condition.operator === 'IN' ? "e.g., 'val1','val2'" : "Enter filter value"}
                            helperText={condition.operator === 'LIKE' ? "Use % as wildcard" : condition.operator === 'IN' ? "Comma-separated values" : ""}
                          />
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const newConditions = formData.where_conditions.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, where_conditions: newConditions }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              )}

              {formData.where_conditions.length > 0 && formData.where_conditions.some(c => c.column && (['IS_PHONE', 'IS_EMAIL'].includes(c.operator) || c.value)) && (
                <Typography variant="body2" sx={{ mt: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <strong>Preview:</strong> WHERE {formData.where_conditions
                    .filter(c => c.column && (['IS_PHONE', 'IS_EMAIL'].includes(c.operator) || c.value))
                    .map((c, i) => {
                      const prefix = i > 0 ? ` ${c.logic} ` : '';
                      if (c.operator === 'IS_PHONE') return `${prefix}${c.column} matches phone pattern`;
                      if (c.operator === 'IS_EMAIL') return `${prefix}${c.column} matches email pattern`;
                      return `${prefix}${c.column} ${c.operator} '${c.value}'`;
                    })
                    .join('')}
                </Typography>
              )}
            </Box>
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
              {formData.where_conditions.length > 0 && formData.where_conditions.some(c => c.column && (['IS_PHONE', 'IS_EMAIL'].includes(c.operator) || c.value)) && (
                <Grid size={12}>
                  <Typography variant="subtitle1">WHERE Conditions ({formData.where_conditions.filter(c => c.column && (['IS_PHONE', 'IS_EMAIL'].includes(c.operator) || c.value)).length})</Typography>
                  <Box sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fff3e0' }}>
                    {formData.where_conditions.filter(c => c.column && (['IS_PHONE', 'IS_EMAIL'].includes(c.operator) || c.value)).map((condition, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        {index > 0 && <Chip label={condition.logic} size="small" sx={{ mr: 1, mb: 0.5 }} />}
                        <strong>{condition.column}</strong>{' '}
                        {condition.operator === 'IS_PHONE' ? (
                          <Chip label="IS PHONE" size="small" color="info" />
                        ) : condition.operator === 'IS_EMAIL' ? (
                          <Chip label="IS EMAIL" size="small" color="info" />
                        ) : (
                          <>{condition.operator} '<strong>{condition.value}</strong>'</>
                        )}
                      </Typography>
                    ))}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Only rows matching these conditions will be masked
                    </Typography>
                  </Box>
                </Grid>
              )}
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
        <Box display="flex" alignItems="center" mb={1}>
          <IconButton onClick={() => navigate('/server/workflows')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5">
              {isEditMode ? 'Edit Single Server Workflow' : 'Create New Single Server Workflow'}
            </Typography>
            {/* <Typography variant="subtitle1" color="text.secondary">
              {isEditMode
                ? 'Modify your in-place PII masking workflow configuration'
                : 'Set up a new in-place PII masking workflow (same database/schema/table)'}
            </Typography> */}
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
      <Box sx={{ width: '100%', mt: 0, mb: 3, px: 1 }}>
        <PageHeader title={isEditMode ? 'Edit Workflow' : 'Create Workflow'} marginX={-1} />
        {createWorkflowContent()}
      </Box>
    </ThemeProvider>
  );
};

export default CreateWorkflowPage;
