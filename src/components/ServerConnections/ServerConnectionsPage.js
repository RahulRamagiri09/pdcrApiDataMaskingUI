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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { serverConnectionsAPI } from '../../services/api';
import CreateConnectionDialog from './CreateConnectionDialog';
import { getCurrentUser } from '../../utils/auth';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create Material-UI theme with blue/orange accent for server
const theme = createTheme({
  palette: {
    primary: {
      main: '#0b2677', // Blue theme for server
    },
    secondary: {
      main: '#ed6c02', // Orange accent
    },
  },
});

const ServerConnectionsPage = () => {
  const user = getCurrentUser();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await serverConnectionsAPI.getAll();

      // Handle different response structures
      const data = response.data?.data || response.data || [];
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setConnections([]); // Ensure connections is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = (connection) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await serverConnectionsAPI.delete(connectionToDelete.id);
      setConnections(connections.filter(conn => conn.id !== connectionToDelete.id));
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    } catch (err) {
      setError(err.message);
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setConnectionToDelete(null);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return (
          <Chip
            icon={<CheckIcon />}
            label="Active"
            color="success"
            size="small"
          />
        );
      case 'error':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Error"
            color="error"
            size="small"
          />
        );
      default:
        return (
          <Chip
            label="Inactive"
            color="default"
            size="small"
          />
        );
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Connection Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'connection_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => {
        const typeLabels = {
          'postgresql': 'PostgreSQL',
          'azure_sql': 'Azure SQL',
          'oracle': 'Oracle',
          'mysql': 'MySQL',
          'sql_server': 'SQL Server'
        };

        return (
          <Chip
            label={typeLabels[params.value] || params.value}
            variant="outlined"
            size="small"
            color="primary"
          />
        );
      },
    },
    {
      field: 'server',
      headerName: 'Server',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'database',
      headerName: 'Database',
      width: 150,
    },
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleDeleteConnection(params.row)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const connectionsContent = () => {
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
          <Box>
            <Typography variant="h4">
              Connections Summary
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage connections for in-place PII masking workflows (same database/schema/table)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Connection
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Active Connections ({connections?.length || 0})
              </Typography>
            </Box>

            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={connections}
                columns={columns}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
              />
            </Box>
          </CardContent>
        </Card>

        <CreateConnectionDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onConnectionCreated={() => {
            setCreateDialogOpen(false);
            loadConnections();
          }}
        />

        <Dialog
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Connection</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the connection <strong>"{connectionToDelete?.name}"</strong>?
              <br />
              <br />
              This action cannot be undone and will permanently remove this connection from the system.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', mt: 3, mb: 3, px: 1 }}>
        {connectionsContent()}
      </Box>
    </ThemeProvider>
  );
};

export default ServerConnectionsPage;
