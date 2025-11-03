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

The **PII Masking Tool** is an enterprise web application designed to protect Personally Identifiable Information (PII) by masking sensitive data when copying from production databases to non-production environments (UAT, Development, Testing).

### 1.2 Purpose

This document provides a comprehensive technical architecture overview of the PII Masking Tool, including:
- System architecture and component relationships
- Data flow through the application
- Technology choices and their justification
- Security measures and deployment strategy

### 1.3 Key Features

- **Database Connection Management**: Configure and test connections to multiple SQL Server databases
- **Schema Discovery**: Browse database schemas, tables, and column metadata
- **Intelligent Workflow Creation**: Map source columns to appropriate PII masking techniques based on data types
- **Automated PII Masking**: Execute data transformation with constraint validation
- **Execution Monitoring**: Track workflow execution history with success/failure metrics
- **Role-Based Access Control**: Admin and User roles with different permission levels
- **Audit Trail**: Complete history of who executed what and when

### 1.4 Target Users

- **Database Administrators**: Manage database connections and schema exploration
- **Data Privacy Officers**: Configure PII masking workflows
- **QA Engineers**: Execute workflows to create test datasets
- **Development Teams**: Access masked data for development purposes

---

## 2. SYSTEM OVERVIEW

### 2.1 Business Context

Organizations need to comply with data privacy regulations (GDPR, CCPA, HIPAA) while providing realistic test data to non-production environments. The PII Masking Tool automates the process of:

1. Connecting to production (source) and non-production (target) databases
2. Identifying columns containing PII
3. Applying appropriate masking transformations
4. Writing masked data to target databases
5. Maintaining data integrity and referential constraints

### 2.2 System Capabilities

```
┌────────────────────────────────────────────────────────────────┐
│                    SYSTEM CAPABILITIES                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  CONNECTION MANAGEMENT                                         │
│  ├─ Register source and target database connections           │
│  ├─ Test connection validity before saving                    │
│  ├─ Secure credential storage with encryption                 │
│  └─ Support for multiple SQL Server instances                 │
│                                                                │
│  SCHEMA EXPLORATION                                            │
│  ├─ Browse available schemas in connected databases           │
│  ├─ View tables within each schema                            │
│  ├─ Inspect column metadata (name, type, nullability)         │
│  └─ Automatic data type detection                             │
│                                                                │
│  WORKFLOW CONFIGURATION                                        │
│  ├─ Create named workflows with descriptions                  │
│  ├─ Select source and target connections                      │
│  ├─ Map source tables to target tables                        │
│  ├─ Configure column-level PII masking rules                  │
│  ├─ Smart filtering: Only show compatible masking options     │
│  └─ Save/edit/delete workflow configurations                  │
│                                                                │
│  PII MASKING EXECUTION                                         │
│  ├─ Extract data from source database                         │
│  ├─ Apply masking transformations based on rules              │
│  ├─ Validate data integrity constraints                       │
│  ├─ Load masked data into target database                     │
│  ├─ Transaction management (rollback on failure)              │
│  └─ Performance metrics (rows processed, duration)            │
│                                                                │
│  MONITORING & REPORTING                                        │
│  ├─ View workflow execution history                           │
│  ├─ Track success/failure status                              │
│  ├─ Display error messages for failed executions              │
│  ├─ Show row counts (processed vs masked)                     │
│  ├─ Manual refresh of execution status                        │
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
Dashboard (Overview of connections, workflows, executions)
    ↓
    ├─→ Manage Connections
    │       ↓
    │   Add/Test/Edit database connections
    │
    ├─→ Explore Schemas
    │       ↓
    │   Browse database structures
    │
    ├─→ Create Workflow
    │       ↓
    │   Step 1: Basic Info (name, connections)
    │       ↓
    │   Step 2: Select source table and columns
    │       ↓
    │   Step 3: Map columns to PII masking techniques
    │       ↓
    │   Step 4: Configure target table
    │       ↓
    │   Save Workflow
    │
    ├─→ Execute Workflow
    │       ↓
    │   Trigger execution
    │       ↓
    │   Monitor progress
    │       ↓
    │   View results
    │
    └─→ View Execution History
            ↓
        Audit and reporting
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
│  │  │              │  │              │  │                  │   │ │
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
│  │  │ • Error      │  │ • /connections│ │ • Workflow Exec  │   │ │
│  │  │   Handler    │  │ • /workflows │  │ • PII Masking    │   │ │
│  │  │ • Logging    │  │ • /executions│  │ • Validation     │   │ │
│  │  │              │  │ • /schemas   │  │ • Constraint     │   │ │
│  │  │              │  │              │  │   Checking       │   │ │
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
│  │                  Microsoft SQL Server                         │ │
│  │                                                               │ │
│  │  ┌─────────────────────────┐    ┌─────────────────────────┐  │ │
│  │  │                         │    │                         │  │ │
│  │  │  Application Database   │    │   User Databases        │  │ │
│  │  │  (Metadata Storage)     │    │   (Source/Target Data)  │  │ │
│  │  │                         │    │                         │  │ │
│  │  │  Tables:                │    │  • Production DB        │  │ │
│  │  │  • users                │    │  • UAT DB               │  │ │
│  │  │  • connections          │    │  • Dev DB               │  │ │
│  │  │  • workflows            │    │  • Test DB              │  │ │
│  │  │  • workflow_mappings    │    │                         │  │ │
│  │  │  • executions           │    │  Tables:                │  │ │
│  │  │                         │    │  • User-defined tables  │  │ │
│  │  │  Purpose:               │    │  • Business data        │  │ │
│  │  │  Store system config    │    │  • Contains PII         │  │ │
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

### 3.3 Tier Responsibilities

#### **Client Tier (Presentation)**
- **Responsibility**: User interface and user experience
- **Key Functions**:
  - Render user interfaces with Material-UI components
  - Handle user interactions (clicks, form submissions)
  - Client-side routing between pages
  - Display data fetched from backend
  - Form validation and error messages
  - JWT token storage in browser localStorage
- **Technology**: React JavaScript framework running in web browser
- **Communication**: Makes HTTPS REST API calls to application tier

#### **Application Tier (Business Logic)**
- **Responsibility**: Business rules, authentication, and workflow orchestration
- **Key Functions**:
  - Authenticate users and issue JWT tokens
  - Validate API requests and authorize access
  - Implement PII masking algorithms
  - Orchestrate ETL process (Extract, Transform, Load)
  - Enforce business rules and constraints
  - Manage database connections to user databases
  - Log operations for audit trail
- **Technology**: Python FastAPI framework running on application server
- **Communication**:
  - Receives HTTPS requests from client tier
  - Makes SQL queries to data tier

#### **Data Tier (Persistence)**
- **Responsibility**: Data storage, integrity, and retrieval
- **Key Functions**:
  - Store application metadata (users, workflows, connections)
  - Store execution history and audit logs
  - Connect to user databases (source/target)
  - Enforce database constraints (NOT NULL, UNIQUE, FK)
  - Transaction management (ACID compliance)
  - Query optimization and indexing
- **Technology**: Microsoft SQL Server database
- **Communication**: Receives SQL queries from application tier

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
- **Step 1 - Basic Information**: Workflow name, description, source/target connections
- **Step 2 - Source Selection**: Cascading dropdowns for schema, table, column selection
- **Step 3 - Column Mapping** (CRITICAL): Smart filtering shows only compatible PII attributes based on column data types
- **Step 4 - Target Configuration**: Select target schema and table, review mappings

**WorkflowDetailPage**
- Displays comprehensive workflow information
- Shows configuration details and column mapping rules
- Execution history table with metrics
- Back button with circular hover effect
- Run Workflow button for on-demand execution
- Manual refresh button (no automatic polling)

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
- **Logging Middleware**: Logs all API requests with timestamp, user, and endpoint

#### **API Routers**
- **Auth Router** (`/api/auth`): Login, user profile retrieval
- **Connections Router** (`/api/connections`): Connection CRUD, testing, schema/table discovery
- **Workflows Router** (`/api/workflows`): Workflow CRUD, execution triggering
- **Executions Router** (`/api/executions`): Execution history and status monitoring
- **PII Attributes Router** (`/api/pii-attributes`): Return categorized masking techniques

#### **Business Services Layer**

**Database Manager Service**: Establishes connections to SQL Server databases, manages connection pooling, executes parameterized queries, handles connection errors with retries.

**Workflow Executor Service**: Orchestrates the ETL process - loads configuration, connects to databases, extracts source data, applies masking transformations, validates constraints, loads to target, logs results.

**Masking Engine Service**: Implements PII masking algorithms including string masking (fake names, emails, phones), numeric masking (random numbers, ranges), date/datetime masking (shifting), boolean masking.

**Validator Service**: Validates data integrity before insertion including NOT NULL checks, data type compatibility, UNIQUE constraints, referential integrity.

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
WORKFLOW CREATION FLOW

User          Frontend         Backend        App DB      Source DB
 │                │                │              │            │
 │  Navigate to   │                │              │            │
 │  Create Page   │                │              │            │
 ├───────────────>│                │              │            │
                  │  Load Initial  │              │            │
                  │  Data          │              │            │
                  │                │              │            │
                  │  GET /connections             │            │
                  ├────────────────>              │            │
                  │                │  Query       │            │
                  │                │  connections │            │
                  │                ├────────────->│            │
                  │  Connection    │  List        │            │
                  │  List          │<─────────────│            │
                  │<────────────────              │            │
                  │                │              │            │
                  │  GET /pii-     │              │            │
                  │  attributes    │              │            │
                  ├────────────────>              │            │
                  │  Categorized   │              │            │
                  │  PII List      │              │            │
                  │<────────────────              │            │
                  │                │              │            │
 │  STEP 1:       │                │              │            │
 │  Fill Basic    │                │              │            │
 │  Info          │                │              │            │
 ├───────────────>│                │              │            │
                  │  Validate &    │              │            │
                  │  Move to Step2 │              │            │
                  │                │              │            │
 │  STEP 2:       │                │              │            │
 │  Select Schema │                │              │            │
 ├───────────────>│                │              │            │
                  │  GET /schemas  │              │            │
                  ├────────────────>              │            │
                  │                │  Connect to  │            │
                  │                │  source DB   │            │
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
                  │  POST          │              │            │
                  │  /workflows    │              │            │
                  ├────────────────>              │            │
                  │                │  INSERT      │            │
                  │                │  workflows & │            │
                  │                │  mappings    │            │
                  │                ├────────────->│            │
                  │  Success       │  Workflow ID │            │
                  │<────────────────<─────────────│            │
 │  Navigate to   │                │              │            │
 │  Workflows     │                │              │            │
 │<───────────────│                │              │            │
```

**Flow Description:**

**Initial Load**: Frontend fetches connections and categorized PII attributes from backend.

**Step 1 - Basic Information**: User provides workflow name, description, and selects source/target connections.

**Step 2 - Source Selection**: Cascading API calls load schemas, then tables, then column metadata with data types.

**Step 3 - Column Mapping (Smart Filtering)**: For each selected column, frontend identifies data type, maps to PII category, filters dropdown to show only compatible masking options.

**Submission**: Frontend sends complete configuration to backend. Backend creates workflow and mapping records in transaction.

---

### 5.3 Workflow Execution Flow

```
WORKFLOW EXECUTION FLOW

User   Frontend   Backend     App DB    Source DB  Target DB
 │        │          │            │          │          │
 │  Click │          │            │          │          │
 │  Run   │          │            │          │          │
 ├────────>│          │            │          │          │
          │  POST    │            │          │          │
          │  /execute│            │          │          │
          ├─────────>│            │          │          │
                     │            │          │          │
                     │  PHASE 1: INITIALIZATION          │
                     ├──────────->│          │          │
                     │  Load      │          │          │
                     │  workflow  │          │          │
                     │  config    │          │          │
                     │  Create    │          │          │
                     │  exec rec  │          │          │
          │  exec_id │<───────────│          │          │
          │<─────────│            │          │          │
 │  Show  │          │            │          │          │
 │  Started│         │            │          │          │
 │<───────│          │            │          │          │
          │          │            │          │          │
          │          │  PHASE 2: DATA EXTRACTION         │
          │          ├──────────->├────────->│          │
          │          │  SELECT *  │          │          │
          │          │  FROM      │          │          │
          │          │  source    │          │          │
          │          │  Result set│          │          │
          │          │<───────────│<─────────│          │
          │          │            │          │          │
          │          │  PHASE 3: TRANSFORMATION          │
          │          │  For each row:       │          │
          │          │  - Apply PII masking │          │
          │          │  - first_name: John  │          │
          │          │    -> Michael        │          │
          │          │  - age: 30 -> 42     │          │
          │          │  - birth_date shifted│          │
          │          │            │          │          │
          │          │  PHASE 4: VALIDATION │          │
          │          │  - NOT NULL checks   │          │
          │          │  - Data type checks  │          │
          │          │  - UNIQUE checks     │          │
          │          │            │          │          │
          │          │  PHASE 5: DATA LOADING           │
          │          ├──────────->├────────->├────────->│
          │          │  INSERT    │          │          │
          │          │  masked    │          │          │
          │          │  data      │          │          │
          │          │  COMMIT    │          │          │
          │          │<───────────│<─────────│<─────────│
          │          │            │          │          │
          │          │  PHASE 6: COMPLETION │          │
          │          ├──────────->│          │          │
          │          │  Update    │          │          │
          │          │  exec      │          │          │
          │          │  status:   │          │          │
          │          │  success   │          │          │
          │          │<───────────│          │          │
          │          │            │          │          │
 │  Click │          │            │          │          │
 │  Refresh│         │            │          │          │
 ├────────>│          │            │          │          │
          │  GET     │            │          │          │
          │  /executions          │          │          │
          ├─────────>├──────────->│          │          │
          │  Updated │  Query     │          │          │
          │  history │  executions│          │          │
          │<─────────│<───────────│          │          │
 │  Display│         │            │          │          │
 │  Success│         │            │          │          │
 │<────────│         │            │          │          │
```

**Flow Description:**

**Phase 1 - Initialization**: Backend loads workflow configuration, retrieves connection credentials, creates execution record with status "running", returns execution_id immediately.

**Phase 2 - Data Extraction**: Backend connects to source database, executes SELECT query, fetches all rows, counts rows_processed.

**Phase 3 - Data Transformation**: For each row, backend applies PII masking. Examples: first_name "John" → "Michael", age 30 → random 42, birth_date shifted by random days.

**Phase 4 - Constraint Validation**: Backend validates NOT NULL constraints, data type compatibility, UNIQUE constraints. If any validation fails, execution stops and marked "failed".

**Phase 5 - Data Loading**: Backend connects to target database, begins transaction, inserts masked data in batches (100 rows per batch), commits transaction.

**Phase 6 - Completion**: Backend updates execution record with final status, row counts, completion time. User clicks manual refresh to see updated history.

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

**Problem**: Without filtering, users could create invalid mappings like applying "first_name" (string) to an integer column.

**Solution**: Frontend automatically filters PII options based on column data type.

**Process**:
1. Column Selection: User checks checkbox for column (e.g., "age")
2. Metadata Lookup: Frontend retrieves data type from column metadata
3. Category Mapping: Frontend maps SQL type to category (int→numeric, varchar→string, date→date)
4. PII Filtering: Frontend returns only PII attributes matching the category
5. UI Rendering: Dropdown shows only compatible options

**Benefits**: Prevents configuration errors at design time, improves user experience, ensures type compatibility, maintains data integrity.

---

## 6. TECHNOLOGY STACK

### 6.1 Technology Architecture

```
TECHNOLOGY LAYERS

┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
├─────────────────────────────────────────────────────────┤
│  React 18.3.1           Material-UI v5                  │
│  JavaScript Library     UI Component Library            │
│  • Virtual DOM          • Pre-built components          │
│  • Component-based      • Material Design               │
│  • Hooks for state      • Responsive layouts            │
│                                                         │
│  React Router v6        Axios                           │
│  Client Routing         HTTP Client                     │
│  • SPA navigation       • Promise-based                 │
│  • No page reloads      • Request/response interceptors │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
├─────────────────────────────────────────────────────────┤
│  FastAPI (Python)       Pydantic                        │
│  Web Framework          Data Validation                 │
│  • High performance     • Type checking                 │
│  • Auto OpenAPI docs    • Request validation            │
│  • Async support        • Schema generation             │
│                                                         │
│  PyJWT                  pyodbc                          │
│  Authentication         Database Driver                 │
│  • Token generation     • SQL Server connection         │
│  • Token validation     • ODBC protocol                 │
│                                                         │
│  Uvicorn               Gunicorn (Production)            │
│  ASGI Server           Process Manager                  │
│  • Async handling      • Multi-worker                   │
│  • Fast I/O            • Auto-restart                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                         │
├─────────────────────────────────────────────────────────┤
│  Microsoft SQL Server 2016+                             │
│  • ACID transactions    • Query optimization            │
│  • Referential integrity• Indexes for performance       │
│  • Constraint enforcement                               │
│  • Backup and recovery  • High availability (Always-On) │
│                                                         │
│  ODBC Driver 17 for SQL Server                          │
│  • Native SQL Server protocol                           │
│  • SSL/TLS encryption   • Connection pooling            │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Technology Selection Rationale

#### **Frontend Technologies**

**React 18.3.1**
- **Why Chosen**: Industry-standard JavaScript library for building user interfaces
- **Benefits**: Component reusability, virtual DOM for fast updates, large ecosystem, strong community support, hooks simplify state management
- **Use Cases**: Interactive forms, managing complex UI state, real-time updates

**Material-UI (MUI) v5**
- **Why Chosen**: Comprehensive React component library implementing Material Design
- **Benefits**: Professional consistent UI, responsive components, accessible WCAG-compliant, customizable theming, pre-built complex components
- **Use Cases**: Data tables, multi-step wizard, dialogs, navigation components

**React Router v6**
- **Why Chosen**: Standard routing library for React SPAs
- **Benefits**: Client-side navigation without page reloads, dynamic route parameters, route protection, nested routing
- **Use Cases**: Protecting routes, dynamic workflow detail pages, multi-step navigation

**Axios**
- **Why Chosen**: Popular promise-based HTTP client
- **Benefits**: Request/response interceptors, automatic JSON transformation, error handling, better API than fetch()
- **Use Cases**: All API communication, automatic JWT injection, global error handling

#### **Backend Technologies**

**FastAPI (Python)**
- **Why Chosen**: Modern, high-performance Python web framework
- **Benefits**: Automatic OpenAPI documentation, type hints, async support, fast performance, built-in validation, Python ecosystem
- **Use Cases**: REST API endpoints, PII masking algorithms, workflow execution engine

**Pydantic**
- **Why Chosen**: Data validation using Python type annotations
- **Benefits**: Automatic request validation, clear error messages, schema generation, type safety
- **Use Cases**: Validate workflow payloads, ensure correct data types, generate API docs

**PyJWT**
- **Why Chosen**: Industry-standard JWT implementation
- **Benefits**: Stateless authentication, cryptographically signed tokens, configurable expiration, cross-domain compatible
- **Use Cases**: Generate JWT tokens on login, validate tokens on requests, extract user information

**pyodbc**
- **Why Chosen**: Python database driver for ODBC connections
- **Benefits**: Native SQL Server support, parameterized queries prevent SQL injection, connection pooling, platform independent
- **Use Cases**: Connect to databases, execute queries, schema discovery, masking transformations

#### **Database Technology**

**Microsoft SQL Server 2016+**
- **Why Chosen**: Enterprise-grade RDBMS
- **Benefits**: ACID compliance, robust transaction support, advanced query optimizer, rich constraint system, high availability, enterprise support
- **Use Cases**: Store application metadata, audit trail, source databases (production with PII), target databases (masked data)

---

## 7. DATABASE DESIGN

### 7.1 Entity Relationship Diagram

```
APPLICATION DATABASE ER DIAGRAM

                ┌──────────────────┐
                │      users       │
                ├──────────────────┤
                │ PK  id           │
                │     username     │
                │     password_hash│
                │     email        │
                │     role         │
                │     created_at   │
                └────────┬─────────┘
                         │
                         │ 1:N (creates)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ connections  │  │  workflows   │  │  executions  │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ PK  id       │  │ PK  id       │  │ PK  id       │
│     name     │◄─┤ FK  source_  │  │ FK  workflow_│
│     type     │  │     conn_id  │  │     id       │
│     server   │  │ FK  target_  │  │     status   │
│     database │  │     conn_id  │──┤     rows_    │
│     username │  │     status   │  │     processed│
│     password │  │ FK  created_ │  │     rows_    │
│ FK  created_ │  │     by       │  │     masked   │
│     by       │  │     created_ │  │     error_   │
│     created_ │  │     at       │  │     message  │
│     at       │  └──────┬───────┘  │     started_ │
└──────────────┘         │          │     at       │
                         │ 1:N      │     completed│
                         │          │     _at      │
                         ▼          │ FK  executed_│
              ┌──────────────────┐  │     by       │
              │ workflow_mappings│  └──────────────┘
              ├──────────────────┤
              │ PK  id           │
              │ FK  workflow_id  │
              │     source_      │
              │     schema       │
              │     source_table │
              │     target_      │
              │     schema       │
              │     target_table │
              │     column_      │
              │     mappings     │
              │     (JSON)       │
              │     created_at   │
              └──────────────────┘
```

**Relationship Cardinality:**
- users (1) ───< (N) connections: One user can create multiple database connections
- users (1) ───< (N) workflows: One user can create multiple workflows
- users (1) ───< (N) executions: One user can trigger multiple executions
- connections (1) ───< (N) workflows (as source): One connection can be source for multiple workflows
- connections (1) ───< (N) workflows (as target): One connection can be target for multiple workflows
- workflows (1) ───< (N) workflow_mappings: One workflow can have multiple table mappings
- workflows (1) ───< (N) executions: One workflow can have multiple execution history records

### 7.2 Database Schema Descriptions

#### **Table: users**
**Purpose**: Store user account information for authentication and authorization

**Columns**:
- `id` (PK, INT, Auto-increment): Unique user identifier
- `username` (VARCHAR(50), UNIQUE, NOT NULL): Login username
- `password_hash` (VARCHAR(255), NOT NULL): Bcrypt hashed password (never plaintext)
- `email` (VARCHAR(100), UNIQUE): User email address for notifications
- `role` (VARCHAR(20), NOT NULL, DEFAULT 'user'): Permission level ('admin' or 'user')
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Account creation timestamp

**Constraints**: Username must be unique, role must be either 'admin' or 'user', password hash must use secure hashing (bcrypt with cost factor 12)

**Indexes**: Primary key on id, unique index on username for fast login lookups, unique index on email

---

#### **Table: connections**
**Purpose**: Store database connection configurations for both source and target databases

**Columns**:
- `id` (PK, INT, Auto-increment): Unique connection identifier
- `name` (VARCHAR(100), UNIQUE, NOT NULL): User-friendly connection name
- `connection_type` (VARCHAR(10), NOT NULL): 'source' (read from) or 'target' (write to)
- `server` (VARCHAR(255), NOT NULL): SQL Server hostname or IP address
- `database_name` (VARCHAR(128), NOT NULL): Database name on the server
- `username` (VARCHAR(128), NOT NULL): Database authentication username
- `password` (VARCHAR(255), NOT NULL): Encrypted database password (AES-256)
- `created_by` (FK → users.id, NOT NULL): User who created this connection
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Creation timestamp

**Constraints**: Connection name must be unique, connection type must be 'source' or 'target', foreign key to users table, password encrypted at rest

**Security Notes**: Passwords are encrypted using AES-256 with encryption key stored in environment variables. Passwords never returned in API responses (masked with '******').

---

#### **Table: workflows**
**Purpose**: Store workflow configuration metadata (high-level workflow information)

**Columns**:
- `id` (PK, INT, Auto-increment): Unique workflow identifier
- `name` (VARCHAR(100), UNIQUE, NOT NULL): User-friendly workflow name
- `description` (TEXT): Optional description of workflow purpose
- `status` (VARCHAR(20), NOT NULL, DEFAULT 'active'): 'active' or 'inactive'
- `source_connection_id` (FK → connections.id, NOT NULL): Source database connection
- `target_connection_id` (FK → connections.id, NOT NULL): Target database connection
- `created_by` (FK → users.id, NOT NULL): User who created workflow
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Creation timestamp
- `updated_at` (DATETIME): Last modification timestamp

**Constraints**: Workflow name must be unique, status must be 'active' or 'inactive', source and target connections must be different (CHECK constraint), foreign keys to connections and users tables

**Business Rules**: Only active workflows can be executed, source and target connections cannot be the same database

---

#### **Table: workflow_mappings**
**Purpose**: Store detailed table and column mapping rules for workflows

**Columns**:
- `id` (PK, INT, Auto-increment): Unique mapping identifier
- `workflow_id` (FK → workflows.id, NOT NULL): Parent workflow
- `source_schema` (VARCHAR(128), NOT NULL): Source database schema name (e.g., 'dbo')
- `source_table` (VARCHAR(128), NOT NULL): Source table name
- `target_schema` (VARCHAR(128), NOT NULL): Target database schema name
- `target_table` (VARCHAR(128), NOT NULL): Target table name
- `column_mappings` (NVARCHAR(MAX), NOT NULL): JSON array of column mapping rules
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Creation timestamp

**Constraints**: Foreign key to workflows table with CASCADE DELETE, column_mappings must be valid JSON (CHECK constraint: ISJSON(column_mappings) = 1)

**JSON Structure for column_mappings**:
```json
[
  {
    "source_column": "first_name",
    "pii_attribute": "first_name",
    "target_column": "first_name",
    "data_type": "varchar"
  },
  {
    "source_column": "age",
    "pii_attribute": "random_number",
    "target_column": "age",
    "data_type": "int"
  }
]
```

**Why JSON Column**: Flexible for different numbers of columns across tables, no schema changes needed when adding new PII attributes, easy to query and parse in application code, SQL Server provides native JSON functions.

---

#### **Table: executions**
**Purpose**: Store workflow execution history and audit trail

**Columns**:
- `id` (PK, INT, Auto-increment): Unique execution identifier
- `workflow_id` (FK → workflows.id, NOT NULL): Workflow that was executed
- `status` (VARCHAR(20), NOT NULL, DEFAULT 'running'): 'running', 'success', or 'failed'
- `rows_processed` (INT, DEFAULT 0): Total rows read from source database
- `rows_masked` (INT, DEFAULT 0): Total rows successfully masked and written
- `error_message` (TEXT): Error details if status is 'failed'
- `started_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Execution start time
- `completed_at` (DATETIME): Execution completion time (NULL while running)
- `executed_by` (FK → users.id, NOT NULL): User who triggered execution

**Constraints**: Foreign keys to workflows and users tables with CASCADE DELETE, status must be 'running', 'success', or 'failed', rows_masked cannot exceed rows_processed (CHECK constraint)

**Audit Trail**: Every execution creates a permanent record, complete history preserved even if workflow is modified, user attribution for compliance and accountability, error messages stored for troubleshooting.

---

### 7.3 Data Integrity Rules

**Referential Integrity**: All foreign keys enforced at database level. Prevents orphaned records (e.g., execution without workflow). Cascade delete for dependent data (mappings, executions).

**Constraint Validation**: NOT NULL constraints ensure required data is always present. UNIQUE constraints prevent duplicate names/usernames. CHECK constraints validate enum values (status, role, connection_type). CHECK constraints ensure logical consistency (e.g., rows_masked ≤ rows_processed).

**Data Quality Rules**: Passwords must be hashed before storage. Connection credentials encrypted at rest. JSON columns validated for correct structure. Timestamps automatically managed by database.

---

## 8. SECURITY ARCHITECTURE

### 8.1 Security Layers Overview

```
SECURITY ARCHITECTURE (Defense in Depth)

Layer 7: Physical Security
├─ Data center access controls
├─ Server room security
└─ Hardware security modules (HSM)
        ↓
Layer 6: Network Security
├─ Firewall rules (restrict database ports)
├─ VPN requirement for remote access
├─ Network segmentation (DMZ for web tier)
└─ DDoS protection
        ↓
Layer 5: Transport Security
├─ HTTPS/TLS 1.3 for all web traffic
├─ SSL/TLS for database connections
├─ Certificate validation
└─ Strong cipher suites only
        ↓
Layer 4: Application Authentication
├─ JWT token-based authentication
├─ Token expiration (24 hours)
├─ Automatic logout on expiration
├─ Password hashing (bcrypt, cost factor 12)
└─ No plaintext passwords stored or transmitted
        ↓
Layer 3: Authorization (RBAC)
├─ Role-based access control (Admin/User)
├─ Resource ownership validation
├─ Permission checks on every API endpoint
└─ Principle of least privilege
        ↓
Layer 2: Data Protection
├─ Database credentials encrypted at rest (AES-256)
├─ PII data masked during transformation
├─ No sensitive data in logs
└─ Encrypted backups
        ↓
Layer 1: Application Security
├─ SQL injection prevention (parameterized queries)
├─ XSS protection (input sanitization)
├─ CSRF protection (SameSite cookies)
├─ Input validation on all endpoints
├─ Output encoding
└─ Security headers (CSP, X-Frame-Options)
        ↓
Layer 0: Audit & Monitoring
├─ Complete audit trail (who, what, when)
├─ Failed login attempt logging
├─ Security event monitoring
├─ Alerting on suspicious activity
└─ Compliance reporting
```

### 8.2 Authentication Architecture

```
JWT TOKEN AUTHENTICATION FLOW

User Credentials
      │
      ├─ Username: Plain text
      └─ Password: Plain text
      │
      ▼
HTTPS Transport (Encrypted in flight)
      │
      ▼
Backend Receives Login Request
      │
      ▼
Query users table WHERE username = ?
      │
      ▼
Compare Password Hash
bcrypt.compare(input_password, stored_hash)
      │
      ├─ MATCH ──────────────────────┐
      │                               │
      ▼                               ▼
Generate JWT Token            Return 401 Unauthorized
      │
      ├─ Header: {"alg": "HS256", "typ": "JWT"}
      ├─ Payload: {user_id, username, role, exp}
      └─ Signature: HMACSHA256(header + payload, SECRET_KEY)
      │
      ▼
Return Token to Frontend
      │
      ▼
Frontend Stores in localStorage
      │
      ▼
All Subsequent Requests Include:
Authorization: Bearer <JWT_TOKEN>
      │
      ▼
Backend JWT Middleware:
1. Extract token
2. Verify signature
3. Check expiration
4. Decode payload
5. Extract user context
      │
      ├─ VALID ──> Process Request
      └─ INVALID ─> Return 401
```

### 8.3 Authentication Security Features

**Password Security:**
- Passwords hashed using bcrypt with salt (cost factor: 12 rounds)
- Never stored in plaintext
- Never transmitted except during initial login (over HTTPS)
- Password requirements: Minimum 8 characters (configurable)

**Token Security:**
- JWT signed with HMAC-SHA256 algorithm
- Secret key stored in environment variables (never in code)
- Different secret keys for dev/staging/production
- Token expiration enforced (24-hour default)
- Automatic logout on token expiration
- Token includes user role for authorization

**Session Management:**
- Stateless authentication (no server-side sessions)
- Token revocation via expiration
- Frontend clears token on logout
- Expired tokens automatically rejected by backend

### 8.4 Authorization (RBAC) Architecture

```
ROLE-BASED ACCESS CONTROL (RBAC) MODEL

                ┌──────────────┐
                │    Users     │
                └──────┬───────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
     ┌────────────┐        ┌────────────┐
     │ Admin Role │        │ User Role  │
     └─────┬──────┘        └─────┬──────┘
           │                     │
           ▼                     ▼
    All Permissions       Own Resources Only

PERMISSION MATRIX:

Resource / Action         | Admin | User | Guest
─────────────────────────┼───────┼──────┼───────
Login / Logout            │   ✓   │  ✓   │   ✓
View own profile          │   ✓   │  ✓   │   ✗
                          │       │      │
CONNECTIONS:              │       │      │
View all connections      │   ✓   │  ✓   │   ✗
Create connection         │   ✓   │  ✓   │   ✗
Edit own connection       │   ✓   │  ✓   │   ✗
Edit others' connection   │   ✓   │  ✗   │   ✗
Delete own connection     │   ✓   │  ✓   │   ✗
Delete others' connection │   ✓   │  ✗   │   ✗
Test connection           │   ✓   │  ✓   │   ✗
                          │       │      │
WORKFLOWS:                │       │      │
View all workflows        │   ✓   │  ✓   │   ✗
Create workflow           │   ✓   │  ✓   │   ✗
Edit own workflow         │   ✓   │  ✓   │   ✗
Edit others' workflow     │   ✓   │  ✗   │   ✗
Delete own workflow       │   ✓   │  ✓   │   ✗
Delete others' workflow   │   ✓   │  ✗   │   ✗
Execute own workflow      │   ✓   │  ✓   │   ✗
Execute others' workflow  │   ✓   │  ✗   │   ✗
                          │       │      │
EXECUTIONS:               │       │      │
View all execution history│   ✓   │  ✗   │   ✗
View own execution history│   ✓   │  ✓   │   ✗
                          │       │      │
SYSTEM:                   │       │      │
View system logs          │   ✓   │  ✗   │   ✗
Manage users              │   ✓   │  ✗   │   ✗
Change system settings    │   ✓   │  ✗   │   ✗
View audit trail          │   ✓   │  ✗   │   ✗
```

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

### 8.6 Application Security Measures

**SQL Injection Prevention**: All database queries use parameterized statements. User input never concatenated into SQL strings. ORM/query builder enforces parameterization. Database permissions follow least privilege principle.

**Cross-Site Scripting (XSS) Prevention**: React automatically escapes output (prevents XSS by default). User input sanitized before storage. Content Security Policy (CSP) headers. No use of dangerous functions (dangerouslySetInnerHTML).

**Cross-Site Request Forgery (CSRF) Prevention**: SameSite cookie attribute set to Strict. JWT tokens in Authorization header (not cookies). State-changing operations require valid JWT. No GET requests for state changes.

**Input Validation**: Frontend validation for user experience. Backend validation for security (never trust client). Type checking with Pydantic models. Length limits on all text fields. Whitelist validation for enums.

**Security Headers**: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block, Strict-Transport-Security: max-age=31536000, Content-Security-Policy: default-src 'self'.

### 8.7 Audit Trail

```
AUDIT TRAIL SYSTEM

Every User Action Logged:

┌──────────────────────────────────────────────────────┐
│ AUDIT LOG ENTRY                                      │
├──────────────────────────────────────────────────────┤
│ • Timestamp: 2025-01-15 14:30:45.123                │
│ • User ID: 123                                       │
│ • Username: john.doe                                 │
│ • Role: user                                         │
│ • Action: EXECUTE_WORKFLOW                           │
│ • Resource: workflow_id=456                          │
│ • IP Address: 192.168.1.100                          │
│ • User Agent: Chrome/120.0 Windows                   │
│ • Status: SUCCESS                                    │
│ • Details: Processed 1000 rows, masked 1000 rows    │
│ • Duration: 150 seconds                              │
└──────────────────────────────────────────────────────┘

Logged Actions:
✓ Login attempts (success and failure)
✓ Logout events
✓ Connection creation/modification/deletion
✓ Connection test attempts
✓ Workflow creation/modification/deletion
✓ Workflow executions (with full metrics)
✓ Schema/table browsing
✓ Configuration changes
✓ Permission denials (403 errors)
✓ Authentication failures (401 errors)
✓ API errors (500 errors)

Compliance Benefits:
• GDPR Article 30: Records of processing activities
• HIPAA Audit Controls: Complete audit trail
• SOC 2: User access and change logs
• ISO 27001: Security event logging
• PCI DSS: Track and monitor all access to data

Retention Policy:
• Execution logs: 90 days (configurable)
• Security events: 1 year
• Compliance logs: 7 years (if required)
• Regular archival to cold storage
```

---

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

### 9.2 Production Environment

```
PRODUCTION ENVIRONMENT (High Availability)

                    Internet
                       │
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────┐
│         LAYER 1: LOAD BALANCER                   │
│      (Nginx / HAProxy / Cloud LB)                │
├──────────────────────────────────────────────────┤
│ • SSL/TLS termination                            │
│ • Health checks (every 30s)                      │
│ • Request routing: /api/* → Backend              │
│ •                  /* → Frontend                 │
│ • Rate limiting (1000 req/min per IP)            │
│ • DDoS protection                                │
│ • Gzip compression                               │
│ • Security headers                               │
└────────┬─────────────────────────────────────────┘
         │
   ┌─────┴─────┐
   │           │
   ▼           ▼
Frontend    Backend API Cluster
Server
            ┌───────────┐  ┌───────────┐
            │API Server1│  │API Server2│
            │Gunicorn   │  │Gunicorn   │
            │+Uvicorn   │  │+Uvicorn   │
            │4 workers  │  │4 workers  │
            └───────────┘  └───────────┘
                    │
                    │ SQL Queries
                    ▼
         ┌──────────────────────────────┐
         │   DATABASE TIER              │
         │                              │
         │  PRIMARY DATABASE SERVER     │
         │  • Application DB            │
         │  • Always-On Availability    │
         │  • Automatic failover        │
         │  • Full backups: Daily       │
         │  • Transaction log: 15 mins  │
         │                              │
         │  SECONDARY DATABASE (Standby)│
         │  • Synchronized replica      │
         │  • Automatic failover        │
         │                              │
         │  READ REPLICA (Optional)     │
         │  • Asynchronous replication  │
         │  • Read-only queries         │
         │  • Analytics/reporting       │
         └──────────────────────────────┘

MONITORING & LOGGING:
• ELK Stack (Elasticsearch, Logstash, Kibana)
• Prometheus + Grafana
• PagerDuty / Opsgenie alerting
• Uptime monitoring (Pingdom)
• SLA target: 99.9% uptime
```

### 9.3 Deployment Process

```
CI/CD PIPELINE (Continuous Deployment)

Developer → Git Repo → CI/CD Pipeline → Staging → Production

1. Code Changes (Feature/Bug Fix)
2. Commit to Git (feature branch)
3. Create Pull Request
4. Code Review (peer review, architecture review, security scan)
5. Merge to main branch
6. Automated Tests (unit, integration, E2E, security, linting)
   ├─ FAIL → Notify Developer, Stop Pipeline
   └─ PASS → Continue
7. Build Stage
   - Frontend: npm build, optimize assets
   - Backend: install deps, create artifacts
8. Deploy to Staging
   - Identical to production
   - Run smoke tests
   - QA verification
   - Load testing
9. Manual Approval (optional)
   - QA sign-off
   - Product sign-off
10. Deploy to Production
    - Blue-Green Deployment
    - Deploy to "green" environment
    - Run health checks
    - Switch traffic from "blue" to "green"
    - Keep "blue" as rollback option
11. Post-deployment Verification
    - Smoke tests
    - Monitor errors
    - Check metrics
    - Validate uptime
    ├─ SUCCESS → Update docs, notify team
    └─ FAILURE → Automatic rollback, alert on-call engineer
```

**Deployment Strategy:**
- Blue-Green Deployment: Zero-downtime deployments
- Rollback Plan: Previous version kept for quick rollback
- Database Migrations: Run before application deployment with backward compatibility
- Feature Flags: Enable/disable features without redeployment

### 9.4 Environment Configuration Matrix

| Configuration | Development | Staging | Production |
|---------------|-------------|---------|------------|
| **Frontend URL** | localhost:3000 | staging.company.com | pii-tool.company.com |
| **Backend URL** | localhost:8000 | api-staging.company.com | api.company.com |
| **Database** | Local/Dev Server | Staging DB | Production DB Cluster |
| **HTTPS** | No (HTTP) | Yes | Yes (Commercial SSL) |
| **JWT Expiration** | 7 days | 24 hours | 24 hours |
| **Logging Level** | DEBUG | INFO | WARNING |
| **Error Details** | Full stack traces | Limited details | Generic messages only |
| **CORS** | localhost:3000 | staging domain only | production domain only |
| **Rate Limiting** | Disabled | Enabled (lenient) | Enabled (strict) |
| **Backups** | Manual | Daily | Hourly + daily + weekly |
| **Monitoring** | Local only | Basic | Full monitoring + alerts |
| **Workers** | 1 | 2 | 4-8 (auto-scale) |

---

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
│  Connections:                                      │
│  GET    /api/connections                           │
│  POST   /api/connections                           │
│  GET    /api/connections/{id}                      │
│  PUT    /api/connections/{id}                      │
│  DELETE /api/connections/{id}                      │
│  POST   /api/connections/{id}/test                 │
│                                                    │
│  Schema Discovery:                                 │
│  GET    /api/connections/{id}/schemas              │
│  GET    /api/connections/{id}/schemas/{schema}/    │
│         tables                                     │
│  GET    /api/connections/{id}/schemas/{schema}/    │
│         tables/{table}/columns                     │
│                                                    │
│  Workflows:                                        │
│  GET    /api/workflows                             │
│  POST   /api/workflows                             │
│  GET    /api/workflows/{id}                        │
│  PUT    /api/workflows/{id}                        │
│  DELETE /api/workflows/{id}                        │
│  POST   /api/workflows/{id}/execute                │
│                                                    │
│  Executions:                                       │
│  GET    /api/executions                            │
│  GET    /api/executions/{id}                       │
│                                                    │
│  PII Attributes:                                   │
│  GET    /api/pii-attributes                        │
│                                                    │
│  Health Check:                                     │
│  GET    /health                                    │
│  GET    /api/health/db                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 10.2 API Request/Response Format

**Standard Request Format:**
```
Method: POST
URL: https://api.company.com/api/workflows
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  Accept: application/json

Body (JSON):
{
  "name": "Mask Employee Data",
  "description": "Mask PII in employee table",
  "source_connection_id": 1,
  "target_connection_id": 2,
  "status": "active",
  "mappings": [
    {
      "source_schema": "dbo",
      "source_table": "employees",
      "target_schema": "dbo",
      "target_table": "masked_employees",
      "column_mappings": [
        {
          "source_column": "first_name",
          "pii_attribute": "first_name",
          "target_column": "first_name"
        }
      ]
    }
  ]
}
```

**Standard Response Format (Success):**
```
Status: 201 Created
Headers:
  Content-Type: application/json

Body (JSON):
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Mask Employee Data",
    "description": "Mask PII in employee table",
    "status": "active",
    "created_at": "2025-01-15T14:30:00Z"
  },
  "message": "Workflow created successfully"
}
```

**Standard Response Format (Error):**
```
Status: 400 Bad Request
Headers:
  Content-Type: application/json

Body (JSON):
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workflow configuration",
    "details": [
      {
        "field": "source_connection_id",
        "issue": "Connection with ID 1 does not exist"
      }
    ]
  }
}
```

### 10.3 Integration with External Systems (Future)

**Potential Integrations:**

**CI/CD Pipelines:**
- Trigger workflow execution as part of deployment
- Mask test data before running integration tests
- API endpoint: POST /api/workflows/{id}/execute

**Data Warehouse ETL:**
- Mask PII before loading into data warehouse
- Schedule recurring executions via API
- Monitor execution status programmatically

**Compliance Tools:**
- Export audit logs for compliance reporting
- Provide API for SIEM (Security Information and Event Management)
- Data lineage tracking

**Monitoring Systems:**
- Health check endpoints for uptime monitoring
- Metrics API for dashboard integration
- Alert webhook for execution failures

---

## DOCUMENT END

This technical architecture document provides a comprehensive overview of the PII Masking Tool system design, focusing on:

• **3-tier architecture** with clear separation of concerns
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

**Document Version:** 1.0
**Last Updated:** January 2025
**Author:** Technical Architecture Team
