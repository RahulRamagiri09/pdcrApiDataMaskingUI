# MasterCraft vs PII Masking Tool

## Comprehensive Comparison Document

---

# PART 1: MASTERCRAFT

## What is MasterCraft?

MasterCraft is an **enterprise data replication platform** that copies production data to non-production environments while applying data masking. It uses a **4-job sequential pipeline** to move, transform, and load data between different database environments.

### Core Purpose

> **"Copy masked production data from source database to a separate non-production database"**

### Key Characteristics

- **Data Movement**: Copies data from one database to another
- **File-Based**: Creates intermediate .dat files on server
- **Sequential Jobs**: 4 jobs must run in order
- **Manual Intervention**: Requires DBA approval via email
- **Environment Sync**: Keeps non-prod in sync with production

---

## MasterCraft Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                              MASTERCRAFT WORKFLOW                                  ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌─────────────────┐                                                             ║
║   │  PRODUCTION DB  │ ◄─── Source Database (Live Data)                            ║
║   │   (SOURCE)      │                                                             ║
║   └────────┬────────┘                                                             ║
║            │                                                                       ║
║            ▼                                                                       ║
║   ╔════════════════════════════════════════════════════════════════════════════╗  ║
║   ║                          4-JOB PIPELINE                                     ║  ║
║   ╠════════════════════════════════════════════════════════════════════════════╣  ║
║   ║                                                                             ║  ║
║   ║   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  ║  ║
║   ║   │    JOB 1     │   │    JOB 2     │   │    JOB 3     │   │   JOB 4    │  ║  ║
║   ║   │   SCHEMA     │──▶│   BACKUP     │──▶│   MASKING    │──▶│   LOAD     │  ║  ║
║   ║   │   SYNC       │   │   EXTRACT    │   │   TRANSFORM  │   │   DATA     │  ║  ║
║   ║   └──────────────┘   └──────────────┘   └──────────────┘   └────────────┘  ║  ║
║   ║         │                   │                  │                  │         ║  ║
║   ║         ▼                   ▼                  ▼                  ▼         ║  ║
║   ║   ┌──────────┐        ┌──────────┐       ┌──────────┐       ┌──────────┐   ║  ║
║   ║   │ Schema   │        │ .dat     │       │ Masked   │       │ Load to  │   ║  ║
║   ║   │ Metadata │        │ Files    │       │ .dat     │       │ Non-Prod │   ║  ║
║   ║   └──────────┘        └──────────┘       │ Files    │       └──────────┘   ║  ║
║   ║                              │            └──────────┘             │         ║  ║
║   ║                              │                  │                  │         ║  ║
║   ║                              ▼                  ▼                  │         ║  ║
║   ║                       ┌─────────────────────────────┐              │         ║  ║
║   ║                       │      FILE SERVER            │              │         ║  ║
║   ║                       │   (Stores .dat files)       │──────────────┘         ║  ║
║   ║                       └─────────────────────────────┘                        ║  ║
║   ║                                                                             ║  ║
║   ╚════════════════════════════════════════════════════════════════════════════╝  ║
║            │                                                                       ║
║            ▼                                                                       ║
║   ┌─────────────────┐                                                             ║
║   │ NON-PRODUCTION  │ ◄─── Target Database (Masked Data)                          ║
║   │   DB (TARGET)   │                                                             ║
║   └─────────────────┘                                                             ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## MasterCraft Job Flow - Detailed Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           MASTERCRAFT - JOB FLOW DETAIL                            ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                              JOB 1: SCHEMA SYNC                              │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐          │  ║
║  │   │ Fetch    │────▶│ Compare  │────▶│ Update   │────▶│ Store    │          │  ║
║  │   │ Source   │     │ Schemas  │     │ Target   │     │ Metadata │          │  ║
║  │   │ Schema   │     │          │     │ Schema   │     │          │          │  ║
║  │   └──────────┘     └──────────┘     └──────────┘     └──────────┘          │  ║
║  │                                                                              │  ║
║  │   Purpose: Ensure source and target databases have matching schema           │  ║
║  │   Output: Schema synchronized, Project ID created                            │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                              JOB 2: BACKUP                                   │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐                            │  ║
║  │   │ Extract  │────▶│ Convert  │────▶│ Store    │                            │  ║
║  │   │ Data     │     │ to .dat  │     │ on       │                            │  ║
║  │   │ from DB  │     │ Format   │     │ Server   │                            │  ║
║  │   └──────────┘     └──────────┘     └──────────┘                            │  ║
║  │                                                                              │  ║
║  │   Purpose: Create backup of source data in portable format                   │  ║
║  │   Output: .dat backup files stored on file server                            │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                              JOB 3: MASKING                                  │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐          │  ║
║  │   │ Create   │────▶│ ⚠️ EMAIL │────▶│ Apply    │────▶│ Store    │          │  ║
║  │   │ Project  │     │ TO DBA   │     │ Masking  │     │ Masked   │          │  ║
║  │   │ ID       │     │ (WAIT)   │     │ Rules    │     │ .dat     │          │  ║
║  │   └──────────┘     └──────────┘     └──────────┘     └──────────┘          │  ║
║  │                          │                                                   │  ║
║  │                          ▼                                                   │  ║
║  │                    ┌───────────┐                                             │  ║
║  │                    │ MANUAL    │ ◄─── DBA must respond to disable            │  ║
║  │                    │ APPROVAL  │      constraints before masking             │  ║
║  │                    │ REQUIRED  │                                             │  ║
║  │                    └───────────┘                                             │  ║
║  │                                                                              │  ║
║  │   Purpose: Apply masking rules to sensitive data                             │  ║
║  │   Output: Masked .dat files stored on server                                 │  ║
║  │   ⚠️ BOTTLENECK: Requires DBA email approval                                 │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                         │                                          ║
║                                         ▼                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐  ║
║  │                              JOB 4: LOAD DATA                                │  ║
║  ├─────────────────────────────────────────────────────────────────────────────┤  ║
║  │                                                                              │  ║
║  │   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐          │  ║
║  │   │ ⚠️ EMAIL │────▶│ Connect  │────▶│ Load     │────▶│ Validate │          │  ║
║  │   │ TO DBA   │     │ to       │     │ .dat to  │     │ & Enable │          │  ║
║  │   │ (WAIT)   │     │ Non-Prod │     │ Tables   │     │ Constr.  │          │  ║
║  │   └──────────┘     └──────────┘     └──────────┘     └──────────┘          │  ║
║  │        │                                                    │                │  ║
║  │        ▼                                                    ▼                │  ║
║  │  ┌───────────┐                                       ┌───────────┐          │  ║
║  │  │ MANUAL    │                                       │ ISSUES?   │          │  ║
║  │  │ APPROVAL  │                                       └─────┬─────┘          │  ║
║  │  │ REQUIRED  │                                             │                │  ║
║  │  └───────────┘                                     YES ◄───┴───▶ NO         │  ║
║  │                                                     │             │          │  ║
║  │                                                     ▼             ▼          │  ║
║  │                                              ┌──────────┐  ┌──────────┐     │  ║
║  │                                              │ Notify   │  │ Success! │     │  ║
║  │                                              │ DBA for  │  │ Job      │     │  ║
║  │                                              │ Manual   │  │ Complete │     │  ║
║  │                                              │ Fix      │  └──────────┘     │  ║
║  │                                              └──────────┘                    │  ║
║  │                                                                              │  ║
║  │   Purpose: Load masked data into non-production database                     │  ║
║  │   Output: Non-prod database populated with masked data                       │  ║
║  │   ⚠️ BOTTLENECK: Requires DBA email approval + manual issue resolution       │  ║
║  │                                                                              │  ║
║  └─────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## MasterCraft - Large Volume Handling

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                    MASTERCRAFT - LARGE DATA VOLUME HANDLING                        ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   When large data volume is detected, MasterCraft uses a PARALLEL SUBSET flow:    ║
║                                                                                    ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                          LARGE VOLUME DETECTED                             │   ║
║   └───────────────────────────────────┬───────────────────────────────────────┘   ║
║                                       │                                            ║
║                                       ▼                                            ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                         ENABLE BATCH SETUP                                 │   ║
║   │                   (Manual configuration required)                          │   ║
║   └───────────────────────────────────┬───────────────────────────────────────┘   ║
║                                       │                                            ║
║                                       ▼                                            ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                      SPLIT RECORDS INTO BATCHES                            │   ║
║   │                                                                            │   ║
║   │    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │   ║
║   │    │ Batch 1 │  │ Batch 2 │  │ Batch 3 │  │ Batch 4 │  │ Batch N │       │   ║
║   │    └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │   ║
║   │                                                                            │   ║
║   └───────────────────────────────────┬───────────────────────────────────────┘   ║
║                                       │                                            ║
║                                       ▼                                            ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                        CREATE SUBSET JOBS                                  │   ║
║   │               (Each batch becomes a separate subset job)                   │   ║
║   └───────────────────────────────────┬───────────────────────────────────────┘   ║
║                                       │                                            ║
║                                       ▼                                            ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                    LOAD → MASK → LOAD (Per Subset)                         │   ║
║   │                                                                            │   ║
║   │   For each subset:                                                         │   ║
║   │   1. Load subset data from batch files                                     │   ║
║   │   2. Apply masking rules to subset                                         │   ║
║   │   3. Load masked subset data to non-prod                                   │   ║
║   │                                                                            │   ║
║   └───────────────────────────────────┬───────────────────────────────────────┘   ║
║                                       │                                            ║
║                                       ▼                                            ║
║   ┌───────────────────────────────────────────────────────────────────────────┐   ║
║   │                             COMPLETE                                       │   ║
║   └───────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                    ║
║   ⚠️ Note: Batch setup in MasterCraft requires MANUAL configuration               ║
║      and creates separate subset jobs for each batch                              ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## MasterCraft Summary

| Aspect                      | Description                                    |
| --------------------------- | ---------------------------------------------- |
| **Type**              | Data replication & migration platform          |
| **Data Flow**         | Source DB → .dat files → Target DB           |
| **Jobs Required**     | 4 sequential jobs                              |
| **DBA Dependency**    | Required (email approval for constraints)      |
| **Execution Control** | Start only (no pause/resume)                   |
| **Storage Required**  | Yes (.dat files on server)                     |
| **Best For**          | Full database refresh to non-prod environments |

---

# PART 2: PII MASKING TOOL

## What is PII Masking Tool?

PII Masking Tool is a **specialized data privacy platform** designed for **in-place masking** of Personally Identifiable Information (PII) directly within databases. It transforms sensitive data without moving it to another location.

### Core Purpose

> **"Fast, secure, in-place PII masking with zero data movement for compliance and privacy"**

### Key Characteristics

- **In-Place Masking**: Data stays in the same database
- **No File Storage**: Direct database updates, no .dat files
- **Single Workflow**: One workflow executes masking
- **Fully Automated**: No DBA email approvals needed
- **Batch Execution**: Built-in batch processing with pause/resume

---

```

```

PII Masking Tool Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           PII MASKING TOOL WORKFLOW                                ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                           SINGLE DATABASE                                    │ ║
║   │                     (Data Never Leaves This Location)                        │ ║
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

## PII Masking Tool - Complete Workflow Diagram

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

## PII Masking Tool - Batch Execution System

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                       PII MASKING TOOL - BATCH EXECUTION                           ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                        AUTOMATIC BATCH PROCESSING                            │ ║
║   │                                                                              │ ║
║   │   Total Records: 1,000,000                                                   │ ║
║   │   Batch Size: 10,000 records (configurable)                                  │ ║
║   │   Total Batches: 100                                                         │ ║
║   │                                                                              │ ║
║   └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                         │                                          ║
║                                         ▼                                          ║
║   ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║   │                           BATCH FLOW                                         │ ║
║   │                                                                              │ ║
║   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │ ║
║   │   │ Batch 1 │──▶│ Batch 2 │──▶│ Batch 3 │──▶│  ...    │──▶│Batch 100│      │ ║
║   │   │ 1-10000 │   │ 10001-  │   │ 20001-  │   │         │   │ 990001- │      │ ║
║   │   │         │   │  20000  │   │  30000  │   │         │   │ 1000000 │      │ ║
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

## PII Masking Tool - Execution State Machine

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                         EXECUTION STATE MACHINE                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║                              ┌───────────────┐                                     ║
║                              │    QUEUED     │                                     ║
║                              │  (Waiting)    │                                     ║
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

## PII Masking Tool Summary

| Aspect                      | Description                                   |
| --------------------------- | --------------------------------------------- |
| **Type**              | In-place data masking platform                |
| **Data Flow**         | Same DB → Mask → Same DB (no movement)      |
| **Workflows**         | Single workflow execution                     |
| **DBA Dependency**    | None (fully automated)                        |
| **Execution Control** | Start, Pause, Resume, Stop                    |
| **Storage Required**  | None (no intermediate files)                  |
| **Batch Processing**  | Built-in automatic batching                   |
| **Best For**          | PII compliance, data privacy, GDPR/CCPA/HIPAA |

---

# PART 3: SIDE-BY-SIDE COMPARISON

## Architecture Comparison Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                      ARCHITECTURE COMPARISON                                       ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                    ║
║   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐   ║
║   │          MASTERCRAFT              │   │       PII MASKING TOOL            │   ║
║   ├───────────────────────────────────┤   ├───────────────────────────────────┤   ║
║   │                                   │   │                                   │   ║
║   │   ┌──────────┐                    │   │                                   │   ║
║   │   │ Source   │                    │   │   ┌───────────────────────┐       │   ║
║   │   │ Database │                    │   │   │    SINGLE DATABASE    │       │   ║
║   │   └────┬─────┘                    │   │   │                       │       │   ║
║   │        │                          │   │   │   ┌─────────────┐     │       │   ║
║   │        ▼                          │   │   │   │ Original    │     │       │   ║
║   │   ┌──────────┐                    │   │   │   │ Data        │     │       │   ║
║   │   │  JOB 1   │ Schema Sync        │   │   │   └──────┬──────┘     │       │   ║
║   │   └────┬─────┘                    │   │   │          │            │       │   ║
║   │        │                          │   │   │          ▼            │       │   ║
║   │        ▼                          │   │   │   ┌─────────────┐     │       │   ║
║   │   ┌──────────┐                    │   │   │   │ In-Place    │     │       │   ║
║   │   │  JOB 2   │ Backup to .dat     │   │   │   │ Masking     │     │       │   ║
║   │   └────┬─────┘                    │   │   │   │ Engine      │     │       │   ║
║   │        │                          │   │   │   └──────┬──────┘     │       │   ║
║   │        ▼                          │   │   │          │            │       │   ║
║   │   ┌──────────┐                    │   │   │          ▼            │       │   ║
║   │   │ .dat     │ File Storage       │   │   │   ┌─────────────┐     │       │   ║
║   │   │ Files    │                    │   │   │   │ Masked      │     │       │   ║
║   │   └────┬─────┘                    │   │   │   │ Data        │     │       │   ║
║   │        │                          │   │   │   └─────────────┘     │       │   ║
║   │        ▼                          │   │   │                       │       │   ║
║   │   ┌──────────┐                    │   │   └───────────────────────┘       │   ║
║   │   │  JOB 3   │ Masking            │   │                                   │   ║
║   │   └────┬─────┘                    │   │   ✅ NO file storage              │   ║
║   │        │                          │   │   ✅ NO data movement             │   ║
║   │        ▼                          │   │   ✅ Single workflow              │   ║
║   │   ┌──────────┐                    │   │   ✅ Built-in batch processing    │   ║
║   │   │  JOB 4   │ Load to Target     │   │   ✅ Pause/Resume capability      │   ║
║   │   └────┬─────┘                    │   │                                   │   ║
║   │        │                          │   │                                   │   ║
║   │        ▼                          │   │                                   │   ║
║   │   ┌──────────┐                    │   │                                   │   ║
║   │   │ Target   │                    │   │                                   │   ║
║   │   │ Database │                    │   │                                   │   ║
║   │   └──────────┘                    │   │                                   │   ║
║   │                                   │   │                                   │   ║
║   │   ❌ 4 sequential jobs            │   │                                   │   ║
║   │   ❌ File storage required        │   │                                   │   ║
║   │   ❌ DBA email approvals          │   │                                   │   ║
║   │   ❌ No pause/resume              │   │                                   │   ║
║   │                                   │   │                                   │   ║
║   └───────────────────────────────────┘   └───────────────────────────────────┘   ║
║                                                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Feature Comparison Table

| Feature                         | MasterCraft      | PII Masking Tool                         |
| ------------------------------- | ---------------- | ---------------------------------------- |
| **Data Movement**         | Source → Target | None (In-Place)                          |
| **Jobs Required**         | 4 sequential     | 1 workflow                               |
| **File Storage**          | .dat files       | None required                            |
| **DBA Approval**          | Required (Email) | Not required                             |
| **Batch Processing**      | Manual setup     | Automatic                                |
| **Pause Execution**       | No               | Yes (at batch boundary)                  |
| **Resume Execution**      | No               | Yes (from last batch)                    |
| **Stop Execution**        | Limited          | Yes (immediate)                          |
| **Preview Masking**       | No               | Yes                                      |
| **Constraint Validation** | Post-load        | Pre-execution                            |
| **Smart PII Filtering**   | No               | Yes (by data type)                       |
| **RBAC**                  | Not specified    | 4-tier (Admin/Privilege/General/Support) |
| **Audit Trail**           | Basic            | Comprehensive                            |
| **Execution Progress**    | Job-level        | Batch-level + percentage                 |

---

## Use Case Comparison

### When to Use MasterCraft

- Need full database copy to non-production
- Need schema synchronization between environments
- Need .dat file backups
- Complex multi-table orchestration
- Separate source and target databases

### When to Use PII Masking Tool

- GDPR/CCPA/HIPAA compliance
- Quick PII data sanitization
- In-place masking without data movement
- Need execution control (pause/resume/stop)
- No DBA availability for approvals
- Need preview before execution
- Role-based team access required
- Complete audit trail needed

---

## One-Line Summary

| Tool                       | Definition                                                                       |
| -------------------------- | -------------------------------------------------------------------------------- |
| **MasterCraft**      | "Copy masked production data to non-production through 4-job ETL pipeline"       |
| **PII Masking Tool** | "Fast, secure, in-place PII masking with batch execution and zero data movement" |

---

## Flow Summary

**MasterCraft Flow:**Ticket → Connect → Schema → Backup → Mask → Load

**PII Masking Tool Flow:**

```
Login → Connect → Workflow → Validate → Batch Execute → Complete
                                              ↓
                                    [Pause] [Resume] [Stop]
```

---

## Key Advantages of PII Masking Tool

1. **IN-PLACE MASKING**

   - Data stays in same database, no movement required
2. **AUTOMATIC BATCH EXECUTION**

   - Built-in batching with configurable batch size
   - Each batch committed independently
   - Failed batch rolls back, previous batches preserved
3. **REAL-TIME EXECUTION CONTROL**

   - PAUSE: Stop at batch boundary, resume later
   - RESUME: Continue from last completed batch
   - STOP: Cancel execution immediately
4. **ZERO DBA DEPENDENCY**

   - No email approvals required
   - Automatic constraint validation before execution
5. **SMART PII FILTERING**

   - Shows only valid masking options based on column data type
6. **PREVIEW MASKING**

   - See original vs masked data before execution
7. **COMPREHENSIVE RBAC**

   - 4-tier permission system (Admin/Privilege/General/Support)
8. **COMPLETE AUDIT TRAIL**

   - Full execution history with user attribution

---

*Document prepared for comparison analysis between MasterCraft and PII Masking Tool*
