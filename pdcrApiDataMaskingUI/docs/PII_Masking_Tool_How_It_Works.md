# PII Masking Tool - How It Works

## Overview

The PII Masking Tool performs **in-place data masking** on a single database. Unlike MasterCraft which transfers data between production and non-production environments, this tool masks sensitive data directly within the same database/schema/table using UPDATE operations.

Each operation interacts with the database connection, workflow configuration, and admin team operations to ensure compliance, security, and proper execution.

---

## Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           PII MASKING TOOL WORKFLOW                                ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                              DATABASE                                        │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                             ║
║                                      │                                             ║
║                                      ▼                                             ║
║   ╔═════════════════════════════════════════════════════════════════════════════╗ ║
║   ║                         SINGLE WORKFLOW EXECUTION                            ║ ║
║   ╠═════════════════════════════════════════════════════════════════════════════╣ ║
║   ║                                                                              ║ ║
║   ║                        ┌───────────────────┐                                 ║ ║
║   ║                        │   ORIGINAL DATA   │                                 ║ ║
║   ║                        │                   │                                 ║ ║
║   ║                        │ John Smith        │                                 ║ ║
║   ║                        │ john@email.com    │                                 ║ ║
║   ║                        │ 123-45-6789       │                                 ║ ║
║   ║                        └─────────┬─────────┘                                 ║ ║
║   ║                                  │                                           ║ ║
║   ║                                  ▼                                           ║ ║
║   ║     ┌──────────────────────────────────────────────────────────────────┐    ║ ║
║   ║     │                    IN-PLACE MASKING ENGINE                        │    ║ ║
║   ║     │                                                                   │    ║ ║
║   ║     │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │    ║ ║
║   ║     │  │Validate │──▶│ Batch   │──▶│ Apply   │──▶│ Commit  │          │    ║ ║
║   ║     │  │Constr.  │   │ Process │   │ Masking │   │ Changes │          │    ║ ║
║   ║     │  └─────────┘   └─────────┘   └─────────┘   └─────────┘          │    ║ ║
║   ║     │                                                                   │    ║ ║
║   ║     │  ✅ No files created                                              │    ║ ║
║   ║     │  ✅ No DBA approval needed                                        │    ║ ║
║   ║     │  ✅ Real-time control (pause/resume/stop)                         │    ║ ║
║   ║     │                                                                   │    ║ ║
║   ║     └──────────────────────────────────────────────────────────────────┘    ║ ║
║   ║                                  │                                           ║ ║
║   ║                                  ▼                                           ║ ║
║   ║                        ┌───────────────────┐                                 ║ ║
║   ║                        │   MASKED DATA     │                                 ║ ║
║   ║                        │                   │                                 ║ ║
║   ║                        │ XXXX XXXXX        │                                 ║ ║
║   ║                        │ XXX@XXXXX.com     │                                 ║ ║
║   ║                        │ XXX-XX-XXXX       │                                 ║ ║
║   ║                        └───────────────────┘                                 ║ ║
║   ║                                                                              ║ ║
║   ╚═════════════════════════════════════════════════════════════════════════════╝ ║
║                                      │                                             ║
║                                      │                                             ║
║                                      ▼                                             ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                           SAME DATABASE                                      │ ║
║   │                      (Data Masked In-Place)                                  │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Complete User Journey

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                      PII MASKING TOOL - COMPLETE USER JOURNEY                      ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                         STEP 1: AUTHENTICATION                               │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐                            │  ║
║  │   │ User     │────▶│ Validate │────▶│ JWT      │                            │  ║
║  │   │ Login    │     │ Creds    │     │ Token    │                            │  ║
║  │   └──────────┘     └──────────┘     └──────────┘                            │  ║
║  │                                                                              │  ║
║  │   Features: JWT authentication, Role-based access (Admin/Privilege/General)  │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                       STEP 2: CONNECTION SETUP                               │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐                            │  ║
║  │   │ Add DB   │────▶│ Test     │────▶│ Save     │                            │  ║
║  │   │ Details  │     │ Connect  │     │ Config   │                            │  ║
║  │   └──────────┘     └──────────┘     └──────────┘                            │  ║
║  │                                                                              │  ║
║  │   Supported: Azure SQL, SQL Server, PostgreSQL, Oracle                       │  ║
║  │   Security: Credentials encrypted with AES-256                               │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                    STEP 3: WORKFLOW CREATION (4-Step Wizard)                 │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                │  ║
║  │   │ Step 1   │──▶│ Step 2   │──▶│ Step 3   │──▶│ Step 4   │                │  ║
║  │   │ Basic    │   │ Select   │   │ Map      │   │ Review   │                │  ║
║  │   │ Info     │   │ Table    │   │ Columns  │   │ & Save   │                │  ║
║  │   └──────────┘   └──────────┘   └──────────┘   └──────────┘                │  ║
║  │                                                                              │  ║
║  │   Smart PII Filtering: System shows only valid masking options per data type │  ║
║  │   - String columns → Name, Email, SSN, Phone masking                         │  ║
║  │   - Numeric columns → Credit card, Account number masking                    │  ║
║  │   - Date columns → Date shifting, nullification                              │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                     STEP 4: CONSTRAINT VALIDATION                            │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌───────────────────────────────────────────────────────────────────┐     │  ║
║  │   │                  AUTOMATIC PRE-EXECUTION CHECKS                    │     │  ║
║  │   │                                                                    │     │  ║
║  │   │   ✓ Primary Keys      ✓ Foreign Keys       ✓ Unique Constraints   │     │  ║
║  │   │   ✓ Check Constraints ✓ Triggers           ✓ Indexes              │     │  ║
║  │   │                                                                    │     │  ║
║  │   └───────────────────────────────────────────────────────────────────┘     │  ║
║  │                                                                              │  ║
║  │   ✅ NO DBA EMAIL REQUIRED - All validation happens automatically            │  ║
║  │   ✅ Issues shown in UI before execution - User decides how to proceed       │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                      STEP 5: PREVIEW MASKING (Optional)                      │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌─────────────────────────────────────────────────────────────────────┐   │  ║
║  │   │  Original Data          │  Masked Data                              │   │  ║
║  │   ├─────────────────────────┼───────────────────────────────────────────┤   │  ║
║  │   │  john.doe@company.com   │  XXX@XXXXX.com                            │   │  ║
║  │   │  123-45-6789            │  XXX-XX-XXXX                              │   │  ║
║  │   │  555-123-4567           │  XXX-XXX-XXXX                             │   │  ║
║  │   └─────────────────────────┴───────────────────────────────────────────┘   │  ║
║  │                                                                              │  ║
║  │   Preview shows sample records with original vs masked data                  │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                    STEP 6: BATCH EXECUTION WITH CONTROL                      │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   (See detailed Batch Execution diagram below)                               │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                         STEP 7: AUDIT & LOGGING                              │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐                            │  ║
║  │   │ Execution│────▶│ User     │────▶│ Complete │                            │  ║
║  │   │ History  │     │ Audit    │     │ Logs     │                            │  ║
║  │   └──────────┘     └──────────┘     └──────────┘                            │  ║
║  │                                                                              │  ║
║  │   Full audit trail: Who executed what, when, how many records affected       │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Batch Execution System

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                       PII MASKING TOOL - BATCH EXECUTION                           ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                        AUTOMATIC BATCH PROCESSING                            │ ║
║   │                                                                              │ ║
║   │   Total Records: 1,000,000                                                   │ ║
║   │   Batch Size: 2,000 records (configurable)                                   │ ║
║   │   Total Batches: 500                                                         │ ║
║   │                                                                              │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                         │                                          ║
║                                         ▼                                          ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                           BATCH FLOW                                         │ ║
║   │                                                                              │ ║
║   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │ ║
║   │   │ Batch 1 │──▶│ Batch 2 │──▶│ Batch 3 │──▶│  ...    │──▶│Batch 500│      │ ║
║   │   │ 1-2000  │   │ 2001-   │   │ 4001-   │   │         │   │ 998001- │      │ ║
║   │   │         │   │  4000   │   │  6000   │   │         │   │ 1000000 │      │ ║
║   │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘      │ ║
║   │        │             │             │             │             │            │ ║
║   │        ▼             ▼             ▼             ▼             ▼            │ ║
║   │     COMMIT        COMMIT        COMMIT        COMMIT        COMMIT          │ ║
║   │                                                                              │ ║
║   │   ✅ Each batch committed independently                                      │ ║
║   │   ✅ Failed batch rolls back, previous batches preserved                     │ ║
║   │                                                                              │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                      REAL-TIME PROGRESS DISPLAY                              │ ║
║   │                                                                              │ ║
║   │   ┌───────────────────────────────────────────────────────────────────────┐ │ ║
║   │   │                                                                        │ │ ║
║   │   │   Records Processed: 450,000 / 1,000,000                               │ │ ║
║   │   │   Progress: 45%                                                        │ │ ║
║   │   │   ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │ │ ║
║   │   │                                                                        │ │ ║
║   │   │   Batch: 45 / 100                                                      │ │ ║
║   │   │   Status: Running                                                      │ │ ║
║   │   │   Duration: 00:15:34                                                   │ │ ║
║   │   │                                                                        │ │ ║
║   │   │   [ PAUSE ]    [ STOP ]                                                │ │ ║
║   │   │                                                                        │ │ ║
║   │   └───────────────────────────────────────────────────────────────────────┘ │ ║
║   │                                                                              │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                      EXECUTION CONTROL OPTIONS                               │ ║
║   │                                                                              │ ║
║   │   ┌─────────────────────────────────────────────────────────────────────┐   │ ║
║   │   │                                                                      │   │ ║
║   │   │   [START]  → Begin execution from batch 1                            │   │ ║
║   │   │                                                                      │   │ ║
║   │   │   [PAUSE]  → Complete current batch, then pause                      │   │ ║
║   │   │             "Execution paused successfully at batch 45"              │   │ ║
║   │   │                                                                      │   │ ║
║   │   │   [RESUME] → Continue from next batch after pause point              │   │ ║
║   │   │             "Execution resumed successfully from batch 46"           │   │ ║
║   │   │                                                                      │   │ ║
║   │   │   [STOP]   → Cancel execution immediately                            │   │ ║
║   │   │             "Execution stopped. 45 batches completed."               │   │ ║
║   │   │                                                                      │   │ ║
║   │   └─────────────────────────────────────────────────────────────────────┘   │ ║
║   │                                                                              │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Execution State Machine

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         EXECUTION STATE MACHINE                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║                              ┌───────────────┐                                     ║
║                              │    DRAFT      │                                     ║
║                              │   (Saved)     │                                     ║
║                              └───────┬───────┘                                     ║
║                                      │                                             ║
║                                      │ Start                                       ║
║                                      ▼                                             ║
║                              ┌───────────────┐                                     ║
║               ┌─────────────▶│   RUNNING     │◀─────────────┐                      ║
║               │              │  (Processing) │              │                      ║
║               │              └───────┬───────┘              │                      ║
║               │                      │                      │                      ║
║               │              ┌───────┼───────┐              │                      ║
║               │              │       │       │              │                      ║
║               │          Pause    Complete   Error          │                      ║
║               │              │       │       │              │                      ║
║               │              ▼       │       ▼              │                      ║
║               │      ┌───────────┐   │   ┌───────────┐      │                      ║
║               │      │  PAUSED   │   │   │  FAILED   │      │                      ║
║            Resume    │ (Waiting) │   │   │  (Error)  │      │                      ║
║               │      └─────┬─────┘   │   └───────────┘      │                      ║
║               │            │         │                      │                      ║
║               │        Stop│         │                  Stop│                      ║
║               │            │         │                      │                      ║
║               └────────────┘         │                      │                      ║
║                                      │                      │                      ║
║                                      ▼                      │                      ║
║                              ┌───────────────┐              │                      ║
║                              │  COMPLETED    │              │                      ║
║                              │  (Success)    │              │                      ║
║                              └───────────────┘              │                      ║
║                                                             │                      ║
║                              ┌───────────────┐              │                      ║
║                              │   STOPPED     │◀─────────────┘                      ║
║                              │  (Cancelled)  │                                     ║
║                              └───────────────┘                                     ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 1. Connection Management

### Purpose
Establish and manage database connections for masking operations.

### Process Flow

1. Create a new database connection with:
   - Host/Server address
   - Port number
   - Database name
   - Username and password
   - Database type (PostgreSQL, Azure SQL, Oracle, MySQL, SQL Server)

2. Test the connection to verify connectivity.

3. Once connected, the system can:
   - List all schemas in the database
   - List all tables within a schema
   - Retrieve column information (name, data type, constraints)

4. Connection details are stored securely for use in workflows.

---

## 2. Workflow Creation

### Purpose
Define masking jobs by selecting tables, columns, and PII masking rules.

### Process Flow

1. Enter workflow name and description.

2. Select an existing database connection.

3. Choose target schema and table to mask.

4. Configure column mappings:
   - Mark columns containing PII data
   - Assign PII attribute type (first_name, last_name, email, phone, address, etc.)
   - PII attributes are categorized by data type (string, numeric, date, datetime, boolean)

5. Configure filtering mode (optional):
   - **None**: Mask all rows
   - **Global**: Apply WHERE condition to all rows
   - **Row-Level**: Apply different conditions per PII column

6. Review configuration and create workflow.

7. Workflow is saved and ready for execution.

---

## 3. Workflow Execution

### Purpose
Run the masking job to replace sensitive data with masked values directly in the database.

### Process Flow

#### A. Pre-Execution
1. Verify database connection is active.
2. Validate workflow configuration.
3. Check for constraints that may affect UPDATE operations.
4. Preview masking results (optional) - shows before/after sample data.

#### B. Execution
1. User triggers execution from the Workflow Detail page.
2. Execution ID is generated automatically.
3. Masking logic runs UPDATE statements on PII columns.
4. Filters are applied based on configured WHERE conditions.
5. Progress is tracked (records processed, percentage complete).

#### C. Execution States
- **Queued**: Waiting to start
- **Running**: Actively masking data
- **Paused**: Temporarily stopped (can resume)
- **Stopped**: Cancelled by user
- **Completed**: Successfully finished
- **Failed**: Error occurred

#### D. Error Handling
If errors occur:
- Execution logs are generated
- Error details are captured
- Admin intervention may be required
- Failed records can be identified

---

## 4. Execution Monitoring

### Purpose
Track job status, view logs, and control running executions.

### Process Flow

1. View execution status in real-time:
   - Current state (queued/running/completed/failed)
   - Progress percentage
   - Records processed count
   - Duration

2. Control execution:
   - **Pause**: Stop at current batch boundary
   - **Resume**: Continue from pause point
   - **Stop**: Cancel execution entirely

3. View execution logs for debugging.

4. Access execution history for the workflow.

5. Verify completion status and record counts.

---

## Admin Team Responsibilities

1. Validate database connection establishment.

2. Ensure proper permissions for UPDATE operations.

3. Review and approve workflow configurations.

4. Check constraints (PK, FK, triggers, indexes) before execution.

5. Monitor execution logs for issues.

6. Assist with failed execution resolution.

---

## Execution Parameters

| Parameter | Description |
|-----------|-------------|
| `workflow_id` | ID of the workflow to execute |
| `execution_id` | Auto-generated unique execution identifier |
| `where_mode` | Filter mode: `none`, `global`, or `row` |
| `where_conditions` | Global filter conditions (if where_mode = global) |
| `where_row_conditions` | Per-column filter conditions (if where_mode = row) |
| `pii_attribute` | Type of masking to apply (first_name, email, phone, etc.) |

---

## Key Differences from MasterCraft

| Aspect | MasterCraft | PII Masking Tool |
|--------|-------------|------------------|
| **Operation Type** | Extract → Mask → Load (ETL) | In-place UPDATE |
| **Source/Destination** | Different databases | Same database |
| **Data Format** | Uses .dat/.bat files | Direct SQL operations |
| **Backup** | Creates backup files | No automatic backup |
| **Schema Refresh** | Stores schema as .dat files | Real-time schema discovery |
| **Constraints** | Disable/Enable required | Handled during UPDATE |
