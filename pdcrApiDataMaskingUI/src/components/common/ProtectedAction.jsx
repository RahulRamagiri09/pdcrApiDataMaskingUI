import React from 'react';
import { Tooltip } from '@mui/material';
import { canPerformAction, getRoleDisplayName, getUserRole } from '../../utils/rbac';

/**
 * ProtectedAction Component
 * Wraps UI elements (buttons, links, etc.) to show/hide based on user permissions
 *
 * @param {Object} props
 * @param {string} props.action - Required permission action (e.g., 'connection.create')
 * @param {React.ReactNode} props.children - Component to render if user has permission
 * @param {React.ReactNode} props.fallback - Component to render if user doesn't have permission (default: null)
 * @param {boolean} props.showDisabled - If true, shows disabled version with tooltip explaining why (default: false)
 * @param {string} props.disabledMessage - Custom message for disabled tooltip
 *
 * @example
 * // Hide button completely if no permission
 * <ProtectedAction action="connection.create">
 *   <Button onClick={handleCreate}>Create Connection</Button>
 * </ProtectedAction>
 *
 * @example
 * // Show disabled button with tooltip if no permission
 * <ProtectedAction action="connection.delete" showDisabled>
 *   <IconButton onClick={handleDelete}>
 *     <DeleteIcon />
 *   </IconButton>
 * </ProtectedAction>
 */
const ProtectedAction = ({
  action,
  children,
  fallback = null,
  showDisabled = false,
  disabledMessage = null,
}) => {
  const hasPermission = canPerformAction(action);

  // If user has permission, render children normally
  if (hasPermission) {
    return <>{children}</>;
  }

  // If user doesn't have permission and showDisabled is true
  if (showDisabled) {
    const userRole = getUserRole();
    const roleDisplay = getRoleDisplayName(userRole);
    const defaultMessage = `This action requires additional permissions. Your role: ${roleDisplay}`;
    const tooltipMessage = disabledMessage || defaultMessage;

    // Clone the child element and add disabled prop
    const disabledChild = React.cloneElement(children, {
      disabled: true,
      style: { ...children.props.style, cursor: 'not-allowed', opacity: 0.5 },
    });

    return (
      <Tooltip title={tooltipMessage} arrow placement="top">
        <span>{disabledChild}</span>
      </Tooltip>
    );
  }

  // If user doesn't have permission and showDisabled is false, show fallback
  return fallback;
};

export default ProtectedAction;
