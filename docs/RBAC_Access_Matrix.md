# RBAC Access Matrix - PII Masking Tool

**Document Version:** 1.0
**Date:** January 2025
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
| View connection list | ✅ | ✅ | ✅ | ✅ |
| Create new connection | ✅ | ❌ | ❌ | ❌ |
| Edit connection details | ✅ | ❌ | ❌ | ❌ |
| Delete connection | ✅ | ❌ | ❌ | ❌ |
| Test connection | ✅ | ❌ | ❌ | ❌ |
| View schemas/tables | ✅ | ✅ | ✅ | ✅ |
| View table columns | ✅ | ✅ | ✅ | ✅ |

---

### 2. Workflows Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View workflow list | ✅ | ✅ | ✅ | ✅ |
| Create new workflow | ✅ | ❌ | ❌ | ❌ |
| Edit workflow | ✅ | ❌ | ❌ | ❌ |
| Delete workflow | ✅ | ❌ | ❌ | ❌ |
| **Execute workflow** | ✅ | ✅ | ❌ | ❌ |
| View column mappings | ✅ | ✅ | ✅ | ✅ |
| Edit column mappings | ✅ | ❌ | ❌ | ❌ |
| View PII attributes | ✅ | ✅ | ✅ | ✅ |

---

### 3. Execution Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View execution history | ✅ | ✅ | ✅ | ✅ |
| Start execution | ✅ | ✅ | ❌ | ❌ |
| Stop execution | ✅ | ✅ | ❌ | ❌ |
| View execution status | ✅ | ✅ | ✅ | ✅ |
| View execution logs | ✅ | ✅ | ✅ | ✅ |
| View execution progress | ✅ | ✅ | ✅ | ✅ |

---

### 4. Preview & Validation Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View masking preview | ✅ | ✅ | ✅ | ✅ |
| View constraint checks | ✅ | ✅ | ✅ | ✅ |
| View primary keys | ✅ | ✅ | ✅ | ✅ |
| View foreign keys | ✅ | ✅ | ✅ | ✅ |
| View unique constraints | ✅ | ✅ | ✅ | ✅ |
| View check constraints | ✅ | ✅ | ✅ | ✅ |
| View triggers | ✅ | ✅ | ✅ | ✅ |
| View indexes | ✅ | ✅ | ✅ | ✅ |

---

### 5. User Management Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View users | ✅ | ❌ | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ | ❌ |
| View roles | ✅ | ❌ | ❌ | ❌ |
| Create roles | ✅ | ❌ | ❌ | ❌ |

---

### 6. Dashboard Module

| Feature | Admin | Privilege | General | Support |
|---------|-------|-----------|---------|---------|
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View statistics | ✅ | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ | ✅ |
| Quick actions | ✅ | ✅ | ❌ | ❌ |

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
