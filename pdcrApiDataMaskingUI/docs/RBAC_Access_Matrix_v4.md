# RBAC Access Matrix - PII Masking Tool

**Document Version:** 4.0
**Date:** January 2026
**Purpose:** Define role-based access control for single database in-place masking

---

## Role Definitions

| Role | Description | Typical Users |
|------|-------------|---------------|
| **Admin** | Full system administration | System admins, Database admins |
| **Privilege** | Execute workflows and manage executions | Data engineers, Operations team |
| **General** | Read-only monitoring | Business analysts, Auditors |
| **Support** | Technical support (read-only) | Help desk, Support team |

---

## Module Access Matrix

### 1. Server Connections Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View connection list | Yes | Yes | Yes | Yes |
| Create new connection | Yes | No | No | No |
| Edit connection details | Yes | No | No | No |
| Delete connection | Yes | No | No | No |
| **Test connection** | **Yes** | **Yes** | **Yes** | **Yes** |
| View schemas/tables | Yes | Yes | Yes | Yes |
| View table columns | Yes | Yes | Yes | Yes |

---

### 2. Workflows Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View workflow list | Yes | Yes | Yes | Yes |
| Create new workflow | Yes | No | No | No |
| Edit workflow | Yes | No | No | No |
| Delete workflow | Yes | No | No | No |
| **Execute workflow** | Yes | Yes | No | No |
| View column mappings | Yes | Yes | Yes | Yes |
| Edit column mappings | Yes | No | No | No |
| View PII attributes | Yes | Yes | Yes | Yes |

---

### 3. Execution Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View execution history | Yes | Yes | Yes | Yes |
| Start execution | Yes | Yes | No | No |
| **Stop execution** | Yes | Yes | No | No |
| **Pause execution** | Yes | Yes | No | No |
| **Resume execution** | Yes | Yes | No | No |
| View execution status | Yes | Yes | Yes | Yes |
| View execution logs | Yes | Yes | Yes | Yes |
| View execution progress | Yes | Yes | Yes | Yes |

---

### 4. Preview & Validation Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View masking preview | Yes | Yes | Yes | Yes |
| View constraint checks | Yes | Yes | Yes | Yes |
| View primary keys | Yes | Yes | Yes | Yes |
| View foreign keys | Yes | Yes | Yes | Yes |
| View unique constraints | Yes | Yes | Yes | Yes |
| View check constraints | Yes | Yes | Yes | Yes |
| View triggers | Yes | Yes | Yes | Yes |
| View indexes | Yes | Yes | Yes | Yes |

---

### 5. User Management Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View users | Yes | No | No | No |
| Create users | Yes | No | No | No |
| Assign roles | Yes | No | No | No |
| View roles | Yes | No | No | No |
| Create roles | Yes | No | No | No |

---

### 6. Dashboard Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View dashboard | Yes | Yes | Yes | Yes |
| View statistics | Yes | Yes | Yes | Yes |
| View recent activity | Yes | Yes | Yes | Yes |
| Quick actions | Yes | Yes | No | No |

---

## Summary Table

| Module | Admin Access | Privilege Access | General Access | Support Access |
|--------|--------------|------------------|----------------|----------------|
| **Server Connections** | Full (CRUD + Test) | Read + Test | Read + Test | Read + Test |
| **Workflows** | Full (CRUD + Execute) | Read + Execute | Read Only | Read Only |
| **Executions** | Full (Start + Stop + Pause + Resume) | Start + Stop + Pause + Resume | Read Only | Read Only |
| **Preview & Validation** | Full Read | Full Read | Full Read | Full Read |
| **User Management** | Full (CRUD) | No Access | No Access | No Access |
| **Dashboard** | Full Access | Full Access | View Only | View Only |

---

## Permission Definitions (Code Reference)

The following permissions are defined in `src/utils/rbac.js`:

### Admin Permissions
```
admin.access
connection.view, connection.create, connection.update, connection.delete, connection.test
workflow.view, workflow.create, workflow.update, workflow.delete, workflow.execute
execution.start, execution.view, execution.stop, execution.pause, execution.resume
preview.view, masking.view, columnMapping.view, constraint.view
```

### Privilege Permissions
```
connection.view, connection.test
workflow.view, workflow.execute
execution.start, execution.view, execution.stop, execution.pause, execution.resume
preview.view, columnMapping.view, constraint.view
```

### General Permissions
```
connection.view, connection.test
workflow.view
execution.view
preview.view, columnMapping.view, constraint.view
```

### Support Permissions
```
connection.view, connection.test
workflow.view
execution.view
preview.view, columnMapping.view, constraint.view
```

---

## Key Differences Between Roles

### Admin vs Privilege
- **Admin**: Can CREATE, UPDATE, and DELETE workflows and connections
- **Privilege**: Can only VIEW and EXECUTE pre-configured workflows

### Privilege vs General
- **Privilege**: Can EXECUTE workflows and control executions (start/stop/pause/resume)
- **General**: Can only VIEW workflows and executions (cannot execute or control)

### General vs Support
- **Identical permissions** (both are read-only roles)
- Different organizational purpose (auditing vs troubleshooting)

---

## Route Protection

The following routes are protected by RBAC:

| Route | Required Permission | Redirect on Deny |
|-------|---------------------|------------------|
| `/registeruser` | `admin.access` | `/datamasking/dashboard` |
| `/registerrole` | `admin.access` | `/datamasking/dashboard` |
| `/datamasking/workflows/create` | `workflow.create` | `/datamasking/workflows` |
| `/datamasking/workflows/:id/edit` | `workflow.update` | `/datamasking/workflows` |

---

## Implementation Reference

### Frontend Files:
- **RBAC Logic**: `src/utils/rbac.js`
- **Protected UI Component**: `src/components/common/ProtectedAction.jsx`
- **Permission Hooks**: `src/hooks/usePermission.js`
- **Route Protection**: `src/components/ProtectedRoute/ProtectedRoute.jsx`
- **Auth Utilities**: `src/utils/auth.js`
- **Encryption Utilities**: `src/utils/encryption.js`

### Key Functions:
- `getUserRole()` - Get current user's role from localStorage
- `canPerformAction(action)` - Check if user has specific permission
- `isAdmin()` - Check if user is admin
- `getUserPermissions()` - Get all permissions for current role
- `usePermission(action)` - React hook for permission checks

---

## Changes from Version 3.0

| Change | v3.0 | v4.0 |
|--------|------|------|
| File extensions | `.js` | `.jsx` for JSX files |
| Document references | References v3 docs | Updated to v4 |
| Protected UI Component | `ProtectedAction.js` | `ProtectedAction.jsx` |
| Route Protection | `ProtectedRoute.js` | `ProtectedRoute.jsx` |

---

**Document End**
