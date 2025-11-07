import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Visibility as ViewLogsIcon,
  Stop as StopIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Link as LinkIcon,
  Key as KeyIcon,
  Rule as RuleIcon,
  Bolt as BoltIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { singleServerWorkflowsAPI, singleServerMaskingAPI, singleServerConnectionsAPI, singleServerConstraintsAPI } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import { getCurrentUser } from '../../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme with blue accent
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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WorkflowDetailPage = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { id: workflowId } = useParams();
  console.log('[DEBUG] workflowId from useParams:', workflowId);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'execute' ? 1 : 0;

  const [tabValue, setTabValue] = useState(initialTab);
  const [workflow, setWorkflow] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executeDialog, setExecuteDialog] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState(null);
  // Polling-related state (commented out - manual refresh only)
  // const [taskId, setTaskId] = useState(null);
  // const [pollingInterval, setPollingInterval] = useState(null);
  const [logsDialog, setLogsDialog] = useState({
    open: false,
    logs: [],
    executionId: null
  });

  // Constraint checking state
  const [mappingTabValue, setMappingTabValue] = useState({});
  const [constraintChecks, setConstraintChecks] = useState({});
  const [expandedConstraints, setExpandedConstraints] = useState({});

  useEffect(() => {
    console.log('[DEBUG] useEffect fired with workflowId:', workflowId);
    loadWorkflowData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Automatic polling disabled - manual refresh only via refresh icon button
  // useEffect(() => {
  //   let interval;
  //   if (currentExecution && (currentExecution.status === 'running' || currentExecution.status === 'queued')) {
  //     interval = setInterval(checkExecutionStatus, 3000); // Poll every 3 seconds
  //   }
  //   return () => {
  //     if (interval) clearInterval(interval);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentExecution]);

  const loadWorkflowData = async () => {
    try {
      console.log('[DEBUG] loadWorkflowData called with workflowId:', workflowId);
      setLoading(true);

      console.log('[DEBUG] Making API calls...');
      const [workflowRes, executionsRes] = await Promise.all([
        singleServerWorkflowsAPI.getById(workflowId),
        singleServerWorkflowsAPI.getExecutions(workflowId)
      ]);

      console.log('[DEBUG] API responses:', { workflowRes, executionsRes });

      // Handle different response structures safely
      const workflowData = workflowRes.data?.data || workflowRes.data;
      const executionsData = executionsRes.data?.data || executionsRes.data || [];

      console.log('[DEBUG] Processed data:', { workflowData, executionsData });

      // Normalize workflow data to handle both old and new structures
      // New structure: { table_mappings: [{ table_name, schema_name, column_mappings }] }
      // Old structure: { schema_name, table_name, column_mappings }
      let normalizedWorkflow = { ...workflowData };

      if (workflowData.table_mappings && Array.isArray(workflowData.table_mappings) && workflowData.table_mappings.length > 0) {
        // New structure with table_mappings array - extract data to root level for backward compatibility
        const firstTableMapping = workflowData.table_mappings[0];
        normalizedWorkflow = {
          ...workflowData,
          schema_name: firstTableMapping.schema_name,
          table_name: firstTableMapping.table_name,
          column_mappings: firstTableMapping.column_mappings || []
        };
      } else if (!workflowData.column_mappings) {
        // Neither structure has column_mappings - set empty array
        normalizedWorkflow.column_mappings = [];
      }

      console.log('[DEBUG] Normalized workflow:', normalizedWorkflow);

      setWorkflow(normalizedWorkflow);
      const sortedExecutions = Array.isArray(executionsData)
        ? executionsData.sort((a, b) => b.id - a.id)  // Sort by ID descending (newest first)
        : [];
      setExecutions(sortedExecutions);

      // Fetch connection details separately if connection_id exists but connection object is missing
      if (workflowData && workflowData.connection_id && !workflowData.connection) {
        try {
          const connResponse = await singleServerConnectionsAPI.getById(workflowData.connection_id);
          const connData = connResponse.data?.data || connResponse.data;

          // Update workflow with connection details
          setWorkflow(prev => ({
            ...prev,
            connection: connData
          }));
        } catch (connErr) {
          console.error('Failed to load connection details:', connErr);
          // Connection fetch failed, but workflow still loads - set error for user visibility
          setError('Workflow loaded but connection details could not be fetched: ' + connErr.message);
        }
      }
    } catch (err) {
      console.error('Failed to load workflow data:', err);
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      setExecutionsLoading(true);

      // Call both APIs like POC implementation
      const [workflowRes, executionsRes] = await Promise.all([
        singleServerWorkflowsAPI.getById(workflowId),
        singleServerWorkflowsAPI.getExecutions(workflowId)
      ]);

      // Update workflow data to refresh status
      const workflowData = workflowRes.data?.data || workflowRes.data;
      if (workflowData) {
        setWorkflow(prevWorkflow => ({ ...prevWorkflow, ...workflowData }));
      }

      // Update executions with sorting
      const executionsData = executionsRes.data?.data || executionsRes.data || [];
      const sortedExecutions = Array.isArray(executionsData)
        ? executionsData.sort((a, b) => b.id - a.id)  // Sort by ID descending (newest first)
        : [];
      setExecutions(sortedExecutions);
    } catch (err) {
      console.error('Failed to load executions:', err);
      setError(err.message || 'Failed to load execution history');
    } finally {
      setExecutionsLoading(false);
    }
  };

  // Polling function disabled - manual refresh only via refresh icon button
  // const checkExecutionStatus = async () => {
  //   if (!currentExecution) return;
  //
  //   try {
  //     const response = await maskingAPI.getExecutionStatus(
  //       workflowId,
  //       currentExecution.execution_id || currentExecution.id
  //     );
  //     const updatedExecution = response.data?.data || response.data;
  //
  //     setCurrentExecution(updatedExecution);
  //
  //     // Stop polling when execution completes or fails
  //     if (updatedExecution.status === 'completed' || updatedExecution.status === 'failed') {
  //       setCurrentExecution(null);
  //       setExecuting(false);
  //       loadWorkflowData(); // Reload the full execution list
  //     }
  //   } catch (err) {
  //     console.error('Failed to check execution status:', err);
  //   }
  // };

  const handleExecuteWorkflow = async () => {
    try {
      setExecuting(true);
      setError(null);

      const response = await singleServerMaskingAPI.executeWorkflow(workflowId);
      const result = response.data?.data || response.data;

      // New async endpoint returns execution_id, task_id, status, message
      const execution = {
        execution_id: result.execution_id,
        task_id: result.task_id,
        status: result.status || 'queued',
        message: result.message || 'Workflow execution queued successfully',
        progress: 0,
        records_processed: 0
      };

      setCurrentExecution(execution);
      // setTaskId(result.task_id); // Commented out - polling disabled
      setExecuteDialog(false);
      setTabValue(1);

      // Execution queued - no automatic polling, manual refresh only
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to start workflow execution');
      setExecuting(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      try {
        await singleServerWorkflowsAPI.delete(workflowId);
        navigate('/single-server/workflows');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleViewLogs = (execution) => {
    setLogsDialog({
      open: true,
      logs: execution.execution_logs || [],
      executionId: execution.id
    });
  };

  const handleCloseLogsDialog = () => {
    setLogsDialog({
      open: false,
      logs: [],
      executionId: null
    });
  };

  const handleStopExecution = async (executionId) => {
    try {
      setLoading(true);
      await singleServerMaskingAPI.stopExecution(workflow.id, executionId);
      setError(null);
      await loadWorkflowData(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to stop execution');
    } finally {
      setLoading(false);
    }
  };

  // Constraint checking handlers
  const handleMappingTabChange = (index, newValue) => {
    setMappingTabValue(prev => ({
      ...prev,
      [index]: newValue
    }));
  };

  const handleCheckAllConstraints = async (mapping, mappingIndex) => {
    const [destSchema, destTable] = mapping.destination_table.split('.');

    try {
      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          ...prev[mapping.destination_table],
          loading: true
        }
      }));

      // Call all constraint endpoints in parallel
      const [pkRes, fkRes, uniqueRes, checkRes, triggerRes, indexRes] = await Promise.all([
        singleServerConstraintsAPI.checkPrimaryKeys(workflow.connection_id, destSchema, destTable),
        singleServerConstraintsAPI.checkForeignKeys(workflow.connection_id, destSchema, destTable),
        singleServerConstraintsAPI.checkUniqueConstraints(workflow.connection_id, destSchema, destTable),
        singleServerConstraintsAPI.checkCheckConstraints(workflow.connection_id, destSchema, destTable),
        singleServerConstraintsAPI.checkTriggers(workflow.connection_id, destSchema, destTable),
        singleServerConstraintsAPI.checkIndexes(workflow.connection_id, destSchema, destTable)
      ]);

      // Extract arrays from responses (backend returns array directly in data field)
      const pkArray = Array.isArray(pkRes.data) ? pkRes.data : (pkRes.data?.data || []);
      const fkArray = Array.isArray(fkRes.data) ? fkRes.data : (fkRes.data?.data || []);
      const uniqueArray = Array.isArray(uniqueRes.data) ? uniqueRes.data : (uniqueRes.data?.data || []);
      const checkArray = Array.isArray(checkRes.data) ? checkRes.data : (checkRes.data?.data || []);
      const triggerArray = Array.isArray(triggerRes.data) ? triggerRes.data : (triggerRes.data?.data || []);
      const indexArray = Array.isArray(indexRes.data) ? indexRes.data : (indexRes.data?.data || []);

      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          lastChecked: new Date().toISOString(),
          loading: false,
          primaryKeys: {
            status: 'success',
            count: pkArray.length,
            data: pkArray
          },
          foreignKeys: {
            status: fkArray.length > 0 ? 'warning' : 'success',
            count: fkArray.length,
            hasIssues: false, // Backend will provide this info in the FK data if needed
            data: fkArray
          },
          uniqueConstraints: {
            status: 'success',
            count: uniqueArray.length,
            data: uniqueArray
          },
          checkConstraints: {
            status: 'success',
            count: checkArray.length,
            data: checkArray
          },
          triggers: {
            status: triggerArray.length > 0 ? 'info' : 'success',
            count: triggerArray.length,
            data: triggerArray
          },
          indexes: {
            status: 'success',
            count: indexArray.length,
            data: indexArray
          }
        }
      }));

      // Auto-expand all sections after check completes
      setTimeout(() => {
        const tableName = mapping.destination_table;
        setExpandedConstraints(prev => ({
          ...prev,
          [`${tableName}.pk`]: pkArray.length > 0,
          [`${tableName}.fk`]: fkArray.length > 0,
          [`${tableName}.unique`]: uniqueArray.length > 0,
          [`${tableName}.check`]: checkArray.length > 0,
          [`${tableName}.triggers`]: triggerArray.length > 0,
          [`${tableName}.indexes`]: indexArray.length > 0
        }));
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to check constraints');
      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          ...prev[mapping.destination_table],
          loading: false
        }
      }));
    }
  };

  const handleCheckIndividualConstraint = async (mapping, type) => {
    const [destSchema, destTable] = mapping.destination_table.split('.');
    const typeMap = {
      pk: 'primaryKeys',
      fk: 'foreignKeys',
      unique: 'uniqueConstraints',
      check: 'checkConstraints',
      triggers: 'triggers',
      indexes: 'indexes'
    };

    const apiMap = {
      pk: singleServerConstraintsAPI.checkPrimaryKeys,
      fk: singleServerConstraintsAPI.checkForeignKeys,
      unique: singleServerConstraintsAPI.checkUniqueConstraints,
      check: singleServerConstraintsAPI.checkCheckConstraints,
      triggers: singleServerConstraintsAPI.checkTriggers,
      indexes: singleServerConstraintsAPI.checkIndexes
    };

    try {
      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          ...prev[mapping.destination_table],
          loading: true
        }
      }));

      const response = await apiMap[type](
        workflow.connection_id,
        destSchema,
        destTable
      );

      // Extract array from response.data (backend returns array directly in data field)
      const constraintArray = Array.isArray(response.data) ? response.data :
                             (response.data?.data || []);
      const count = constraintArray.length;
      const stateKey = typeMap[type];

      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          ...prev[mapping.destination_table],
          loading: false,
          [stateKey]: {
            status: type === 'fk' && count > 0 ? 'warning' :
                    type === 'triggers' && count > 0 ? 'info' : 'success',
            count: count,
            hasIssues: type === 'fk' ? false : undefined, // Backend will provide this info if needed
            data: constraintArray
          }
        }
      }));
    } catch (err) {
      setError(err.message || `Failed to check ${type}`);
      setConstraintChecks(prev => ({
        ...prev,
        [mapping.destination_table]: {
          ...prev[mapping.destination_table],
          loading: false
        }
      }));
    }
  };

  const handleToggleConstraint = (tableName, type) => {
    const key = `${tableName}.${type}`;
    setExpandedConstraints(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckIcon />}
            label="Completed"
            color="success"
            size="small"
          />
        );
      case 'running':
        return (
          <Chip
            icon={<CircularProgress size={16} />}
            label="Running"
            color="warning"
            size="small"
          />
        );
      case 'queued':
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Queued"
            color="info"
            size="small"
          />
        );
      case 'failed':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Failed"
            color="error"
            size="small"
          />
        );
      case 'ready':
        return (
          <Chip
            icon={<CheckIcon />}
            label="Ready"
            color="primary"
            size="small"
          />
        );
      default:
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Draft"
            color="default"
            size="small"
          />
        );
    }
  };

  const renderConstraintSection = (type, tableName, checks, isLoading, onCheck) => {
    const typeConfig = {
      pk: {
        label: 'Primary Keys',
        icon: KeyIcon,
        color: 'primary.main',
        stateKey: 'primaryKeys'
      },
      fk: {
        label: 'Foreign Keys',
        icon: LinkIcon,
        color: 'primary.main',
        stateKey: 'foreignKeys'
      },
      unique: {
        label: 'Unique Constraints',
        icon: CheckCircleOutlineIcon,
        color: 'primary.main',
        stateKey: 'uniqueConstraints'
      },
      check: {
        label: 'Check Constraints',
        icon: RuleIcon,
        color: 'primary.main',
        stateKey: 'checkConstraints'
      },
      triggers: {
        label: 'Triggers',
        icon: BoltIcon,
        color: 'info.main',
        stateKey: 'triggers'
      },
      indexes: {
        label: 'Indexes',
        icon: StorageIcon,
        color: 'primary.main',
        stateKey: 'indexes'
      }
    };

    const config = typeConfig[type];
    const Icon = config.icon;
    const constraintData = checks?.[config.stateKey];
    const key = `${tableName}.${type}`;
    const isExpanded = expandedConstraints[key] || false;
    const hasData = constraintData && constraintData.count > 0;

    return (
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          borderColor: hasData ? 'success.main' : 'grey.300',
          borderWidth: hasData ? 2 : 1
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Icon sx={{ color: config.color, fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {config.label}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {constraintData && (
                <Chip
                  label={`${constraintData.count} Found`}
                  color={constraintData.count > 0 ? 'success' : 'default'}
                  size="small"
                />
              )}
              {constraintData ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ExpandMoreIcon sx={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.3s' }} />}
                  onClick={() => handleToggleConstraint(tableName, type)}
                  disabled={constraintData.count === 0}
                >
                  {isExpanded ? 'Hide' : 'Show'} Details
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onCheck(type)}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : null}
                >
                  Check
                </Button>
              )}
            </Box>
          </Box>

          {/* Expanded Content */}
          {isExpanded && constraintData && constraintData.count > 0 && (
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Showing {constraintData.count} {config.label}
              </Typography>

              {type === 'fk' ? (
                // Foreign Keys - Special card rendering
                <Box>
                  {constraintData.data.map((fk, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        mb: 1.5,
                        backgroundColor: 'grey.50',
                        borderColor: fk.has_issue ? 'warning.main' : 'success.light'
                      }}
                    >
                      <CardContent sx={{ py: 1.5 }}>
                        {/* Foreign Key Constraint Header */}
                        <Box mb={1.5}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.5}>
                            Foreign Key Constraint
                          </Typography>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                            {fk.constraint_name}
                          </Typography>
                        </Box>

                        {/* Parent Table (Referenced) */}
                        <Box mb={1.5} pl={2} sx={{ borderLeft: '3px solid', borderColor: 'primary.main' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.5}>
                            Parent Table (Referenced)
                          </Typography>
                          <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 500 }}>
                            {fk.parent_schema ? `${fk.parent_schema}.` : ''}{fk.parent_table}.{fk.parent_column}
                          </Typography>
                        </Box>

                        {/* Child Table (References From) */}
                        <Box pl={2} sx={{ borderLeft: '3px solid', borderColor: 'secondary.main' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.5}>
                            Child Table (References From)
                          </Typography>
                          <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 500 }}>
                            {fk.child_schema ? `${fk.child_schema}.` : ''}{fk.child_table}.{fk.child_column}
                          </Typography>
                        </Box>

                        {/* Optional Metadata Chips */}
                        {(fk.is_self_reference || fk.has_issue || fk.delete_rule || fk.update_rule) && (
                          <Box display="flex" gap={0.5} mt={1.5} flexWrap="wrap">
                            {fk.is_self_reference && (
                              <Chip label="Self-Reference" color="info" size="small" />
                            )}
                            {fk.has_issue && (
                              <Chip label="⚠ Parent Missing" color="warning" size="small" />
                            )}
                            {fk.delete_rule && (
                              <Chip label={`Delete: ${fk.delete_rule}`} size="small" variant="outlined" />
                            )}
                            {fk.update_rule && (
                              <Chip label={`Update: ${fk.update_rule}`} size="small" variant="outlined" />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                // Other constraints - Table rendering
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {(type === 'pk' || type === 'unique') && (
                          <>
                            <TableCell><strong>Constraint Name</strong></TableCell>
                            <TableCell><strong>Column(s)</strong></TableCell>
                          </>
                        )}
                        {type === 'check' && (
                          <>
                            <TableCell><strong>Constraint Name</strong></TableCell>
                            <TableCell><strong>Check Clause</strong></TableCell>
                          </>
                        )}
                        {type === 'triggers' && (
                          <>
                            <TableCell><strong>Trigger Name</strong></TableCell>
                            <TableCell><strong>Table</strong></TableCell>
                            <TableCell><strong>Event</strong></TableCell>
                            <TableCell><strong>Timing</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                          </>
                        )}
                        {type === 'indexes' && (
                          <>
                            <TableCell><strong>Index Name</strong></TableCell>
                            <TableCell><strong>Table</strong></TableCell>
                            <TableCell><strong>Column</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Primary Key</strong></TableCell>
                            <TableCell><strong>Unique</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {constraintData.data.map((item, index) => (
                        <TableRow key={index}>
                          {(type === 'pk' || type === 'unique') && (
                            <>
                              <TableCell>{item.constraint_name}</TableCell>
                              <TableCell>{item.column_name}</TableCell>
                            </>
                          )}
                          {type === 'check' && (
                            <>
                              <TableCell>{item.constraint_name}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {item.check_clause}
                              </TableCell>
                            </>
                          )}
                          {type === 'triggers' && (
                            <>
                              <TableCell>{item.trigger_name}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {item.table_name}
                              </TableCell>
                              <TableCell>{item.trigger_event}</TableCell>
                              <TableCell>{item.trigger_timing}</TableCell>
                              <TableCell>{item.trigger_type}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.status === 'ENABLED' ? 'Enabled' : 'Disabled'}
                                  color={item.status === 'ENABLED' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </>
                          )}
                          {type === 'indexes' && (
                            <>
                              <TableCell>{item.index_name}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {item.table_name}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {item.column_name}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.index_type}
                                  variant="outlined"
                                  color={item.index_type === 'CLUSTERED' ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.is_primary_key ? 'Yes' : 'No'}
                                  color={item.is_primary_key ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.is_unique ? 'Yes' : 'No'}
                                  color={item.is_unique ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.status === 'ENABLED' ? 'Enabled' : 'Disabled'}
                                  color={item.status === 'ENABLED' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderConstraintChecks = (mapping, mappingIndex) => {
    const checks = constraintChecks[mapping.destination_table];
    const isLoading = checks?.loading || false;

    const handleCheck = (type) => {
      handleCheckIndividualConstraint(mapping, type);
      // Auto-expand after check completes
      setTimeout(() => {
        const key = `${mapping.destination_table}.${type}`;
        setExpandedConstraints(prev => ({ ...prev, [key]: true }));
      }, 500);
    };

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Table: {mapping.destination_table}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check database constraints for the table
            </Typography>
            {checks?.lastChecked && (
              <Typography variant="caption" color="text.secondary">
                Last checked: {new Date(checks.lastChecked).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleOutlineIcon />}
            onClick={() => handleCheckAllConstraints(mapping, mappingIndex)}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check All Constraints'}
          </Button>
        </Box>

        {/* Section-based layout with inline expansion */}
        <Box>
          {renderConstraintSection('pk', mapping.destination_table, checks, isLoading, handleCheck)}
          {renderConstraintSection('fk', mapping.destination_table, checks, isLoading, handleCheck)}
          {renderConstraintSection('unique', mapping.destination_table, checks, isLoading, handleCheck)}
          {renderConstraintSection('check', mapping.destination_table, checks, isLoading, handleCheck)}
          {renderConstraintSection('triggers', mapping.destination_table, checks, isLoading, handleCheck)}
          {renderConstraintSection('indexes', mapping.destination_table, checks, isLoading, handleCheck)}
        </Box>
      </Box>
    );
  };

  const renderWorkflowOverview = () => (
    <Box position="relative">
      {/* Loading Overlay */}
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.7)"
          zIndex={1000}
          sx={{ minHeight: '400px' }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Status & Actions Card */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              Status & Actions
            </Typography>
            {getStatusChip(workflow.status)}
          </Box>

          <Box display="flex" flexDirection="row" gap={2}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => setExecuteDialog(true)}
              disabled={workflow.status === 'running' || executing}
            >
              Execute Workflow
            </Button>

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/single-server/workflows/${workflowId}/edit`)}
            >
              Edit Workflow
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteWorkflow}
            >
              Delete Workflow
            </Button>
          </Box>

          {currentExecution && currentExecution.status === 'running' && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Current Execution
              </Typography>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Status: {currentExecution.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Records: {currentExecution.records_processed || 0}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Workflow Details Card */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workflow Details
          </Typography>

          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={10}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{workflow.name}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{workflow.description || 'No description provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                <Typography variant="body2">{new Date(workflow.created_at).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body2">{workflow.updated_at ? new Date(workflow.updated_at).toLocaleString() : 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Single Connection */}
          <Grid container spacing={10} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Connection
              </Typography>
              {workflow.connection ? (
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Name:</strong> {workflow.connection.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Type:</strong> {workflow.connection.connection_type === 'azure_sql' ? 'Azure SQL' : 'Oracle'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Server:</strong> {workflow.connection.server}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Database:</strong> {workflow.connection.database}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No connection</Typography>
              )}
            </Grid>

            {/* Table Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Table Information
              </Typography>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Schema:</strong> {workflow.schema_name || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Table:</strong> {workflow.table_name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Full Name:</strong> {workflow.schema_name && workflow.table_name ? `${workflow.schema_name}.${workflow.table_name}` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Column Mappings Card - Always show with helpful message if data missing */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Column Mappings
          </Typography>

          {!workflow.column_mappings || workflow.column_mappings.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No column mappings found for this workflow.
              {!workflow.column_mappings && (
                <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                  Note: The backend API may not be returning column_mappings data. Please check the API response.
                </Box>
              )}
            </Alert>
          ) : (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {workflow.schema_name}.{workflow.table_name}
                  </Typography>
                  <Chip
                    label={`${workflow.column_mappings.filter(col => col.is_pii).length} PII columns`}
                    size="small"
                    color="primary"
                    sx={{ mr: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      value={mappingTabValue[0] || 0}
                      onChange={(e, newValue) => handleMappingTabChange(0, newValue)}
                    >
                      <Tab label="Column Mappings" />
                      <Tab label="Constraint Checks" />
                    </Tabs>
                  </Box>

                  {/* Tab Panel 1: Column Mappings */}
                  {(mappingTabValue[0] || 0) === 0 && (
                    <Box sx={{ p: 3 }}>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Column Name</TableCell>
                              <TableCell>PII</TableCell>
                              <TableCell>PII Attribute</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {workflow.column_mappings.map((col, colIndex) => (
                              <TableRow key={colIndex}>
                                <TableCell>{col.column_name}</TableCell>
                                <TableCell>
                                  {col.is_pii ? (
                                    <Chip label="Yes" color="warning" size="small" />
                                  ) : (
                                    <Chip label="No" variant="outlined" size="small" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {col.pii_attribute || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Tab Panel 2: Constraint Checks */}
                  {(mappingTabValue[0] || 0) === 1 && (
                    <Box sx={{ p: 3 }}>
                      {renderConstraintChecks({ destination_table: `${workflow.schema_name}.${workflow.table_name}` }, 0)}
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderExecutionHistory = () => (
    <Card>
      <CardContent>
        <Box position="relative">
          {/* Loading Overlay */}
          {executionsLoading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(255, 255, 255, 0.7)"
              zIndex={1000}
              sx={{ minHeight: '200px' }}
            >
              <CircularProgress />
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Execution History ({executions.length})
            </Typography>
            <IconButton onClick={loadExecutions}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {executions.length === 0 ? (
          <Typography color="text.secondary">
            No executions yet. Click "Execute Workflow" to run this workflow.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Execution ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executions.map((execution) => {
                  const duration = execution.completed_at
                    ? Math.round((new Date(execution.completed_at) - new Date(execution.started_at)) / 1000)
                    : null;

                  return (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <Typography variant="body2" component="code" sx={{
                          backgroundColor: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: 1
                        }}>
                          {execution.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(execution.status)}</TableCell>
                      <TableCell>{new Date(execution.started_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{execution.records_processed || 0}</TableCell>
                      <TableCell>{duration ? `${duration}s` : '-'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewLogs(execution)}
                            disabled={!execution.execution_logs || execution.execution_logs.length === 0}
                            title="View Logs"
                            color="primary"
                          >
                            <ViewLogsIcon fontSize="small" />
                          </IconButton>
                          {execution.status === 'running' && (
                            <IconButton
                              size="small"
                              onClick={() => handleStopExecution(execution.id)}
                              title="Stop Execution"
                              color="error"
                            >
                              <StopIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderLogsDialog = () => (
    <Dialog
      open={logsDialog.open}
      onClose={handleCloseLogsDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Execution Logs - ID: {logsDialog.executionId}
      </DialogTitle>
      <DialogContent>
        {logsDialog.logs.length === 0 ? (
          <Typography color="text.secondary">
            No logs available for this execution.
          </Typography>
        ) : (
          <Box
            component="pre"
            sx={{
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '500px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {logsDialog.logs.map((log, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>
                <Typography
                  component="span"
                  sx={{
                    color: log.toLowerCase().includes('error') || log.toLowerCase().includes('failed') ? 'error.main' :
                           log.toLowerCase().includes('success') || log.toLowerCase().includes('completed') ? 'success.main' :
                           'text.primary',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}
                >
                  {index + 1}. {log}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseLogsDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const workflowDetailContent = () => {
    // Show error first if it exists
    if (error && !loading) {
      return (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            onClick={loadWorkflowData}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Box>
      );
    }

    // Show loading spinner
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    // Show generic not found only if no error and no workflow
    if (!workflow) {
      console.log('[DEBUG] Showing "not found" - workflow:', workflow, 'loading:', loading, 'error:', error);
      return (
        <Box>
          <Alert severity="error">
            Workflow not found
          </Alert>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton
            onClick={() => navigate('/single-server/workflows')}
            sx={{
              mr: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" gutterBottom>
              {workflow.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Workflow Details & Execution History
            </Typography>
          </Box>
          {getStatusChip(workflow.status)}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Execution History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderWorkflowOverview()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderExecutionHistory()}
        </TabPanel>

        <Dialog open={executeDialog} onClose={() => setExecuteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Execute Workflow</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to execute this workflow?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will start the in-place PII masking process on the selected table.
              The process may take some time depending on the amount of data.
            </Typography>

            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2">Workflow Summary:</Typography>
              <Typography variant="body2">• Table: {workflow.schema_name}.{workflow.table_name}</Typography>
              <Typography variant="body2">
                • {workflow.column_mappings?.filter(col => col.is_pii).length || 0} PII column(s) to mask
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExecuteDialog(false)}>Cancel</Button>
            <Button
              onClick={handleExecuteWorkflow}
              variant="contained"
              disabled={executing}
            >
              {executing && <CircularProgress size={20} sx={{ mr: 1 }} />}
              Execute
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      <div className="flex-1 overflow-auto">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ maxWidth: 'xl', mx: 'auto', mt: 3, mb: 3, px: 3 }}>
            {workflowDetailContent()}
          </Box>
          {renderLogsDialog()}
        </ThemeProvider>
      </div>
    </div>
  );
};

export default WorkflowDetailPage;