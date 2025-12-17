import { getCurrentUser } from './auth';

// Permission definitions based on role
const PERMISSIONS = {
  admin: [
    // Connection permissions
    'connection.view',
    'connection.create',
    'connection.update',
    'connection.delete',
    'connection.test',
    // Workflow permissions
    'workflow.view',
    'workflow.create',
    'workflow.update',
    'workflow.delete',
    'workflow.execute',
    // Execution permissions
    'execution.start',
    'execution.view',
    'execution.stop',
    'execution.pause',
    'execution.resume',
    // Preview/Masking permissions
    'preview.view',
    'masking.view',
    'columnMapping.view',
    'constraint.view',
  ],
  general: [
    // Connection permissions (read-only + test)
    'connection.view',
    'connection.test',
    // Workflow permissions (read-only)
    'workflow.view',
    // Execution permissions (view only)
    'execution.view',
    // Preview/Masking permissions (no masking.view - admin only)
    'preview.view',
    'columnMapping.view',
    'constraint.view',
  ],
  privilege: [
    // Connection permissions (read-only + test)
    'connection.view',
    'connection.test',
    // Workflow permissions (view + execute)
    'workflow.view',
    'workflow.execute',
    // Execution permissions (full access)
    'execution.start',
    'execution.view',
    'execution.stop',
    'execution.pause',
    'execution.resume',
    // Preview/Masking permissions (no masking.view - admin only)
    'preview.view',
    'columnMapping.view',
    'constraint.view',
  ],
  support: [
    // Connection permissions (read-only + test)
    'connection.view',
    'connection.test',
    // Workflow permissions (read-only)
    'workflow.view',
    // Execution permissions (view only)
    'execution.view',
    // Preview/Masking permissions (no masking.view - admin only)
    'preview.view',
    'columnMapping.view',
    'constraint.view',
  ],
};

/**
 * Get the current user's role from localStorage
 * @returns {string|null} Role name (admin, general, privilege, support) or null
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  if (!user || !user.role) {
    return null;
  }
  // Normalize role to lowercase
  return user.role.toLowerCase();
};

/**
 * Check if the current user has a specific role
 * @param {string} requiredRole - Role to check (e.g., 'admin', 'general')
 * @returns {boolean}
 */
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  if (!userRole || !requiredRole) {
    return false;
  }
  return userRole === requiredRole.toLowerCase();
};

/**
 * Check if the current user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  return hasRole('admin');
};

/**
 * Check if the current user has permission to perform an action
 * @param {string} action - Action to check (e.g., 'connection.create', 'workflow.delete')
 * @returns {boolean}
 */
export const canPerformAction = (action) => {
  const role = getUserRole();

  if (!role || !action) {
    return false;
  }

  const rolePermissions = PERMISSIONS[role];

  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.includes(action);
};

/**
 * Check if the current user can create connections
 * @returns {boolean}
 */
export const canCreateConnection = () => {
  return canPerformAction('connection.create');
};

/**
 * Check if the current user can delete connections
 * @returns {boolean}
 */
export const canDeleteConnection = () => {
  return canPerformAction('connection.delete');
};

/**
 * Check if the current user can create workflows
 * @returns {boolean}
 */
export const canCreateWorkflow = () => {
  return canPerformAction('workflow.create');
};

/**
 * Check if the current user can update workflows
 * @returns {boolean}
 */
export const canUpdateWorkflow = () => {
  return canPerformAction('workflow.update');
};

/**
 * Check if the current user can delete workflows
 * @returns {boolean}
 */
export const canDeleteWorkflow = () => {
  return canPerformAction('workflow.delete');
};

/**
 * Check if the current user can execute workflows
 * @returns {boolean}
 */
export const canExecuteWorkflow = () => {
  return canPerformAction('workflow.execute');
};

/**
 * Get all permissions for the current user's role
 * @returns {string[]} Array of permission strings
 */
export const getUserPermissions = () => {
  const role = getUserRole();
  return PERMISSIONS[role] || [];
};

/**
 * Get a user-friendly display name for the role
 * @param {string} role - Role name
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    admin: 'Administrator',
    general: 'General User',
    privilege: 'Privileged User',
    support: 'Support User',
  };

  return displayNames[role?.toLowerCase()] || 'Unknown';
};
