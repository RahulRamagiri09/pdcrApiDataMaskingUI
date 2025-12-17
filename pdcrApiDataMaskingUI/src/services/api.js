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

// =====================================================
// API instance for Server APIs (Production)
// =====================================================
const POC_API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api';

// Create axios instance for server APIs with auth
const piiApi = axios.create({
  baseURL: POC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
piiApi.interceptors.request.use(
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

// API error handling
piiApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response error:', error);

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

// =====================================================
// Server APIs
// For workflows where source and destination are the same
// database/schema/table (in-place PII masking)
// =====================================================

// Server Connections API
export const serverConnectionsAPI = {
  // Connection CRUD operations
  getAll: () => piiApi.get('/datamasking/connections'),
  create: (connectionData) => piiApi.post('/datamasking/connections', connectionData),
  getById: (id) => piiApi.post('/datamasking/connections/getById', { id }),
  delete: (id) => piiApi.delete('/datamasking/connections/delete', { data: { id } }),
  test: (connectionData) => piiApi.post('/datamasking/connections/test', connectionData),

  // Schema discovery
  getSchemas: (connectionId) => piiApi.post('/datamasking/connections/schemas', { connection_id: connectionId }),

  // Table discovery by schema
  getTablesBySchema: (connectionId, schemaName) =>
    piiApi.post('/datamasking/connections/tables', { connection_id: connectionId, schema_name: schemaName }),

  // Column discovery for a specific table
  getTableColumns: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/connections/columns', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),
};

// Server Workflows API
export const serverWorkflowsAPI = {
  // Workflow CRUD operations
  getAll: () => piiApi.get('/datamasking/workflows'),
  create: (workflowData) => piiApi.post('/datamasking/workflows', workflowData),
  getById: (id) => piiApi.post('/datamasking/workflows/getById', { id }),
  update: (id, workflowData) => piiApi.put('/datamasking/workflows/update', { id, ...workflowData }),
  delete: (id) => piiApi.delete('/datamasking/workflows/delete', { data: { id } }),

  // Execution history
  getExecutions: (workflowId) => piiApi.post('/datamasking/workflows/executions', { workflow_id: workflowId }),

  // PII attributes (reuses same endpoint as two-server system)
  getPiiAttributes: () => piiApi.get('/datamasking/workflows/pii-attributes'),
};

// Server Execution/Masking API
export const serverMaskingAPI = {
  // Execute workflow (in-place UPDATE)
  executeWorkflow: (workflowId) => piiApi.post('/datamasking/workflows/execute', { workflow_id: workflowId }),

  // Get execution status
  getExecutionStatus: (workflowId, executionId) =>
    piiApi.post('/datamasking/workflows/executions/status', { workflow_id: workflowId, execution_id: executionId }),

  // Stop running execution
  stopExecution: (workflowId, executionId) =>
    piiApi.post('/datamasking/workflows/executions/stop', { workflow_id: workflowId, execution_id: executionId }),

  // Pause running execution
  pauseExecution: (workflowId, executionId) =>
    piiApi.post('/datamasking/workflows/executions/pause', { workflow_id: workflowId, execution_id: executionId }),

  // Resume paused execution
  resumeExecution: (workflowId, executionId) =>
    piiApi.post('/datamasking/workflows/executions/resume', { workflow_id: workflowId, execution_id: executionId }),

  // Generate sample masked data for preview (reuses same endpoint)
  generateSampleData: (piiAttribute, count = 5) =>
    piiApi.post('/masking/sample-data', { pii_attribute: piiAttribute, count }),

  // Validate workflow configuration
  validateWorkflow: (workflowId) =>
    piiApi.post('/datamasking/masking/validate-workflow', { workflow_id: workflowId }),

  // Preview masking - get sample records with original and masked data
  getPreviewMasking: (workflowId, limit = 10) =>
    piiApi.post('/datamasking/workflows/preview', { workflow_id: workflowId, limit }),
};

// Server Constraints API
export const serverConstraintsAPI = {
  // Check all constraints for a specific table
  checkAll: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/all', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  // Individual constraint checks
  checkPrimaryKeys: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/primaryKeys', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  checkForeignKeys: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/foreignKeys', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  checkUniqueConstraints: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/unique', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  checkCheckConstraints: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/check', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  checkTriggers: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/triggers', { connection_id: connectionId, schema_name: schemaName, table_name: tableName }),

  checkIndexes: (connectionId, schemaName, tableName) =>
    piiApi.post('/datamasking/constraints/indexes', { connection_id: connectionId, schema_name: schemaName, table_name: tableName })
};

export default api;