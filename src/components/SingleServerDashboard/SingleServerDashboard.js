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
} from '@mui/material';
import {
  Storage as StorageIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { singleServerConnectionsAPI, singleServerWorkflowsAPI } from '../../services/api';
import Navbar from '../Navbar/Navbar';
import { getCurrentUser } from '../../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme with blue accent for single-server
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

const SingleServerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState({
    connections: 0,
    workflows: 0,
    recentWorkflows: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [connectionsResponse, workflowsResponse] = await Promise.all([
        singleServerConnectionsAPI.getAll(),
        singleServerWorkflowsAPI.getAll(),
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
        <div className="h-screen flex flex-col bg-gray-50">
          <Navbar user={user} />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="h-screen flex flex-col bg-gray-50">
        <Navbar user={user} />
        <div className="flex-1 overflow-auto">
          <Box sx={{ maxWidth: '1440px', width: '100%', mx: 'auto', mt: 3, mb: 3, px: 3 }}>
            <Box mb={4}>
              <Typography variant="h4" gutterBottom>
                Single Server PII Masking Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Welcome back, {user?.name || 'User'}! In-place PII masking for single database operations.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Connections
                        </Typography>
                        <Typography variant="h4">
                          {stats.connections}
                        </Typography>
                      </Box>
                      <StorageIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6 }} />
                    </Box>
                    <Box mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/single-server/connections')}
                      >
                        Manage Connections
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Workflows
                        </Typography>
                        <Typography variant="h4">
                          {stats.workflows}
                        </Typography>
                      </Box>
                      <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6 }} />
                    </Box>
                    <Box mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/single-server/workflows')}
                      >
                        Manage Workflows
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          Masking Type
                        </Typography>
                        <Typography variant="h6">
                          In-Place
                        </Typography>
                      </Box>
                      <PlayIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6 }} />
                    </Box>
                    <Box mt={2}>
                      <Chip label="Single Database" color="primary" size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Card sx={{ mb: 4 }}>
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
                    startIcon={<PersonAddIcon />}
                    onClick={() => navigate('/register-user')}
                  >
                    Register New User
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    onClick={() => navigate('/register-role')}
                  >
                    Create New Role
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
            </Card>

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
                          p: 2,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => navigate(`/single-server/workflows/${workflow.id}`)}
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
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SingleServerDashboard;
