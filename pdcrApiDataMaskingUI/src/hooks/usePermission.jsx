import { useState, useEffect } from 'react';
import { getUserRole, canPerformAction, getUserPermissions } from '../utils/rbac';

/**
 * Hook to check if the current user has permission for a specific action
 * @param {string} action - Action to check (e.g., 'connection.create', 'workflow.delete')
 * @returns {boolean} True if user has permission, false otherwise
 *
 * @example
 * const canCreate = usePermission('connection.create');
 *
 * return (
 *   <>
 *     {canCreate && <Button onClick={handleCreate}>Create</Button>}
 *   </>
 * );
 */
export const usePermission = (action) => {
  const [hasPermission, setHasPermission] = useState(null); // null = loading, true/false = evaluated

  useEffect(() => {
    setHasPermission(canPerformAction(action));
  }, [action]);

  return hasPermission;
};

/**
 * Hook to get the current user's role
 * @returns {string|null} Role name (admin, general, privilege, support) or null
 *
 * @example
 * const role = useRole();
 *
 * return <div>Current role: {role}</div>;
 */
export const useRole = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  return role;
};

/**
 * Hook to get all permissions for the current user
 * @returns {string[]} Array of permission strings
 *
 * @example
 * const permissions = useUserPermissions();
 *
 * return (
 *   <ul>
 *     {permissions.map(p => <li key={p}>{p}</li>)}
 *   </ul>
 * );
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  return permissions;
};

/**
 * Hook to check multiple permissions at once
 * @param {string[]} actions - Array of actions to check
 * @returns {Object} Object with action names as keys and boolean values
 *
 * @example
 * const permissions = useMultiplePermissions([
 *   'connection.create',
 *   'connection.delete',
 *   'workflow.create'
 * ]);
 *
 * return (
 *   <>
 *     {permissions['connection.create'] && <Button>Create Connection</Button>}
 *     {permissions['workflow.create'] && <Button>Create Workflow</Button>}
 *   </>
 * );
 */
export const useMultiplePermissions = (actions) => {
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const permissionsObj = {};
    actions.forEach(action => {
      permissionsObj[action] = canPerformAction(action);
    });
    setPermissions(permissionsObj);
  }, [actions]);

  return permissions;
};
