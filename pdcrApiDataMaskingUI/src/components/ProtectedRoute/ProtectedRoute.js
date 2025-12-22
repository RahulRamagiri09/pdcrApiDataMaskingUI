import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import { canPerformAction } from '../../utils/rbac';

const ProtectedRoute = ({ children, requiredPermission, redirectTo = '/datamasking/workflows' }) => {
  // Check authentication first
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check authorization if permission is required
  if (requiredPermission && !canPerformAction(requiredPermission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;