# PII MASKING TOOL
# ARCHITECTURE & DESIGN DOCUMENT

**Version:** 1.0
**Date:** January 2025
**Document Type:** Technical Architecture

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Technology Stack](#6-technology-stack)
7. [Database Design](#7-database-design)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Integration Architecture](#10-integration-architecture)

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
- **Execution Monitoring**: Track workflow execution history with success/failure metrics
- **Role-Based Access Control**: Admin and User roles with different permission levels
- **Audit Trail**: Complete history of who executed what and when

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
┌────────────────────────────────────────────────────────────────┐
│                    SYSTEM CAPABILITIES                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  SERVER CONNECTION MANAGEMENT                                  │
│  ├─ Register database server connections                      │
│  ├─ Support multiple database types (Azure SQL, PostgreSQL,   │
│  │   Oracle, SQL Server)                                      │
│  ├─ Test connection validity before saving                    │
│  ├─ Secure credential storage with encryption                 │
│  └─ Connection name validation (cannot match server name)     │
│                                                                │
│  SCHEMA EXPLORATION                                            │
│  ├─ Browse available schemas in connected databases           │
│  ├─ View tables within each schema                            │
│  ├─ Inspect column metadata (name, type, nullability)         │
│  └─ Automatic data type detection                             │
│                                                                │
│  WORKFLOW CONFIGURATION                                        │
│  ├─ Create named workflows with descriptions                  │
│  ├─ Select single connection for in-place masking             │
│  ├─ Select schema and table for masking                       │
│  ├─ Configure column-level PII masking rules                  │
│  ├─ Smart filtering: Only show compatible masking options     │
│  └─ Save/edit/delete workflow configurations                  │
│                                                                │
│  CONSTRAINT CHECKING                                           │
│  ├─ Check primary key constraints                             │
│  ├─ Check foreign key constraints                             │
│  ├─ Check unique constraints                                  │
│  ├─ Check check constraints                                   │
│  ├─ Check triggers on table                                   │
│  └─ Check indexes on table                                    │
│                                                                │
│  PREVIEW MASKING                                               │
│  ├─ Preview masking on sample records                         │
│  ├─ Configure number of preview records                       │
│  ├─ View original vs masked data side-by-side                 │
│  └─ Validate masking before execution                         │
│                                                                │
│  IN-PLACE PII MASKING EXECUTION                                │
│  ├─ Execute masking directly on same table                    │
│  ├─ Apply masking transformations based on rules              │
│  ├─ Transaction management (rollback on failure)              │
│  ├─ Performance metrics (rows processed, duration)            │
│  └─ Detailed execution logs                                   │
│                                                                │
│  MONITORING & REPORTING                                        │
│  ├─ View workflow execution history                           │
│  ├─ Track success/failure status                              │
│  ├─ Display error messages for failed executions              │
│  ├─ Show row counts (processed vs masked)                     │
│  ├─ View execution logs                                       │
│  └─ User attribution (who executed what)                      │
│                                                                │
│  SECURITY & COMPLIANCE                                         │
│  ├─ JWT-based authentication                                  │
│  ├─ Role-based authorization (Admin/User)                     │
│  ├─ Encrypted database credentials                            │
│  ├─ Audit trail of all operations                             │
│  └─ Secure password storage (hashed)                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 User Journey

```
User Login
    ↓
Dashboard (Overview of connections, workflows, recent executions)
    ↓
    ├─→ Manage Server Connections
    │       ↓
    │   Add Connection (Connection Details → Test Connection → Save)
    │       ↓
    │   View/Delete existing connections
    │
    ├─→ Create Workflow
    │       ↓
    │   Step 1: Basic Info (name, description)
    │       ↓
    │   Step 2: Select connection, schema, table
    │       ↓
    │   Step 3: Configure column mappings with PII attributes
    │       ↓
    │   Save Workflow
    │
    ├─→ View Workflow Details
    │       ↓
    │   Overview Tab: Workflow configuration
    │       ↓
    │   Execution History Tab: Past executions
    │       ↓
    │   Preview Masking Tab:
    │       ├─→ Column Mapping: View configured mappings
    │       ├─→ Constraint Checks: Validate PKs, FKs, etc.
    │       └─→ Preview Masking: See sample masked data
    │
    ├─→ Execute Workflow
    │       ↓
    │   Trigger in-place masking
    │       ↓
    │   Monitor progress
    │       ↓
    │   View execution logs and results
    │
    └─→ View Execution History
            ↓
        Audit trail and reporting
```

---

## 3. HIGH-LEVEL ARCHITECTURE

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                 │
│                      (Presentation Layer)                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │               React Single Page Application                   │ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │              │  │              │  │                  │   │ │
│  │  │   User       │  │  Reusable    │  │   HTTP Client    │   │ │
│  │  │   Interface  │  │  Components  │  │   (Axios)        │   │ │
│  │  │   Pages      │  │  (Material-  │  │                  │   │ │
│  │  │              │  │   UI)        │  │  • JWT Storage   │   │ │
│  │  │ • Login      │  │              │  │  • Auto Auth     │   │ │
│  │  │ • Dashboard  │  │ • Tables     │  │  • Error Handle  │   │ │
│  │  │ • Workflows  │  │ • Forms      │  │                  │   │ │
│  │  │ • Connections│  │ • Dialogs    │  │                  │   │ │
│  │  │ • Detail Page│  │ • Steppers   │  │                  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │ (JSON Payload)
                             │ JWT Authentication
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      APPLICATION TIER                               │
│                      (Business Logic Layer)                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │                    FastAPI Backend Server                     │ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │              │  │              │  │                  │   │ │
│  │  │  Middleware  │  │   API        │  │   Business       │   │ │
│  │  │              │  │   Routers    │  │   Logic          │   │ │
│  │  │ • CORS       │  │              │  │                  │   │ │
│  │  │ • JWT Verify │  │ • /auth      │  │ • DB Mgmt        │   │ │
│  │  │ • Error      │  │ • /server/   │  │ • Workflow Exec  │   │ │
│  │  │   Handler    │  │   connections│  │ • In-Place       │   │ │
│  │  │ • Logging    │  │ • /server/   │  │   Masking        │   │ │
│  │  │              │  │   workflows  │  │ • Constraint     │   │ │
│  │  │              │  │ • /server/   │  │   Checking       │   │ │
│  │  │              │  │   constraints│  │ • Preview        │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ SQL Queries
                             │ (ODBC Protocol)
                             │ Parameterized
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                          DATA TIER                                  │
│                      (Persistence Layer)                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │                  Database Servers                             │ │
│  │         (Azure SQL, PostgreSQL, Oracle, SQL Server)           │ │
│  │                                                               │ │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐  │ │
│  │  │                         │    │                         │  │ │
│  │  │  Application Database   │    │   User Database         │  │ │
│  │  │  (Metadata Storage)     │    │   (In-Place Masking)    │  │ │
│  │  │                         │    │                         │  │ │
│  │  │  Tables:                │    │  Single database where  │  │ │
│  │  │  • users                │    │  PII masking is applied │  │ │
│  │  │  • server_connections   │    │  directly on same table │  │ │
│  │  │  • server_workflows     │    │                         │  │ │
│  │  │  • workflow_executions  │    │  Tables:                │  │ │
│  │  │  • execution_logs       │    │  • User-defined tables  │  │ │
│  │  │                         │    │  • Business data        │  │ │
│  │  │  Purpose:               │    │  • Contains PII to mask │  │ │
│  │  │  Store system config    │    │                         │  │ │
│  │  │  and audit trail        │    │                         │  │ │
│  │  │                         │    │                         │  │ │
│  │  └─────────────────────────┘    └─────────────────────────┘  │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

                         App.js (Root)
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  Authentication         Routing Layer         Layout Wrapper
   Management          (React Router)          (Navigation)
        │                     │                     │
        │                     │                     │
        │     ┌───────────────┼───────────────┐     │
        │     │               │               │     │
        ▼     ▼               ▼               ▼     ▼
     Public Route      Protected Routes      Shared UI
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐       ┌───────────────────┐    ┌──────────┐
   │ Login   │       │ Page Components   │    │ AppBar   │
   │ Page    │       └───────┬───────────┘    │ Drawer   │
   └─────────┘               │                └──────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │Dashboard │  │Workflows │  │Execution │
         │   Page   │  │   Page   │  │   Page   │
         └──────────┘  └──────────┘  └──────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Create   │  │ Workflow │  │Connection│
         │Workflow  │  │  Detail  │  │   Page   │
         │   Page   │  │   Page   │  └──────────┘
         └──────────┘  └──────────┘
         (Multi-Step)
                │
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
Step 1      Step 2      Step 3      Step 4
Basic       Source      Column      Target
Info        Selection   Mapping     Config
```

### 4.2 Frontend Component Descriptions

#### **App.js (Root Component)**
- Entry point of the React application
- Sets up routing structure
- Manages global state initialization
- Wraps application with theme provider

#### **Authentication Management**
- **PrivateRoute Component**: Guards protected routes from unauthorized access
- Checks localStorage for JWT token
- Redirects to login page if token missing or expired
- Allows access to protected pages if authenticated

#### **Page Components**

**Login Page**
- Username and password input fields
- Submit button triggers authentication API call
- Error message display for invalid credentials
- Redirects to dashboard on successful login

**Dashboard Page**
- Overview of system statistics (total connections, workflows, executions)
- Recent activity feed showing latest executions
- Quick action buttons to navigate to main features
- Summary cards with color-coded status indicators

**CreateWorkflowPage (Core Component)**
- Multi-step wizard for workflow creation
- **Step 1 - Basic Information**: Workflow name, description
- **Step 2 - Connection & Table Selection**: Select connection, schema, and table for in-place masking
- **Step 3 - Column Mapping** (CRITICAL): Smart filtering shows only compatible PII attributes based on column data types
- Review and save workflow configuration

**WorkflowDetailPage**
- Displays comprehensive workflow information with tabbed interface
- **Overview Tab**: Workflow configuration, status, and actions
- **Execution History Tab**: Past executions with metrics and logs
- **Preview Masking Tab**:
  - Column Mapping: View configured column mappings
  - Constraint Checks: Validate PKs, FKs, unique, check constraints, triggers, indexes
  - Preview Masking: See sample masked data before execution
- Back button with navigation to workflows list
- Execute Workflow button for on-demand execution

### 4.3 Backend Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

                     FastAPI Application
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   Middleware            API Routers          Business Services
    Layer                   Layer                   Layer
        │                     │                     │
        │                     │                     │
┌───────┴───────┐    ┌────────┴────────┐    ┌──────┴──────┐
│               │    │                 │    │             │
│ • CORS        │    │ • Auth Router   │    │ • DB Manager│
│ • JWT Auth    │    │ • Connections   │    │ • Workflow  │
│ • Error       │    │ • Workflows     │    │   Executor  │
│   Handler     │    │ • Executions    │    │ • Masking   │
│ • Logging     │    │ • Schemas       │    │   Engine    │
│ • Rate Limit  │    │ • PII Attrs     │    │ • Validator │
│               │    │                 │    │             │
└───────┬───────┘    └────────┬────────┘    └──────┬──────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                        Data Access
                           Layer
                              │
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        Application DB    Source DB     Target DB
         (Metadata)       (Read PII)   (Write Masked)
```

### 4.4 Backend Component Descriptions

#### **Middleware Layer**
- **CORS Middleware**: Validates request origin, allows only frontend URL
- **JWT Authentication Middleware**: Decodes and validates JWT token, extracts user information
- **Error Handler Middleware**: Catches exceptions and formats error responses consistently

#### **API Routers**
- **Auth Router** (`/api/auth`): Login, user profile retrieval
- **Server Connections Router** (`/api/server/connections`): Connection CRUD, testing, schema/table discovery
- **Server Workflows Router** (`/api/server/workflows`): Workflow CRUD, execution triggering, preview masking
- **Server Constraints Router** (`/api/server/constraints`): Check PKs, FKs, unique, check constraints, triggers, indexes
- **Server Masking Router** (`/api/server/masking`): Preview masking, execute in-place masking
- **Workflows Router** (`/api/workflows`): PII attributes retrieval

#### **Business Services Layer**

**Database Manager Service**: Establishes connections to database servers (Azure SQL, PostgreSQL, Oracle, SQL Server), manages connection pooling, executes parameterized queries, handles connection errors with retries.

**Workflow Executor Service**: Orchestrates in-place masking - loads configuration, connects to database, applies masking transformations directly to the same table using UPDATE statements, logs results.

**Masking Engine Service**: Implements PII masking algorithms including string masking (fake names, emails, phones), numeric masking (random numbers, ranges), date/datetime masking (shifting), boolean masking.

**Constraint Checker Service**: Validates database constraints before masking including primary keys, foreign keys, unique constraints, check constraints, triggers, and indexes.

**Preview Service**: Generates preview of masked data on sample records before actual execution.

---

## 5. DATA FLOW DIAGRAMS

### 5.1 User Authentication Flow

```
USER AUTHENTICATION FLOW

User                Frontend            Backend           Database
 │                     │                   │                  │
 │  1. Enter           │                   │                  │
 │     Credentials     │                   │                  │
 ├─────────────────────>│                   │                  │
                       │  2. POST /api/auth/│                  │
                       │     login          │                  │
                       ├────────────────────>│                  │
                                           │  3. Query users   │
                                           │     table         │
                                           ├─────────────────>│
                                           │  4. User record   │
                                           │<─────────────────│
                                           │  5. Validate      │
                                           │     password hash │
                                           │                  │
                                           │  IF VALID:       │
                                           │  6. Generate JWT  │
                                           │     Token with:   │
                                           │     - user_id     │
                                           │     - username    │
                                           │     - role        │
                                           │     - expiration  │
                       │  7. Return Token   │                  │
                       │<────────────────────│                  │
                       │  8. Store in       │                  │
                       │     localStorage   │                  │
 │  9. Redirect to     │                   │                  │
 │     Dashboard       │                   │                  │
 │<─────────────────────│                   │                  │
```

**Flow Description:**
1. **User Input**: User enters username and password in login form
2. **API Request**: Frontend sends POST request with credentials
3. **Database Query**: Backend queries users table to find matching username
4. **Password Validation**: Backend compares hashed passwords using bcrypt
5. **Token Generation**: If valid, backend creates JWT token with user claims and 24-hour expiration
6. **Token Storage**: Frontend stores token in localStorage
7. **Navigation**: User redirected to protected dashboard route
8. **Subsequent Requests**: All future API calls include JWT token in Authorization header

**Security Benefits:**
- Stateless authentication (no server-side session storage)
- Token signature prevents tampering
- Automatic expiration enforces re-authentication
- Each API request independently authenticated

---

### 5.2 Workflow Creation Flow

```
WORKFLOW CREATION FLOW (In-Place Masking)

User          Frontend         Backend        App DB      User DB
 │                │                │              │            │
 │  Navigate to   │                │              │            │
 │  Create Page   │                │              │            │
 ├───────────────>│                │              │            │
                  │  Load Initial  │              │            │
                  │  Data          │              │            │
                  │                │              │            │
                  │  GET /server/  │              │            │
                  │  connections   │              │            │
                  ├────────────────>              │            │
                  │                │  Query       │            │
                  │                │  connections │            │
                  │                ├────────────->│            │
                  │  Connection    │  List        │            │
                  │  List          │<─────────────│            │
                  │<────────────────              │            │
                  │                │              │            │
                  │  GET /workflows│              │            │
                  │  /pii-attributes              │            │
                  ├────────────────>              │            │
                  │  Categorized   │              │            │
                  │  PII List      │              │            │
                  │<────────────────              │            │
                  │                │              │            │
 │  STEP 1:       │                │              │            │
 │  Fill Basic    │                │              │            │
 │  Info (name,   │                │              │            │
 │  description)  │                │              │            │
 ├───────────────>│                │              │            │
                  │  Validate &    │              │            │
                  │  Move to Step2 │              │            │
                  │                │              │            │
 │  STEP 2:       │                │              │            │
 │  Select        │                │              │            │
 │  Connection,   │                │              │            │
 │  Schema, Table │                │              │            │
 ├───────────────>│                │              │            │
                  │  GET /server/  │              │            │
                  │  connections/  │              │            │
                  │  {id}/schemas  │              │            │
                  ├────────────────>              │            │
                  │                │  Connect to  │            │
                  │                │  user DB     │            │
                  │                ├──────────────┼──────────->│
                  │                │  Schema list │            │
                  │  Schema List   │<─────────────┼────────────│
                  │<────────────────              │            │
                  │                │              │            │
 │  STEP 3:       │                │              │            │
 │  Column        │                │              │            │
 │  Mapping with  │                │              │            │
 │  Smart Filter  │                │              │            │
 ├───────────────>│                │              │            │
                  │  For each      │              │            │
                  │  column filter │              │            │
                  │  PII by type   │              │            │
                  │                │              │            │
 │  Submit        │                │              │            │
 ├───────────────>│                │              │            │
                  │  POST /server/ │              │            │
                  │  workflows     │              │            │
                  ├────────────────>              │            │
                  │                │  INSERT      │            │
                  │                │  workflow &  │            │
                  │                │  mappings    │            │
                  │                ├────────────->│            │
                  │  Success       │  Workflow ID │            │
                  │<────────────────<─────────────│            │
 │  Navigate to   │                │              │            │
 │  Workflows     │                │              │            │
 │<───────────────│                │              │            │
```

**Flow Description:**

**Initial Load**: Frontend fetches server connections and categorized PII attributes from backend.

**Step 1 - Basic Information**: User provides workflow name and description.

**Step 2 - Connection & Table Selection**: User selects connection, then cascading API calls load schemas, then tables, then column metadata with data types for in-place masking.

**Step 3 - Column Mapping (Smart Filtering)**: For each selected column, frontend identifies data type, maps to PII category, filters dropdown to show only compatible masking options.

**Submission**: Frontend sends complete configuration to backend. Backend creates workflow record with column mappings in transaction.

---

### 5.3 Workflow Execution Flow (In-Place Masking)

```
IN-PLACE MASKING EXECUTION FLOW

User   Frontend   Backend     App DB       User DB
 │        │          │            │            │
 │  Click │          │            │            │
 │ Execute│          │            │            │
 ├───────>│          │            │            │
          │  POST    │            │            │
          │  /server/│            │            │
          │ workflows│            │            │
          │  /{id}/  │            │            │
          │  execute │            │            │
          ├─────────>│            │            │
                     │            │            │
                     │  PHASE 1: INITIALIZATION          │
                     ├──────────->│            │
                     │  Load      │            │
                     │  workflow  │            │
                     │  config    │            │
                     │  Create    │            │
                     │  exec rec  │            │
          │  exec_id │<───────────│            │
          │<─────────│            │            │
 │  Show  │          │            │            │
 │  Started│         │            │            │
 │<───────│          │            │            │
          │          │            │            │
          │          │  PHASE 2: IN-PLACE MASKING        │
          │          ├──────────->├──────────->│
          │          │  UPDATE    │            │
          │          │  table SET │            │
          │          │  col1 =    │            │
          │          │  masked_val│            │
          │          │  col2 =    │            │
          │          │  masked_val│            │
          │          │  ...       │            │
          │          │  COMMIT    │            │
          │          │<───────────│<───────────│
          │          │            │            │
          │          │  PHASE 3: LOGGING       │
          │          ├──────────->│            │
          │          │  Log rows  │            │
          │          │  processed │            │
          │          │  and masked│            │
          │          │<───────────│            │
          │          │            │            │
          │          │  PHASE 4: COMPLETION    │
          │          ├──────────->│            │
          │          │  Update    │            │
          │          │  exec      │            │
          │          │  status:   │            │
          │          │  success   │            │
          │          │<───────────│            │
          │          │            │            │
 │  View  │          │            │            │
 │  Logs  │          │            │            │
 ├────────>│          │            │            │
          │  GET     │            │            │
          │  /server/│            │            │
          │  workflows│           │            │
          │  /{id}/  │            │            │
          │  executions           │            │
          ├─────────>├──────────->│            │
          │  Execution│ Query     │            │
          │  history │  logs      │            │
          │<─────────│<───────────│            │
 │  Display│         │            │            │
 │  Results│         │            │            │
 │<────────│         │            │            │
```



---

### 5.4 Smart PII Filtering Flow

```
SMART PII ATTRIBUTE FILTERING

User                Frontend Logic           PII Categories
 │                         │                        │
 │  Load Create            │                        │
 │  Workflow Page          │                        │
 ├────────────────────────>│  Fetch categorized     │
                           │  PII attributes        │
                           ├───────────────────────>│
                           │  Return:               │
                           │  {                     │
                           │    string: [           │
                           │      first_name,       │
                           │      last_name]        │
                           │    numeric: [          │
                           │      random_number]    │
                           │    date: [date_shift]  │
                           │    datetime: [         │
                           │      datetime_shift]   │
                           │    boolean: [          │
                           │      random_boolean]   │
                           │  }                     │
                           │<───────────────────────│
                           │  Store in state        │
                           │                        │
 │  User selects           │                        │
 │  column "age" (int)     │                        │
 ├────────────────────────>│                        │
                           │  Smart Filter:         │
                           │  1. Get column info    │
                           │  2. Map data type:     │
                           │     "int" -> "numeric" │
                           │  3. Filter PII:        │
                           │     Return numeric     │
                           │     attributes only    │
                           │                        │
 │  Show PII dropdown:     │                        │
 │  [v] Select PII:        │                        │
 │    - random_number      │                        │
 │    - range_number       │                        │
 │    - fixed_number       │                        │
 │  NOT showing:           │                        │
 │    X first_name         │                        │
 │    X date_shift         │                        │
 │<────────────────────────│                        │

DATA TYPE MAPPING:
varchar/text      -> string    -> first_name, email_mask
int/numeric       -> numeric   -> random_number
date              -> date      -> date_shift
datetime          -> datetime  -> datetime_shift
bit/boolean       -> boolean   -> random_boolean
```

**Flow Description:**

Frontend automatically filters PII options based on column data type.

**Process**:
1. Column Selection: User checks checkbox for column (e.g., "age")
2. Metadata Lookup: Frontend retrieves data type from column metadata
3. Category Mapping: Frontend maps SQL type to category (int→numeric, varchar→string, date→date)
4. PII Filtering: Frontend returns only PII attributes matching the category
5. UI Rendering: Dropdown shows only compatible options

**Benefits**: Prevents configuration errors at design time, improves user experience, ensures type compatibility, maintains data integrity.

---

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication Security Features

**Password Security:**
- Passwords hashed using bcrypt with salt (cost factor: 12 rounds)
- Never stored in plaintext
- Never transmitted except during initial login (over HTTPS)
- Password requirements: Minimum 8 characters (configurable)

**Token Security:**
- JWT signed with HMAC-SHA256 algorithm
- Secret key stored in environment variables (never in code)
- Token expiration enforced (24-hour default)
- Automatic logout on token expiration
- Token includes user role for authorization

**Session Management:**
- Stateless authentication (no server-side sessions)
- Token revocation via expiration
- Frontend clears token on logout
- Expired tokens automatically rejected by backend


**Benefits of RBAC:**
- Simplified permission management
- Clear separation of admin and user capabilities
- Principle of least privilege
- Easy to add new roles in future
- Audit trail shows who had what permissions

### 8.5 Data Encryption Architecture

**Encryption at Rest:**

Database connection passwords in `connections.password` table column are encrypted using AES-256-CBC encryption. The encryption key is stored in environment variable `SECRET_ENCRYPTION_KEY`, and a random 16-byte initialization vector (IV) is generated for each encryption. The encrypted ciphertext is stored in the database. When needed for connection, the password is decrypted using the key from environment and IV from cipher. The plaintext exists only in memory, is used immediately, and cleared after use. Passwords are never logged.

**Password Hashing:**

User passwords in `users.password_hash` are hashed using bcrypt with automatic random salt generation and cost factor of 12 rounds (2^12 iterations). The stored hash includes algorithm version, cost factor, salt, and hash output in the format `$2b$12$abcd...xyz`. During login, the system retrieves the stored hash, uses bcrypt.compare() to hash the input password with the same salt, and compares results.

**Encryption in Transit:**

All client-server communication uses HTTPS/TLS 1.3. The TLS handshake includes client hello with supported ciphers, server hello with chosen cipher and certificate containing public key. Client verifies certificate, generates session keys, and encrypts them with server's public key. Both sides derive symmetric session keys. All subsequent data is encrypted including API requests, responses, JWT tokens, and passwords during login.

## 9. DEPLOYMENT ARCHITECTURE

### 9.1 Development Environment

```
DEVELOPMENT ENVIRONMENT

Developer Workstation (Windows/Mac/Linux)
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │        Frontend (Port 3000)                 │  │
│  │  ──────────────────────────────             │  │
│  │  React Development Server                   │  │
│  │  • npm start                                │  │
│  │  • Hot Module Replacement (HMR)             │  │
│  │  • Source maps for debugging                │  │
│  │  • React Developer Tools                    │  │
│  │  • Auto-reload on file changes              │  │
│  │  • URL: http://localhost:3000               │  │
│  └─────────────────────────────────────────────┘  │
│                      │                             │
│                      │ API Calls                   │
│                      ▼                             │
│  ┌─────────────────────────────────────────────┐  │
│  │        Backend (Port 8000)                  │  │
│  │  ──────────────────────────────             │  │
│  │  FastAPI with Uvicorn                       │  │
│  │  • uvicorn main:app --reload                │  │
│  │  • Auto-reload on code changes              │  │
│  │  • OpenAPI docs: /docs                      │  │
│  │  • Debug logging enabled                    │  │
│  │  • Single worker                            │  │
│  │  • URL: http://localhost:8000               │  │
│  └─────────────────────────────────────────────┘  │
│                      │                             │
│                      │ SQL Queries                 │
│                      ▼                             │
│  ┌─────────────────────────────────────────────┐  │
│  │      SQL Server Database                    │  │
│  │  ──────────────────────────────             │  │
│  │  Local Instance or Remote Dev Server        │  │
│  │  • Application DB: pii_tool_dev             │  │
│  │  • Test source/target databases             │  │
│  │  • Sample data for testing                  │  │
│  │  • Connection: localhost:1433               │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  Configuration (.env file):                        │
│  • SECRET_KEY=dev-secret-key-12345                 │
│  • DATABASE_URL=localhost:1433                     │
│  • ENVIRONMENT=development                         │
│  • DEBUG=True                                      │
│  • LOG_LEVEL=DEBUG                                 │
│  • CORS_ORIGINS=http://localhost:3000              │
│                                                    │
└────────────────────────────────────────────────────┘
```


## 10. INTEGRATION ARCHITECTURE

### 10.1 API Integration Pattern

```
API INTEGRATION ARCHITECTURE

            ┌────────────────┐
            │  External      │
            │  Systems       │
            │  (Future)      │
            └────────┬───────┘
                     │
                     │ REST API
                     ▼
┌────────────────────────────────────────────────────┐
│         API GATEWAY (Future)                       │
│  ├─ Rate limiting                                  │
│  ├─ API key management                             │
│  ├─ Request transformation                         │
│  └─ Response caching                               │
└────────────┬───────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────┐
│     PII MASKING TOOL BACKEND API                   │
│        (FastAPI Application)                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  API Endpoints (RESTful):                          │
│                                                    │
│  Authentication:                                   │
│  POST   /api/auth/login                            │
│  GET    /api/auth/me                               │
│                                                    │
│  Server Connections:                               │
│  GET    /api/server/connections                    │
│  POST   /api/server/connections                    │
│  GET    /api/server/connections/{id}               │
│  DELETE /api/server/connections/{id}               │
│  POST   /api/server/connections/test               │
│                                                    │
│  Schema Discovery:                                 │
│  GET    /api/server/connections/{id}/schemas       │
│  GET    /api/server/connections/{id}/schemas/      │
│         {schema}/tables                            │
│  GET    /api/server/connections/{id}/schemas/      │
│         {schema}/tables/{table}/columns            │
│                                                    │
│  Server Workflows:                                 │
│  GET    /api/server/workflows                      │
│  POST   /api/server/workflows                      │
│  GET    /api/server/workflows/{id}                 │
│  DELETE /api/server/workflows/{id}                 │
│  POST   /api/server/workflows/{id}/execute         │
│  GET    /api/server/workflows/{id}/executions      │
│  GET    /api/server/workflows/{id}/executions/     │
│         {exec_id}/logs                             │
│                                                    │
│  Constraint Checking:                              │
│  GET    /api/server/constraints/primary-keys       │
│  GET    /api/server/constraints/foreign-keys       │
│  GET    /api/server/constraints/unique             │
│  GET    /api/server/constraints/check              │
│  GET    /api/server/constraints/triggers           │
│  GET    /api/server/constraints/indexes            │
│                                                    │
│  Masking:                                          │
│  POST   /api/server/masking/preview                │
│                                                    │
│  PII Attributes:                                   │
│  GET    /api/workflows/pii-attributes              │
│                                                    │
│  Health Check:                                     │
│  GET    /health                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```


## DOCUMENT END

This technical architecture document provides a comprehensive overview of the PII Masking Tool system design, focusing on:

• **JWT-based authentication** for stateless security
• **Smart PII filtering** based on SQL data types
• **ETL-style masking execution** with transaction safety
• **Role-based access control** for authorization
• **Production-ready deployment** patterns

The architecture prioritizes:

• **Data Integrity**: Constraint validation before insertion
• **Security**: Multiple layers of protection (network, application, data)
• **Maintainability**: Clear component boundaries and documentation
• **Scalability**: Horizontal scaling support for frontend and backend
• **User Experience**: Intelligent UI that prevents configuration errors

All components work together to provide a robust, secure, and user-friendly solution for PII data masking across databases.

---
