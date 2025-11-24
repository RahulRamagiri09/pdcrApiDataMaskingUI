import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Storage as StorageIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AccountTree as WorkflowIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { serverConnectionsAPI, serverWorkflowsAPI } from '../../services/api';
import { getCurrentUser } from '../../utils/auth';
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

const ServerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState({
    connections: 0,
    workflows: 0,
    recentWorkflows: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickActionsAnchor, setQuickActionsAnchor] = useState(null);

  const handleQuickActionsClick = (event) => {
    setQuickActionsAnchor(event.currentTarget);
  };

  const handleQuickActionsClose = () => {
    setQuickActionsAnchor(null);
  };

  const handleQuickAction = (path) => {
    handleQuickActionsClose();
    navigate(path);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [connectionsResponse, workflowsResponse] = await Promise.all([
        serverConnectionsAPI.getAll(),
        serverWorkflowsAPI.getAll(),
      ]);

      // Handle different response structures safely
      const connectionsData = connectionsResponse.data?.data || connectionsResponse.data || [];
      const workflowsData = workflowsResponse.data?.data || workflowsResponse.data || [];

      setStats({
        connections: Array.isArray(connectionsData) ? connectionsData.length : 0,
        workflows: Array.isArray(workflowsData) ? workflowsData.length : 0,
        recentWorkflows: Array.isArray(workflowsData) ? workflowsData.slice(0, 5) : [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'error';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckIcon />;
      case 'running':
        return <CircularProgress size={16} />;
      case 'failed':
        return <ErrorIcon />;
      default:
        return <PlayIcon />;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', mt: 3, mb: 3, px: 1 }}>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4">
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.25rem' }}>
              Welcome back, <Box component="span" sx={{ color: '#0b2677', fontSize: '1.4rem', fontWeight: 600, textTransform: 'capitalize' }}>{user?.username || 'User'}</Box>
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleQuickActionsClick}
              sx={{
                backgroundColor: '#0b2677',
                '&:hover': {
                  backgroundColor: '#082050',
                },
              }}
            >
              Quick Actions
            </Button>
            <Menu
              anchorEl={quickActionsAnchor}
              open={Boolean(quickActionsAnchor)}
              onClose={handleQuickActionsClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleQuickAction('/server/workflows/create')}>
                <ListItemIcon>
                  <WorkflowIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Create New Workflow</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleQuickAction('/server/connections')}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Add Connection</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleQuickAction('/server/workflows')}>
                <ListItemIcon>
                  <VisibilityIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Workflows</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Card */}
        <Card sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Box display="flex" alignItems="center" justifyContent="space-around">
              <Box display="flex" flexDirection="column" alignItems="center" sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {stats.connections}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Connections
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

              <Box display="flex" flexDirection="column" alignItems="center" sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {stats.workflows}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Workflows
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {/* <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/single-server/workflows/create')}
              >
                Create New Workflow
              </Button>
              <Button
                variant="outlined"
                startIcon={<StorageIcon />}
                onClick={() => navigate('/single-server/connections')}
              >
                Add Connection
              </Button>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => navigate('/single-server/workflows')}
              >
                View All Workflows
              </Button>
            </Box>
          </CardContent>
        </Card> */}

        {/* Recent Workflows */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Workflows
            </Typography>
            {stats.recentWorkflows.length === 0 ? (
              <Alert severity="info">
                No workflows yet. Create your first workflow to get started with in-place PII masking.
              </Alert>
            ) : (
              <Box>
                {stats.recentWorkflows.map((workflow) => (
                  <Box
                    key={workflow.id}
                    sx={{
                      p: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => navigate(`/server/workflows/${workflow.id}`)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1">{workflow.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {workflow.description || 'No description'}
                        </Typography>
                      </Box>
                      <Chip
                        label={workflow.status || 'draft'}
                        color={getStatusColor(workflow.status || 'draft')}
                        size="small"
                        icon={getStatusIcon(workflow.status || 'draft')}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default ServerDashboard;
