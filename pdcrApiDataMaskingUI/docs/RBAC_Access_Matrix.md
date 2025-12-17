# RBAC Access Matrix - PII Masking Tool

**Document Version:** 1.0
**Date:** November 2025
**Purpose:** Define role-based access control for single database in-place masking

---

## Role Definitions

| Role | Description | Typical Users |
|------|-------------|---------------|
| **Admin** | Full system administration | System admins, Database admins |
| **Privilege** | Execute workflows | Data engineers, Operations team |
| **General** | Read-only monitoring | Business analysts, Auditors |
| **Support** | Technical support | Help desk, Support team |

---

## Module Access Matrix

### 1. Server Connections Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View connection list | Yes | Yes | Yes | Yes |
| Create new connection | Yes | No | No | No |
| Edit connection details | Yes | No | No | No |
| Delete connection | Yes | No | No | No |
| Test connection | Yes | No | No | No |
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
| Stop execution | Yes | Yes | No | No |
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
| **Server Connections** | Full (CRUD + Test) | Read Only | Read Only | Read Only |
| **Workflows** | Full (CRUD + Execute) | Read + Execute | Read Only | Read Only |
| **Executions** | Full (View + Start + Stop) | View + Start + Stop | Read Only | Read Only |
| **Preview & Validation** | Full Read | Full Read | Full Read | Full Read |
| **User Management** | Full (CRUD) | No Access | No Access | No Access |
| **Dashboard** | Full Access | Full Access | View Only | View Only |

---

## Key Differences Between Roles

### Admin vs Privilege
- **Admin**: Can CREATE and DELETE workflows
- **Privilege**: Can only EXECUTE pre-configured workflows

### Privilege vs General
- **Privilege**: Can EXECUTE workflows (run in-place masking)
- **General**: Can only VIEW workflows (cannot execute)

### General vs Support
- **Identical permissions** (both are read-only roles)
- Different organizational purpose (auditing vs troubleshooting)

---

## Implementation Reference

- **Frontend RBAC**: `src/utils/rbac.js`, `src/components/common/ProtectedAction.js`
- **Backend RBAC**: `backend/app/middleware/rbac_middleware.py`, `backend/app/services/rbac_service.py`
- **Database Schema**: `backend/migrations/create_rbac_tables.sql`

---

**Document End**
