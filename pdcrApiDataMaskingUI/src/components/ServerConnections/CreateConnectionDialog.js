import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { serverConnectionsAPI } from '../../services/api';

const CreateConnectionDialog = ({ open, onClose, onConnectionCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    connection_type: 'azure_sql',
    server: '',
    database: '',
    username: '',
    password: '',
    port: '',
  });

  const steps = ['Connection Details', 'Test Connection', 'Save Connection'];

  const validateConnectionName = (name) => {
    const regex = /^[a-zA-Z0-9 ]*$/;
    if (!regex.test(name)) {
      return 'Connection name can only contain letters, numbers, and spaces';
    }
    return '';
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);

    if (field === 'name') {
      setNameError(validateConnectionName(value));
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate form data
      if (!formData.name || !formData.server || !formData.database || !formData.username || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
      // Validate connection name for special characters
      if (nameError) {
        setError('Please fix the connection name error');
        return;
      }
      // Validate connection name is not same as server name
      if (formData.name.trim().toLowerCase() === formData.server.trim().toLowerCase()) {
        setError('Connection name should not be the same as server name');
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Test connection
      await testConnection();
    } else if (activeStep === 2) {
      // Save connection
      await saveConnection();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
    setTestResult(null);
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const testData = {
        ...formData,
        port: formData.port ? parseInt(formData.port) : null,
      };

      const response = await serverConnectionsAPI.test(testData);

      // Handle the actual API response structure
      const result = response.data;
      setTestResult({
        connection_successful: result.success,
        message: result.message,
        connection_time_ms: result.connection_time_ms
      });

      if (result.success) {
        setActiveStep(2);
      } else {
        setError(`Connection test failed: ${result.message}`);
      }
    } catch (err) {
      setError(err.message);
      setTestResult({ connection_successful: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const connectionData = {
        ...formData,
        port: formData.port ? parseInt(formData.port) : null,
      };

      await serverConnectionsAPI.create(connectionData);
      onConnectionCreated();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      connection_type: 'azure_sql',
      server: '',
      database: '',
      username: '',
      password: '',
      port: '',
    });
    setError(null);
    setTestResult(null);
    setLoading(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Connection Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                error={!!nameError}
                helperText={nameError || "A unique name to identify this server connection (letters, numbers, and spaces only)"}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Connection Type</InputLabel>
                <Select
                  value={formData.connection_type}
                  onChange={handleInputChange('connection_type')}
                  label="Connection Type"
                >
                  <MenuItem value="azure_sql">Azure SQL Database</MenuItem>
                  <MenuItem value="postgresql">PostgreSQL</MenuItem>
                  <MenuItem value="oracle">Oracle</MenuItem>
                  <MenuItem value="sql_server">SQL Server (SSMS)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Server"
                value={formData.server}
                onChange={handleInputChange('server')}
                required
                placeholder="your-server.database.windows.net"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Port (Optional)"
                value={formData.port}
                onChange={handleInputChange('port')}
                type="number"
                placeholder="1433"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Database"
                value={formData.database}
                onChange={handleInputChange('database')}
                required
                helperText="Database where PII masking will be performed in-place"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Testing Connection
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Verifying connection to {formData.server}
            </Typography>

            {loading && (
              <Box my={3}>
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Testing connection...
                </Typography>
              </Box>
            )}

            {testResult && !loading && (
              <Box my={3}>
                {testResult.connection_successful ? (
                  <Chip
                    icon={<CheckIcon />}
                    label="Connection Successful"
                    color="success"
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Chip
                    icon={<ErrorIcon />}
                    label="Connection Failed"
                    color="error"
                    sx={{ mb: 2 }}
                  />
                )}
                <Typography variant="body2">
                  {testResult.message}
                </Typography>
                {testResult.connection_time_ms && (
                  <Typography variant="caption" color="text.secondary">
                    Connection time: {testResult.connection_time_ms}ms
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Save Connection
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Connection test passed. Ready to save connection.
            </Typography>

            <Box mt={3} sx={{ textAlign: 'center', mx: 'auto', maxWidth: 500 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Connection Details
              </Typography>
              <Box sx={{ textAlign: 'left', display: 'inline-block', mt: 2 }}>
                <Typography variant="body2"><strong>Name:</strong> {formData.name}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {formData.connection_type}</Typography>
                <Typography variant="body2"><strong>Server:</strong> {formData.server}</Typography>
                <Typography variant="body2"><strong>Database:</strong> {formData.database}</Typography>
                <Typography variant="body2"><strong>Username:</strong> {formData.username}</Typography>
              </Box>
            </Box>

            {loading && (
              <Box my={3}>
                <CircularProgress color="primary" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Saving connection...
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Single Server Connection</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3, mt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading || (activeStep === 1 && testResult && !testResult.connection_successful)}
        >
          {activeStep === steps.length - 1 ? 'Save' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateConnectionDialog;
