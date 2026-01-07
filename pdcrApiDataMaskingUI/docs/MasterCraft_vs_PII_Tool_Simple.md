# MasterCraft vs PII Masking Tool - Quick Comparison

---

## Overview

| Tool | Purpose |
|------|---------|
| **MasterCraft** | Copy masked production data to non-production database (ETL) |
| **PII Masking Tool** | Mask sensitive data in-place within the same database |

---

## MasterCraft Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MASTERCRAFT FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │     1.       │     │     2.       │     │     3.       │     │     4.       │
    │   SCHEMA     │────▶│   BACKUP     │────▶│   MASKING    │────▶│    DATA      │
    │    SYNC      │     │   EXTRACT    │     │  TRANSFORM   │     │    LOAD      │
    └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ • Fetch      │     │ • Extract    │     │ • Email DBA  │     │ • Email DBA  │
    │   schema     │     │   data       │     │ • Disable    │     │ • Load .dat  │
    │ • Compare    │     │ • Create     │     │   constraints│     │   to target  │
    │ • Update     │     │   .dat files │     │ • Apply mask │     │ • Enable     │
    │   metadata   │     │ • Store on   │     │ • Store      │     │   constraints│
    │              │     │   server     │     │   masked.dat │     │ • Validate   │
    └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘

    ┌──────────────┐                                              ┌──────────────┐
    │  PROD DB     │ ─────────── .dat files ──────────────────▶   │  NON-PROD DB │
    │  (Source)    │              (Server)                        │  (Target)    │
    └──────────────┘                                              └──────────────┘
```

---

## PII Masking Tool Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PII MASKING TOOL FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │     1.       │     │     2.       │     │     3.       │     │     4.       │
    │ CONNECTION   │────▶│  WORKFLOW    │────▶│  WORKFLOW    │────▶│  EXECUTION   │
    │ MANAGEMENT   │     │  CREATION    │     │  EXECUTION   │     │  MONITORING  │
    └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ • Add DB     │     │ • Select     │     │ • Validate   │     │ • View       │
    │ • Test       │     │   table      │     │ • Execute    │     │   status     │
    │ • Get schema │     │ • Map PII    │     │   UPDATE     │     │ • Pause/     │
    │              │     │   columns    │     │ • Track      │     │   Resume/    │
    │              │     │ • Set filter │     │   progress   │     │   Stop       │
    └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘

                              ┌─────────────────────┐
                              │   SINGLE DATABASE   │
                              │   (In-Place UPDATE) │
                              │                     │
                              │  Original → Masked  │
                              └─────────────────────┘
```

---

## Architecture Comparison

```
MASTERCRAFT:                          PII MASKING TOOL:

┌──────────┐                          ┌─────────────────────┐
│ PROD DB  │                          │   SINGLE DATABASE   │
│ (Source) │                          │                     │
└────┬─────┘                          │  ┌───────────────┐  │
     │                                │  │ Original Data │  │
     ▼                                │  └───────┬───────┘  │
┌──────────┐                          │          │          │
│ .dat     │ ← Extract                │          ▼          │
│ Files    │                          │  ┌───────────────┐  │
└────┬─────┘                          │  │   IN-PLACE    │  │
     │                                │  │   UPDATE      │  │
     ▼                                │  └───────┬───────┘  │
┌──────────┐                          │          │          │
│ Masked   │ ← Apply Masking          │          ▼          │
│ .dat     │                          │  ┌───────────────┐  │
└────┬─────┘                          │  │ Masked Data   │  │
     │                                │  └───────────────┘  │
     ▼                                │                     │
┌──────────┐                          └─────────────────────┘
│ NON-PROD │ ← Load
│ (Target) │                          ✅ No data movement
└──────────┘                          ✅ No file storage
```

---

## Job Comparison

### MasterCraft - 4 Jobs (Sequential)

| Job | Name | Purpose |
|-----|------|---------|
| 1 | Schema Sync | Fetch and synchronize schema metadata |
| 2 | Backup | Extract data to .dat files |
| 3 | Masking | Apply masking rules, store masked .dat files |
| 4 | Data Load | Load masked data to non-production DB |

### PII Masking Tool - 4 Operations (Single Workflow)

| Step | Name | Purpose |
|------|------|---------|
| 1 | Connection Management | Establish and test database connection |
| 2 | Workflow Creation | Select table, map PII columns, set filters |
| 3 | Workflow Execution | Run UPDATE statements with masking |
| 4 | Execution Monitoring | Track status, pause/resume/stop |

---

## Key Differences

| Aspect | MasterCraft | PII Masking Tool |
|--------|-------------|------------------|
| **Data Flow** | Source → Files → Target | Same DB (in-place) |
| **File Storage** | Required (.dat files) | Not required |
| **DBA Approval** | Required (email) | Not required |
| **Execution Control** | Start only | Start/Pause/Resume/Stop |
| **Batch Processing** | Manual setup | Automatic |
| **Constraints** | Disable/Enable manually | Auto-validated |

---

## When to Use

| Use Case | Recommended Tool |
|----------|------------------|
| Copy production to non-prod | MasterCraft |
| GDPR/CCPA/HIPAA compliance | PII Masking Tool |
| Need .dat file backups | MasterCraft |
| Quick PII sanitization | PII Masking Tool |
| No DBA available | PII Masking Tool |
| Need pause/resume | PII Masking Tool |
