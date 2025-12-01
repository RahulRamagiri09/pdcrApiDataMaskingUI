import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';
import { serverWorkflowsAPI } from '../../services/api';
import PageHeader from '../common/PageHeader';
import ProtectedAction from '../common/ProtectedAction';
import { usePermission } from '../../hooks/usePermission';
// import { getCurrentUser } from '../../utils/auth';
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

const ServerWorkflowsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const user = getCurrentUser();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // RBAC permissions
  const canCreate = usePermission('workflow.create');
  const canDelete = usePermission('workflow.delete');

  // Load workflows on mount and when navigating back to this page
  useEffect(() => {
    loadWorkflows();
  }, [location.pathname]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await serverWorkflowsAPI.getAll();

      // Handle different response structures safely
      const data = response.data?.data || response.data || [];
      setWorkflows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setWorkflows([]); // Ensure workflows is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    // Check permission before deletion
    if (!canDelete) {
      setError('You do not have permission to delete workflows');
      return;
    }

    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await serverWorkflowsAPI.delete(workflowId);
        setWorkflows(workflows.filter(workflow => workflow.id !== workflowId));
      } catch (err) {
        setError(err.message);
      }
    }
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
            icon={<PlayIcon />}
            label="Running"
            color="warning"
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
      case 'pending':
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Pending"
            color="default"
            size="small"
          />
        );
      case 'paused':
        return (
          <Chip
            icon={<PauseIcon />}
            label="Paused"
            color="warning"
            size="small"
          />
        );
      case 'cancelled':
      case 'stopped':
        return (
          <Chip
            icon={<StopIcon />}
            label="Cancelled"
            color="info"
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

  const columns = [
    {
      field: 'name',
      headerName: 'Workflow Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'connection_name',
      headerName: 'Connection',
      width: 150,
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/server/workflows/${params.row.id}`)}
            color="primary"
            title="View Details"
          >
            <ViewIcon />
          </IconButton>
          <ProtectedAction action="workflow.delete" showDisabled>
            <IconButton
              size="small"
              onClick={() => handleDeleteWorkflow(params.row.id)}
              color="error"
              title="Delete"
            >
              <DeleteIcon />
            </IconButton>
          </ProtectedAction>
        </Box>
      ),
    },
  ];

  const workflowsContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" color="text.secondary">
            Create and manage in-place PII masking workflows (same database/schema/table)
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton
              onClick={loadWorkflows}
              color="primary"
              title="Refresh workflows"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
            <ProtectedAction action="workflow.create">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/server/workflows/create')}
              >
                Create Workflow
              </Button>
            </ProtectedAction>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PlayIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                All Workflows ({workflows?.length || 0})
              </Typography>
            </Box>

            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={workflows}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25, page: 0 },
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
                autoHeight={false}
                sx={{
                  '& .MuiDataGrid-virtualScroller': {
                    minHeight: '400px',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', mt: 0, mb: 3, px: 1 }}>
        <PageHeader title="Workflows Summary" />
        {workflowsContent()}
      </Box>
    </ThemeProvider>
  );
};

export default ServerWorkflowsPage;
