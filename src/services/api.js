import axios from 'axios';

// Configure base URL for API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 REQUEST INTERCEPTOR CALLED');
    console.log('   Method:', config.method?.toUpperCase());
    console.log('   URL:', config.url);
    console.log('   BaseURL:', config.baseURL);
    console.log('   Full URL:', config.baseURL + config.url);

    const token = localStorage.getItem('authToken');
    console.log('🔑 Token check:', token ? 'Token exists' : 'No token found');

    if (token && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ API request with token:', config.url);
    } else {
      console.log('❌ API request without token:', config.url);
    }

    console.log('📋 Final config:', JSON.stringify({
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers
    }, null, 2));

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error Details:');
    console.error('   Status:', error.response?.status);
    console.error('   URL:', error.config?.url);
    console.error('   Data:', error.response?.data);
    console.error('   Headers sent:', error.config?.headers);

    if (error.response?.status === 401) {
      console.error('🚨 401 UNAUTHORIZED - COMPLETE DEBUG INFO:');
      console.error('   URL:', error.config?.url);
      console.error('   Method:', error.config?.method?.toUpperCase());
      console.error('   Current token in localStorage:', localStorage.getItem('authToken'));
      console.error('   Authorization header sent:', error.config?.headers?.Authorization);
      console.error('   Request payload:', error.config?.data);
      console.error('   Complete backend response:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Response headers:', error.response?.headers);
      console.error('   Current user from localStorage:', localStorage.getItem('user'));

      // Check if this is a business logic error (not auth failure)
      const errorDetail = error.response?.data?.detail || '';
      const isBusinessLogicError = errorDetail.includes('users already exist') ||
                                   errorDetail.includes('role') ||
                                   errorDetail.includes('permission');

      if (isBusinessLogicError) {
        console.log('🔍 This appears to be a business logic error, not an auth failure');
        console.log('   Not clearing auth data or redirecting');
        // Let the component handle this error - don't redirect
      } else {
        // Real authentication failure
        console.log('⏳ Waiting 5 seconds before clearing auth data...');
        setTimeout(() => {
          console.log('🧹 Clearing auth data and redirecting to login');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');

          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 8000);
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => {
    console.log('🔑 authAPI.login called with credentials:', {
      username: credentials.username,
      passwordLength: credentials.password?.length
    });
    console.log('📡 Making POST request to /api/auth/login');
    console.log('   Using api instance with baseURL:', api.defaults.baseURL);
    return api.post('/api/auth/login', credentials);
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// Role APIs
export const roleAPI = {
  createRole: (roleData) => {
    return api.post('/api/roles', roleData);
  },
  getRoles: () => {
    return api.get('/api/roles');
  },
};

// User APIs
export const userAPI = {
  createUser: (userData) => {
    return api.post('/api/users', userData);
  },
  getUsers: () => {
    return api.get('/api/users');
  },
};

// POC API URLs (using different base URL for POC backend)
const POC_API_BASE_URL = process.env.REACT_APP_POC_API_BASE_URL || 'http://localhost:8000/api';

// Create separate axios instance for POC APIs with auth
const pocApi = axios.create({
  baseURL: POC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to POC API requests
pocApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// POC API error handling
pocApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('POC API Response error:', error);

    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login if needed
      const isBusinessLogicError = error.response?.data?.detail?.includes('users already exist') ||
                                   error.response?.data?.detail?.includes('role') ||
                                   error.response?.data?.detail?.includes('permission');

      if (!isBusinessLogicError) {
        // Real authentication failure
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error('Request failed');
    }
  }
);

// Database Connections API (POC)
export const connectionsAPI = {
  getAll: () => pocApi.get('/connections'),
  create: (connectionData) => pocApi.post('/connections', connectionData),
  getById: (id) => pocApi.get(`/connections/${id}`),
  delete: (id) => pocApi.delete(`/connections/${id}`),
  test: (connectionData) => pocApi.post('/connections/test', connectionData),
  getTables: (connectionId) => pocApi.get(`/connections/${connectionId}/tables`),
  getSourceTables: (connectionId) => pocApi.get(`/connections/${connectionId}/source_tables`),
  getDestinationTables: (connectionId) => pocApi.get(`/connections/${connectionId}/destination_tables`),
  getTableColumns: (connectionId, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${tableName}/columns`),
  getSourceTableColumns: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/schemas/${schemaName}/source_tables/${tableName}/columns`),
  // Schema APIs
  getSourceSchemas: (connectionId) => pocApi.get(`/connections/${connectionId}/source_schemas`),
  getDestinationSchemas: (connectionId) => pocApi.get(`/connections/${connectionId}/destination_schemas`),
  getSourceTablesBySchema: (connectionId, schemaName) =>
    pocApi.get(`/connections/${connectionId}/schemas/${schemaName}/source_tables`),
  getDestinationTablesBySchema: (connectionId, schemaName) =>
    pocApi.get(`/connections/${connectionId}/schemas/${schemaName}/destination_tables`),
};

// Workflows API (POC)
export const workflowsAPI = {
  getAll: () => pocApi.get('/workflows'),
  create: (workflowData) => pocApi.post('/workflows', workflowData),
  getById: (id) => pocApi.get(`/workflows/${id}`),
  update: (id, workflowData) => pocApi.put(`/workflows/${id}`, workflowData),
  delete: (id) => pocApi.delete(`/workflows/${id}`),
  getExecutions: (workflowId) => pocApi.get(`/workflows/${workflowId}/executions`),
  getPiiAttributes: () => pocApi.get('/workflows/pii-attributes'),
};

// Masking API (POC)
export const maskingAPI = {
  // executeWorkflow: (workflowId) => pocApi.post(`/workflows/${workflowId}/execute`),
  executeWorkflow: (workflowId) => pocApi.post(`/workflows/${workflowId}/execute/without/enable/disable`),
  getExecutionStatus: (workflowId, executionId) => pocApi.get(`/workflows/${workflowId}/executions/${executionId}/status`),
  stopExecution: (workflowId, executionId) => pocApi.post(`/workflows/${workflowId}/executions/${executionId}/stop`),
  generateSampleData: (piiAttribute, count = 5) =>
    pocApi.post('/masking/sample-data', { pii_attribute: piiAttribute, count }),
  validateWorkflow: (workflowId) => pocApi.post('/masking/validate-workflow', { workflow_id: workflowId }),
};

// Constraint Checking APIs (POC)
export const constraintsAPI = {
  // Check all constraints for a specific table
  checkAll: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/all`),

  // Individual constraint checks
  checkPrimaryKeys: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/primary-keys`),

  checkForeignKeys: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/foreign-keys`),

  checkUniqueConstraints: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/unique`),

  checkCheckConstraints: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/check`),

  checkTriggers: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/triggers`),

  checkIndexes: (connectionId, schemaName, tableName) =>
    pocApi.get(`/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/indexes`)
};

// Health check (POC)
export const healthAPI = {
  check: () => pocApi.get('/health'),
};

// =====================================================
// Single Server APIs
// For workflows where source and destination are the same
// database/schema/table (in-place PII masking)
// =====================================================

// Single Server Connections API
export const singleServerConnectionsAPI = {
  // Connection CRUD operations
  getAll: () => pocApi.get('/single-server/connections'),
  create: (connectionData) => pocApi.post('/single-server/connections', connectionData),
  getById: (id) => pocApi.get(`/single-server/connections/${id}`),
  delete: (id) => pocApi.delete(`/single-server/connections/${id}`),
  test: (connectionData) => pocApi.post('/single-server/connections/test', connectionData),

  // Schema discovery
  getSchemas: (connectionId) => pocApi.get(`/single-server/connections/${connectionId}/schemas`),

  // Table discovery by schema
  getTablesBySchema: (connectionId, schemaName) =>
    pocApi.get(`/single-server/connections/${connectionId}/schemas/${schemaName}/tables`),

  // Column discovery for a specific table
  getTableColumns: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/schemas/${schemaName}/tables/${tableName}/columns`),
};

// Single Server Workflows API
export const singleServerWorkflowsAPI = {
  // Workflow CRUD operations
  getAll: () => pocApi.get('/single-server/workflows'),
  create: (workflowData) => pocApi.post('/single-server/workflows', workflowData),
  getById: (id) => pocApi.get(`/single-server/workflows/${id}`),
  update: (id, workflowData) => pocApi.put(`/single-server/workflows/${id}`, workflowData),
  delete: (id) => pocApi.delete(`/single-server/workflows/${id}`),

  // Execution history
  getExecutions: (workflowId) => pocApi.get(`/single-server/workflows/${workflowId}/executions`),

  // PII attributes (reuses same endpoint as two-server system)
  getPiiAttributes: () => pocApi.get('/workflows/pii-attributes'),
};

// Single Server Execution/Masking API
export const singleServerMaskingAPI = {
  // Execute workflow (in-place UPDATE)
  executeWorkflow: (workflowId) => pocApi.post(`/single-server/workflows/${workflowId}/execute`),

  // Get execution status
  getExecutionStatus: (workflowId, executionId) =>
    pocApi.get(`/single-server/workflows/${workflowId}/executions/${executionId}/status`),

  // Stop running execution
  stopExecution: (workflowId, executionId) =>
    pocApi.post(`/single-server/workflows/${workflowId}/executions/${executionId}/stop`),

  // Generate sample masked data for preview (reuses same endpoint)
  generateSampleData: (piiAttribute, count = 5) =>
    pocApi.post('/masking/sample-data', { pii_attribute: piiAttribute, count }),

  // Validate workflow configuration
  validateWorkflow: (workflowId) =>
    pocApi.post('/single-server/masking/validate-workflow', { workflow_id: workflowId }),
};

// Single Server Constraints API
export const singleServerConstraintsAPI = {
  // Check all constraints for a specific table
  checkAll: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/all`),

  // Individual constraint checks
  checkPrimaryKeys: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/primary-keys`),

  checkForeignKeys: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/foreign-keys`),

  checkUniqueConstraints: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/unique`),

  checkCheckConstraints: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/check`),

  checkTriggers: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/triggers`),

  checkIndexes: (connectionId, schemaName, tableName) =>
    pocApi.get(`/single-server/connections/${connectionId}/tables/${schemaName}/${tableName}/constraints/indexes`)
};

export default api;