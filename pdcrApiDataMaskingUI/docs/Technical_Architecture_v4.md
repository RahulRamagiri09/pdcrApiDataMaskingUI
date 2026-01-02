# PII MASKING TOOL
# ARCHITECTURE & DESIGN DOCUMENT

**Version:** 4.0
**Date:** January 2026
**Document Type:** Technical Architecture

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Technology Stack](#6-technology-stack)
7. [API Reference](#7-api-reference)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Frontend Routes](#10-frontend-routes)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview

The **PII Masking Tool** is an enterprise web application designed to protect Personally Identifiable Information (PII) by performing **in-place masking** of sensitive data within a single database. The tool masks PII columns directly in the same table, schema, and database where the data resides.

### 1.2 Purpose

This document provides a comprehensive technical architecture overview of the PII Masking Tool, including:
- System architecture and component relationships
- Data flow through the application
- Technology choices and their justification
- Security measures and deployment strategy

### 1.3 Key Features

- **Server Connection Management**: Configure and test connections to SQL Server databases (Azure SQL, PostgreSQL, Oracle, SQL Server)
- **Schema Discovery**: Browse database schemas, tables, and column metadata
- **Intelligent Workflow Creation**: Select tables and map columns to appropriate PII masking techniques based on data types
- **In-Place PII Masking**: Execute data transformation directly on the same table with constraint validation
- **Preview Masking**: Preview how masking will affect sample records before execution
- **Constraint Checking**: Validate primary keys, foreign keys, unique constraints, check constraints, triggers, and indexes before masking
- **Execution Control**: Start, stop, pause, and resume workflow executions
- **Execution Monitoring**: Track workflow execution history with success/failure metrics
- **Role-Based Access Control**: Admin, Privilege, General, and Support roles with different permission levels
- **User Management**: Admin can create users and roles
- **Audit Trail**: Complete history of who executed what and when
- **API Encryption**: Optional AES-256 encryption for all API request/response payloads

### 1.4 Target Users

- **Database Administrators**: Manage database connections and schema exploration
- **Data Privacy Officers**: Configure PII masking workflows
- **Data Engineers**: Execute workflows to mask sensitive data in-place
- **Compliance Teams**: Monitor masking operations and audit trails

---

## 2. SYSTEM OVERVIEW

### 2.1 Business Context

Organizations need to comply with data privacy regulations (GDPR, CCPA, HIPAA) by protecting sensitive PII data within their databases. The PII Masking Tool automates the process of:

1. Connecting to database servers (Azure SQL, PostgreSQL, Oracle, SQL Server)
2. Discovering schemas, tables, and columns containing PII
3. Configuring column-level masking rules based on data types
4. Validating database constraints before masking (PKs, FKs, unique, check, triggers, indexes)
5. Executing in-place masking transformations directly on the same table
6. Maintaining data integrity and referential constraints

### 2.2 System Capabilities

```
+----------------------------------------------------------------+
|                    SYSTEM CAPABILITIES                          |
+----------------------------------------------------------------+
|                                                                |
|  SERVER CONNECTION MANAGEMENT                                  |
|  +- Register database server connections                       |
|  +- Support multiple database types (Azure SQL, PostgreSQL,    |
|  |   Oracle, SQL Server)                                       |
|  +- Test connection validity before saving                     |
|  +- Secure credential storage with encryption                  |
|  +- Connection name validation (cannot match server name)      |
|                                                                |
|  SCHEMA EXPLORATION                                            |
|  +- Browse available schemas in connected databases            |
|  +- View tables within each schema                             |
|  +- Inspect column metadata (name, type, nullability)          |
|  +- Automatic data type detection                              |
|                                                                |
|  WORKFLOW CONFIGURATION                                        |
|  +- Create named workflows with descriptions                   |
|  +- Select single connection for in-place masking              |
|  +- Select schema and table for masking                        |
|  +- Configure column-level PII masking rules                   |
|  +- Smart filtering: Only show compatible masking options      |
|  +- Save/edit/delete workflow configurations                   |
|                                                                |
|  CONSTRAINT CHECKING                                           |
|  +- Check primary key constraints                              |
|  +- Check foreign key constraints                              |
|  +- Check unique constraints                                   |
|  +- Check check constraints                                    |
|  +- Check triggers on table                                    |
|  +- Check indexes on table                                     |
|                                                                |
|  PREVIEW MASKING                                               |
|  +- Preview masking on sample records                          |
|  +- Configure number of preview records                        |
|  +- View original vs masked data side-by-side                  |
|  +- Validate masking before execution                          |
|                                                                |
|  IN-PLACE PII MASKING EXECUTION                                |
|  +- Execute masking directly on same table                     |
|  +- Apply masking transformations based on rules               |
|  +- Transaction management (rollback on failure)               |
|  +- Performance metrics (rows processed, duration)             |
|  +- Detailed execution logs                                    |
|                                                                |
|  EXECUTION CONTROL                                             |
|  +- Start workflow execution                                   |
|  +- Stop running execution                                     |
|  +- Pause running execution                                    |
|  +- Resume paused execution                                    |
|  +- Monitor execution status in real-time                      |
|                                                                |
|  USER MANAGEMENT (Admin Only)                                  |
|  +- Create new users                                           |
|  +- Assign roles to users                                      |
|  +- Create new roles                                           |
|  +- View all users and roles                                   |
|                                                                |
|  MONITORING & REPORTING                                        |
|  +- View workflow execution history                            |
|  +- Track success/failure status                               |
|  +- Display error messages for failed executions               |
|  +- Show row counts (processed vs masked)                      |
|  +- View execution logs                                        |
|  +- User attribution (who executed what)                       |
|                                                                |
|  SECURITY & COMPLIANCE                                         |
|  +- JWT-based authentication                                   |
|  +- Role-based authorization (Admin/Privilege/General/Support) |
|  +- Encrypted database credentials                             |
|  +- Audit trail of all operations                              |
|  +- Secure password storage (hashed)                           |
|  +- Optional API payload encryption (AES-256)                  |
|                                                                |
+----------------------------------------------------------------+
```

---

## 3. HIGH-LEVEL ARCHITECTURE

### 3.1 System Architecture Diagram

```
+---------------------------------------------------------------------+
|                         CLIENT TIER                                  |
|                      (Presentation Layer)                            |
|  +---------------------------------------------------------------+  |
|  |                                                               |  |
|  |               React Single Page Application                   |  |
|  |                                                               |  |
|  |  +--------------+  +--------------+  +------------------+    |  |
|  |  |              |  |              |  |                  |    |  |
|  |  |   User       |  |  Reusable    |  |   HTTP Client    |    |  |
|  |  |   Interface  |  |  Components  |  |   (Axios)        |    |  |
|  |  |   Pages      |  |  (Material-  |  |                  |    |  |
|  |  |              |  |   UI)        |  |  - JWT Storage   |    |  |
|  |  | - Login      |  |              |  |  - Auto Auth     |    |  |
|  |  | - Dashboard  |  | - Tables     |  |  - Error Handle  |    |  |
|  |  | - Workflows  |  | - Forms      |  |  - Encryption    |    |  |
|  |  | - Connections|  | - Dialogs    |  |                  |    |  |
|  |  | - Detail Page|  | - Steppers   |  |                  |    |  |
|  |  +--------------+  +--------------+  +------------------+    |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
+----------------------------+----------------------------------------+
                             |
                             | HTTPS/REST API
                             | (JSON Payload - Optionally Encrypted)
                             | JWT Authentication
                             v
+----------------------------+----------------------------------------+
|                      APPLICATION TIER                               |
|                      (Business Logic Layer)                         |
|  +---------------------------------------------------------------+  |
|  |                                                               |  |
|  |                    FastAPI Backend Server                     |  |
|  |                                                               |  |
|  |  +--------------+  +--------------+  +------------------+    |  |
|  |  |              |  |              |  |                  |    |  |
|  |  |  Middleware  |  |   API        |  |   Business       |    |  |
|  |  |              |  |   Routers    |  |   Logic          |    |  |
|  |  | - CORS       |  |              |  |                  |    |  |
|  |  | - JWT Verify |  | - /auth      |  | - DB Mgmt        |    |  |
|  |  | - Error      |  | - /datamasking| | - Workflow Exec  |    |  |
|  |  |   Handler    |  |   /connections| | - In-Place       |    |  |
|  |  | - Logging    |  | - /datamasking| |   Masking        |    |  |
|  |  | - Encryption |  |   /workflows | | - Constraint     |    |  |
|  |  |              |  | - /datamasking| |   Checking       |    |  |
|  |  |              |  |   /constraints| | - Preview        |    |  |
|  |  +--------------+  +--------------+  +------------------+    |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
+----------------------------+----------------------------------------+
                             |
                             | SQL Queries
                             | (ODBC Protocol)
                             | Parameterized
                             v
+----------------------------+----------------------------------------+
|                          DATA TIER                                  |
|                      (Persistence Layer)                            |
|  +---------------------------------------------------------------+  |
|  |                                                               |  |
|  |                  Database Servers                             |  |
|  |         (Azure SQL, PostgreSQL, Oracle, SQL Server)           |  |
|  |                                                               |  |
|  |  +-------------------------+    +-------------------------+   |  |
|  |  |                         |    |                         |   |  |
|  |  |  Application Database   |    |   User Database         |   |  |
|  |  |  (Metadata Storage)     |    |   (In-Place Masking)    |   |  |
|  |  |                         |    |                         |   |  |
|  |  |  Tables:                |    |  Single database where  |   |  |
|  |  |  - users                |    |  PII masking is applied |   |  |
|  |  |  - roles                |    |  directly on same table |   |  |
|  |  |  - server_connections   |    |                         |   |  |
|  |  |  - server_workflows     |    |  Tables:                |   |  |
|  |  |  - workflow_executions  |    |  - User-defined tables  |   |  |
|  |  |  - execution_logs       |    |  - Business data        |   |  |
|  |  |                         |    |  - Contains PII to mask |   |  |
|  |  |  Purpose:               |    |                         |   |  |
|  |  |  Store system config    |    |                         |   |  |
|  |  |  and audit trail        |    |                         |   |  |
|  |  |                         |    |                         |   |  |
|  |  +-------------------------+    +-------------------------+   |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
+---------------------------------------------------------------------+
```

### 3.2 Architecture Pattern

**Pattern Type:** 3-Tier Layered Architecture

**Why This Pattern:**
- **Separation of Concerns**: Each tier has a distinct responsibility
- **Independent Scaling**: Scale presentation, logic, and data layers independently
- **Technology Flexibility**: Replace or upgrade individual tiers without affecting others
- **Security**: Multiple security checkpoints at each layer
- **Maintainability**: Changes to one layer minimally impact other layers

---

## 4. COMPONENT ARCHITECTURE

### 4.1 Frontend Component Structure

```
+---------------------------------------------------------------+
|                    FRONTEND ARCHITECTURE                       |
+---------------------------------------------------------------+

                         App.jsx (Root)
                              |
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
  Authentication         Routing Layer         Layout Wrapper
   Management          (React Router)          (Navigation)
        |                     |                     |
        |                     |                     |
        |     +---------------+---------------+     |
        |     |               |               |     |
        v     v               v               v     v
     Public Route      Protected Routes      Shared UI
        |                     |                     |
        |                     |                     |
        v                     v                     v
   +---------+       +-------------------+    +----------+
   | Login   |       | Page Components   |    | AppBar   |
   | Page    |       +--------+----------+    | Drawer   |
   +---------+                |               +----------+
                              |
                +-------------+-------------+
                |             |             |
                v             v             v
         +----------+   +----------+   +----------+
         |Dashboard |   |Workflows |   |Connections|
         |   Page   |   |   Page   |   |   Page   |
         +----------+   +----------+   +----------+
                              |
                +-------------+-------------+
                |             |             |
                v             v             v
         +----------+   +----------+   +----------+
         | Create   |   | Workflow |   | User/Role|
         |Workflow  |   |  Detail  |   |  Mgmt    |
         |   Page   |   |   Page   |   +---------+
         +----------+   +----------+
         (Multi-Step)
                |
                |
    +-----------+-----------+
    |           |           |
    v           v           v
Step 1      Step 2      Step 3      Step 4
Basic       Source      Column      Target
Info        Selection   Mapping     Config
```

### 4.2 Frontend Source Structure

```
src/
+-- components/
|   +-- common/
|   |   +-- ProtectedAction.jsx    # RBAC-controlled UI rendering
|   |   +-- PageHeader.jsx
|   |   +-- ConfirmDeleteDialog.jsx # Reusable delete confirmation
|   +-- Layout/
|   |   +-- MainLayout.jsx         # Responsive layout with sidebar
|   +-- Login/
|   |   +-- Login.jsx              # Authentication form
|   +-- ProtectedRoute/
|   |   +-- ProtectedRoute.jsx     # Route guard
|   +-- Sidebar/
|   |   +-- Sidebar.jsx            # Navigation with role-based visibility
|   +-- ServerDashboard/
|   |   +-- ServerDashboard.jsx    # Main dashboard
|   +-- ServerConnections/
|   |   +-- ServerConnectionsPage.jsx
|   |   +-- CreateConnectionDialog.jsx
|   +-- ServerWorkflows/
|   |   +-- ServerWorkflowsPage.jsx
|   |   +-- CreateWorkflowPage.jsx   # 4-step workflow wizard
|   |   +-- WorkflowDetailPage.jsx
|   +-- UserRegistration/
|   |   +-- UserRegistration.jsx   # Admin: Create users
|   +-- RoleRegistration/
|       +-- RoleRegistration.jsx   # Admin: Create roles
+-- services/
|   +-- api.js                    # Axios instances with interceptors & encryption
+-- utils/
|   +-- auth.js                   # Authentication helpers
|   +-- rbac.js                   # Role-Based Access Control
|   +-- encryption.js             # AES-256 encryption/decryption
|   +-- timeFormat.js             # Utility functions
+-- hooks/
|   +-- usePermission.js          # RBAC hooks
+-- context/
|   +-- SidebarContext.jsx        # Sidebar state
+-- App.jsx                       # Router configuration
+-- index.jsx                     # Entry point
```

---

## 5. DATA FLOW DIAGRAMS

### 5.1 User Authentication Flow

```
USER AUTHENTICATION FLOW

User                Frontend            Backend           Database
 |                     |                   |                  |
 |  1. Enter           |                   |                  |
 |     Credentials     |                   |                  |
 +-------------------->|                   |                  |
                       |  2. POST /api/    |                  |
                       |     auth/login    |                  |
                       |  (encrypted if    |                  |
                       |   enabled)        |                  |
                       +------------------>|                  |
                                           |  3. Query users  |
                                           |     table        |
                                           +----------------->|
                                           |  4. User record  |
                                           |<-----------------+
                                           |  5. Validate     |
                                           |     password     |
                                           |                  |
                                           |  IF VALID:       |
                                           |  6. Generate JWT |
                       |  7. Return Token  |                  |
                       |  (encrypted if    |                  |
                       |   enabled)        |                  |
                       |<------------------+                  |
                       |  8. Store in      |                  |
                       |     localStorage  |                  |
 |  9. Redirect to     |                   |                  |
 |     Dashboard       |                   |                  |
 |<--------------------+                   |                  |
```

### 5.2 Workflow Execution Flow (In-Place Masking)

```
IN-PLACE MASKING EXECUTION FLOW

User   Frontend   Backend     App DB       User DB
 |        |          |            |            |
 |  Click |          |            |            |
 | Execute|          |            |            |
 +------->|          |            |            |
          |  POST    |            |            |
          |/datamasking/workflows/execute     |
          +--------->|            |            |
                     |            |            |
                     |  PHASE 1: INITIALIZATION |
                     +----------->|            |
                     |  Load      |            |
                     |  workflow  |            |
                     |  config    |            |
          |  exec_id |<-----------+            |
          |<---------+            |            |
 |  Show  |          |            |            |
 | Started|          |            |            |
 |<-------+          |            |            |
          |          |            |            |
          |          |  PHASE 2: IN-PLACE MASK |
          |          +----------->+----------->|
          |          |  UPDATE    |            |
          |          |  SET col = |            |
          |          |  masked    |            |
          |          |  COMMIT    |            |
          |          |<-----------+<-----------+
          |          |            |            |
          |          |  PHASE 3: LOGGING       |
          |          +----------->|            |
          |          |  Log rows  |            |
          |          |<-----------+            |
          |          |            |            |
          |          |  PHASE 4: COMPLETION    |
          |          +----------->|            |
          |          |  Update    |            |
          |          |  status    |            |
          |          |<-----------+            |
 |  View  |          |            |            |
 |  Logs  |          |            |            |
 +------->|          |            |            |
          |  GET     |            |            |
          | executions|           |            |
          +--------->+----------->|            |
          |  History |            |            |
          |<---------+<-----------+            |
 | Display|          |            |            |
 | Results|          |            |            |
 |<-------+          |            |            |
```

---

## 6. TECHNOLOGY STACK

### 6.1 Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI Framework |
| React Router DOM | 6.30.1 | Client-side routing |
| Material-UI (MUI) | 7.3.2 | UI Component library |
| MUI Data Grid | 8.11.3 | Advanced data tables |
| Axios | 1.12.2 | HTTP client |
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| CryptoJS | 4.2.0 | AES encryption |
| **Vite** | **6.0.7** | **Build tool & dev server** |
| **@vitejs/plugin-react** | **4.3.4** | **React plugin for Vite** |
| Node.js | **23.11.1** | Runtime environment |

### 6.2 Backend Stack

| Technology | Purpose |
|-----------|---------|
| FastAPI | Python web framework |
| Uvicorn | ASGI server |
| PyJWT | JWT token handling |
| bcrypt | Password hashing |
| pyodbc | Database connectivity |
| PyCryptodome | AES encryption |
| **Python** | **3.13.0** |

### 6.3 Database Support

- Azure SQL Database
- PostgreSQL
- Oracle
- SQL Server

---

## 7. API REFERENCE

### 7.1 Base Configuration

```
Frontend Port: 5000
Backend API URL: http://localhost:9000
API Base Path: /api
```

### 7.2 Authentication APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/auth/login` | User login | `{ username, password }` |

### 7.3 User Management APIs (Admin Only)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/users` | Create user | `{ username, email, password, role }` |
| GET | `/api/users` | Get all users | - |
| POST | `/api/roles` | Create role | `{ name, permissions }` |
| GET | `/api/roles` | Get all roles | - |

### 7.4 Server Connections APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/datamasking/connections` | List all connections | - |
| POST | `/api/datamasking/connections` | Create connection | `{ connection_name, server_name, database_type, host, port, database_name, username, password }` |
| POST | `/api/datamasking/connections/getById` | Get connection details | `{ id }` |
| DELETE | `/api/datamasking/connections/delete` | Delete connection | `{ id }` |
| POST | `/api/datamasking/connections/test` | Test connection | `{ connection_name, server_name, database_type, host, port, database_name, username, password }` |

### 7.5 Schema Discovery APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/datamasking/connections/schemas` | List schemas | `{ connection_id }` |
| POST | `/api/datamasking/connections/tables` | List tables | `{ connection_id, schema_name }` |
| POST | `/api/datamasking/connections/columns` | List columns | `{ connection_id, schema_name, table_name }` |

### 7.6 Server Workflows APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/datamasking/workflows` | List all workflows | - |
| POST | `/api/datamasking/workflows` | Create workflow | `{ workflow_name, description, connection_id, schema_name, table_name, column_mappings }` |
| POST | `/api/datamasking/workflows/getById` | Get workflow details | `{ id }` |
| PUT | `/api/datamasking/workflows/update` | Update workflow | `{ id, ...workflow_data }` |
| DELETE | `/api/datamasking/workflows/delete` | Delete workflow | `{ id }` |
| POST | `/api/datamasking/workflows/executions` | Get execution history | `{ workflow_id }` |
| GET | `/api/datamasking/workflows/pii-attributes` | Get PII attribute types | - |

### 7.7 Execution & Masking APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/datamasking/workflows/execute` | Execute workflow | `{ workflow_id }` |
| POST | `/api/datamasking/workflows/executions/status` | Get execution status | `{ workflow_id, execution_id }` |
| POST | `/api/datamasking/workflows/executions/stop` | Stop execution | `{ workflow_id, execution_id }` |
| POST | `/api/datamasking/workflows/executions/pause` | Pause execution | `{ workflow_id, execution_id }` |
| POST | `/api/datamasking/workflows/executions/resume` | Resume execution | `{ workflow_id, execution_id }` |
| POST | `/api/datamasking/workflows/preview` | Preview masked data | `{ workflow_id, limit }` |
| POST | `/api/masking/sample-data` | Generate sample data | `{ pii_attribute, count }` |
| POST | `/api/datamasking/masking/validate-workflow` | Validate workflow | `{ workflow_id }` |

### 7.8 Constraint Checking APIs

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/datamasking/constraints/all` | Check all constraints | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/primaryKeys` | Check primary keys | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/foreignKeys` | Check foreign keys | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/unique` | Check unique constraints | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/check` | Check check constraints | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/triggers` | Check triggers | `{ connection_id, schema_name, table_name }` |
| POST | `/api/datamasking/constraints/indexes` | Check indexes | `{ connection_id, schema_name, table_name }` |

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication

**Password Security:**
- Passwords hashed using bcrypt with salt (cost factor: 12 rounds)
- Never stored in plaintext
- Never transmitted except during initial login (over HTTPS)

**JWT Token Security:**
- JWT signed with HMAC-SHA256 algorithm
- Secret key stored in environment variables
- Token expiration enforced (24-hour default)
- Automatic logout on token expiration
- Token includes user role for authorization

**Token Storage:**
- JWT token stored in `localStorage` as `authToken`
- User object stored in `localStorage` as `user`

### 8.2 Authorization (RBAC)

Four roles with different permission levels:

| Role | Capabilities |
|------|-------------|
| **Admin** | Full CRUD on connections, workflows, users, roles. Execute workflows. |
| **Privilege** | View connections, execute workflows, control executions |
| **General** | Read-only access to all features |
| **Support** | Read-only access (same as General) |

See `RBAC_Access_Matrix_v4.md` for detailed permission matrix.

### 8.3 Data Encryption

**At Rest:**
- Database connection passwords encrypted with AES-256-CBC
- User passwords hashed with bcrypt

**In Transit:**
- All communication over HTTPS/TLS 1.3
- JWT tokens encrypted in transit
- Optional API payload encryption (see 8.4)

### 8.4 API Request/Response Encryption

**Overview:**
Optional AES-256 encryption for all API request and response payloads provides an additional layer of security beyond HTTPS.

**Configuration (.env):**
```
VITE_ENCRYPTION_ENABLED=true
VITE_ENCRYPTION_KEY=MySecure32CharacterKeyHere123!
```

| Setting | Description |
|---------|-------------|
| `VITE_ENCRYPTION_ENABLED` | Enable/disable encryption (`true`/`false`) |
| `VITE_ENCRYPTION_KEY` | 32-character key for AES-256 encryption |

**How It Works:**

1. **Request Encryption (Frontend → Backend):**
   - Axios request interceptor encrypts outgoing data
   - Original: `{ username: "admin", password: "secret" }`
   - Encrypted: `{ encrypted: "U2FsdGVkX1+..." }`

2. **Response Decryption (Backend → Frontend):**
   - Axios response interceptor decrypts incoming data
   - Handles both success (2xx) and error (4xx, 5xx) responses
   - Encrypted: `{ encrypted: "U2FsdGVkX1+..." }`
   - Decrypted: `{ access_token: "eyJ...", user: {...} }`

3. **Error Response Decryption:**
   - Error responses are also decrypted before error handling
   - Ensures proper error messages are displayed to users

**Implementation Files:**
- `src/utils/encryption.js` - Encryption/decryption functions
- `src/services/api.js` - Axios interceptors with encryption

**Encryption Functions:**
```javascript
// Encrypt data
encrypt(data) → CryptoJS.AES.encrypt(JSON.stringify(data), KEY).toString()

// Decrypt data
decrypt(encrypted) → JSON.parse(CryptoJS.AES.decrypt(encrypted, KEY).toString(Utf8))
```

**Security Notes:**
- The same encryption key must be configured on both frontend and backend
- Change the default key in production environments
- Key should be stored securely and not committed to version control

---

## 9. DEPLOYMENT ARCHITECTURE

### 9.1 Development Environment

```
DEVELOPMENT ENVIRONMENT

Developer Workstation
+----------------------------------------------------+
|                                                    |
|  +---------------------------------------------+   |
|  |        Frontend (Port 5000)                 |   |
|  |  ------------------------------------------  |   |
|  |  Vite Development Server                    |   |
|  |  - npm run dev                              |   |
|  |  - Hot Module Replacement (HMR)             |   |
|  |  - URL: http://localhost:5000               |   |
|  +---------------------------------------------+   |
|                      |                             |
|                      | API Calls (Encrypted)       |
|                      v                             |
|  +---------------------------------------------+   |
|  |        Backend (Port 9000)                  |   |
|  |  ------------------------------------------  |   |
|  |  FastAPI with Uvicorn                       |   |
|  |  - uvicorn main:app --reload --port 9000    |   |
|  |  - OpenAPI docs: /docs                      |   |
|  |  - URL: http://localhost:9000               |   |
|  +---------------------------------------------+   |
|                      |                             |
|                      | SQL Queries                 |
|                      v                             |
|  +---------------------------------------------+   |
|  |      Database Server                        |   |
|  |  ------------------------------------------  |   |
|  |  Azure SQL / PostgreSQL / SQL Server        |   |
|  |  - Application DB: pii_tool_dev             |   |
|  |  - User databases for masking               |   |
|  +---------------------------------------------+   |
|                                                    |
+----------------------------------------------------+
```

### 9.2 Environment Configuration

**.env file:**
```
# API Configuration
VITE_API_URL=http://localhost:9000

# Server Port
VITE_PORT=5000

# Encryption Settings
# Set to 'true' to enable encryption/decryption, 'false' to disable
VITE_ENCRYPTION_ENABLED=true

# Encryption Key (32 characters for AES-256)
# IMPORTANT: Change this key in production and keep it secret!
# The same key must be used on the backend for decryption
VITE_ENCRYPTION_KEY=MySecure32CharacterKeyHere123!
```

### 9.3 Development Commands

| Action | Command |
|--------|---------|
| Start Dev Server | `npm run dev` |
| Build Production | `npm run build` |
| Preview Build | `npm run preview` |

---

## 10. FRONTEND ROUTES

### 10.1 Route Configuration

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | Login | Public |
| `/datamasking/dashboard` | ServerDashboard | Protected |
| `/datamasking/connections` | ServerConnectionsPage | Protected |
| `/datamasking/workflows` | ServerWorkflowsPage | Protected |
| `/datamasking/workflows/create` | CreateWorkflowPage | Protected (workflow.create) |
| `/datamasking/workflows/:id/edit` | CreateWorkflowPage | Protected (workflow.update) |
| `/datamasking/workflows/:id` | WorkflowDetailPage | Protected |
| `/registeruser` | UserRegistration | Protected (Admin) |
| `/registerrole` | RoleRegistration | Protected (Admin) |
| `/` | Redirect to /login | - |
| `*` | Redirect to /login | - |

### 10.2 Navigation Structure

**Sidebar Menu Items:**
- Dashboard
- Connections
- Workflows
- Register User (Admin only)
- Register Role (Admin only)

---

## DOCUMENT END

This technical architecture document provides a comprehensive overview of the PII Masking Tool system design for Version 4.0, including:

- **JWT-based authentication** for stateless security
- **4-role RBAC system** (Admin, Privilege, General, Support)
- **Smart PII filtering** based on SQL data types
- **In-place masking execution** with transaction safety
- **Execution control** (start/stop/pause/resume)
- **User management** for admins
- **API encryption** for enhanced security

### Changes from Version 3.0

| Area | v3.0 | v4.0 |
|------|------|------|
| Build Tool | Create React App | Vite 6.0.7 |
| Node.js | 18.16.1 | 23.11.1 |
| Python | 3.12 | 3.13.0 |
| Dev Command | `npm start` | `npm run dev` |
| Env Prefix | `REACT_APP_*` | `VITE_*` |
| File Extensions | `.js` with JSX | `.jsx` for JSX files |
| Entry HTML | `public/index.html` | `index.html` (root) |
| Config File | - | `vite.config.js` |
| MUI Data Grid | 7.x | 8.11.3 |
| RBAC Reference | RBAC_Access_Matrix_v3.md | RBAC_Access_Matrix_v4.md |

---
