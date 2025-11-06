# Single Server PII Masking Implementation - Complete Summary

## Overview
Successfully implemented a **parallel single-server workflow system** alongside the existing two-server (prod/non-prod) system. This allows in-place PII masking within the same database/schema/table without moving data between servers.

---

## 🎯 Key Features Implemented

### 1. **Separate Database Tables** (4 New Tables)
- `single_server_connections` - Stores single-server database connections
- `single_server_workflows` - Stores workflow configurations
- `single_server_column_mappings` - Stores column-level PII masking rules
- `single_server_executions` - Stores execution history and status

### 2. **Complete Frontend Application**
- 5 New React components with Material-UI (Green theme for visual distinction)
- 3-step simplified workflow creation wizard
- Real-time execution monitoring
- Smart PII attribute filtering based on column data types

### 3. **Backend API Endpoints** (Ready for Implementation)
- 22 new API endpoints for connections, workflows, and executions
- RESTful design following existing patterns
- Support for in-place UPDATE operations

---

## 📁 Files Created/Modified

### **Database**
✅ `database/migrations/create_single_server_tables.sql`
- Complete SQL schema with indexes, constraints, and documentation
- Ready to execute on SQL Server/Azure SQL

### **Frontend - API Layer**
✅ `src/services/api.js` (Modified)
- Added 4 new API objects:
  - `singleServerConnectionsAPI`
  - `singleServerWorkflowsAPI`
  - `singleServerMaskingAPI`
  - `singleServerConstraintsAPI`

### **Frontend - Components**
✅ `src/components/SingleServer/SingleServerConnectionsPage.js`
- Connection list with DataGrid
- Delete functionality
- Green theme styling

✅ `src/components/SingleServer/CreateSingleServerConnectionDialog.js`
- 3-step wizard: Details → Test → Save
- Connection testing before save
- Supports Azure SQL, PostgreSQL, Oracle, SQL Server

✅ `src/components/SingleServer/SingleServerWorkflowsPage.js`
- Workflow list with DataGrid
- View and Delete actions
- Shows schema/table information

✅ `src/components/SingleServer/CreateSingleServerWorkflowPage.js`
- **Step 1:** Basic Info + Connection Selection
- **Step 2:** Schema/Table Selection + Column Mapping
- **Step 3:** Review & Create
- Smart PII attribute filtering by data type
- Preview functionality for masked data

✅ `src/components/SingleServer/SingleServerWorkflowDetailPage.js`
- Overview tab: Workflow details, connection info, column mappings
- Execution History tab: List of executions with status
- Execute workflow button with warning dialog
- View logs functionality
- Stop execution for running jobs

### **Frontend - Navigation**
✅ `src/components/Navbar/Navbar.js` (Modified)
- Added "SS Connections" and "SS Workflows" menu items
- Green color coding to distinguish from two-server system

✅ `src/App.js` (Modified)
- Added 5 new routes:
  - `/single-server/connections`
  - `/single-server/workflows`
  - `/single-server/workflows/create`
  - `/single-server/workflows/:id/edit`
  - `/single-server/workflows/:id`

---

## 🔄 Workflow Comparison

| Feature | Two-Server System | Single-Server System |
|---------|-------------------|---------------------|
| **Connections** | 2 required (source + destination) | 1 required |
| **Schema** | Source + Destination schemas | Single schema |
| **Table** | Source + Destination tables | Single table |
| **Column Mapping** | Source column → Destination column | Column (in-place) |
| **Execution** | SELECT from source, INSERT to destination | UPDATE in same table |
| **Data Movement** | Cross-database/server | In-place masking |
| **Risk** | Safe (no overwrite) | Higher (overwrites original) ⚠️ |
| **Use Case** | Prod → UAT data copy | Mask UAT data in-place |
| **UI Theme** | Blue (#0b2677) | Green (#2e7d32) |

---

## 🎨 UI/UX Design

### **Color Scheme**
- **Primary:** Green (#2e7d32) - Represents single-server system
- **Secondary:** Orange (#ed6c02) - Accent color
- **Navbar:** Green buttons for easy identification

### **Navigation Structure**
```
Navbar:
├── Dashboard (Blue)
├── Connections (Blue) ← Two-Server
├── Workflows (Blue) ← Two-Server
├── SS Connections (Green) ← Single-Server ✨
└── SS Workflows (Green) ← Single-Server ✨
```

### **User Flow**
```
1. Create Connection
   └── Test connection → Save

2. Create Workflow
   └── Basic Info + Connection
   └── Select Schema/Table → Map Columns
   └── Review → Create

3. Execute Workflow
   └── View workflow details
   └── Click "Execute Workflow"
   └── Confirm warning dialog ⚠️
   └── Monitor execution in History tab
   └── View logs
```

---

## ⚙️ Backend Implementation Guide

### **Step 1: Run Database Migration**
```sql
-- Execute the migration script
sqlcmd -S your-server.database.windows.net -d your-database -U username -P password -i create_single_server_tables.sql
```

### **Step 2: Implement API Endpoints**

The following endpoints need to be implemented on the backend:

#### **Connections API** (`/api/single-server/connections`)
```python
# Example structure (adjust for your backend framework)

@router.get("/single-server/connections")
async def get_all_connections():
    # Query single_server_connections table
    pass

@router.post("/single-server/connections")
async def create_connection(data: ConnectionCreate):
    # Insert into single_server_connections
    # Encrypt password using AES-256
    pass

@router.post("/single-server/connections/test")
async def test_connection(data: ConnectionTest):
    # Attempt to connect to database
    # Return success/failure with connection time
    pass

@router.get("/single-server/connections/{id}/schemas")
async def get_schemas(id: int):
    # Query INFORMATION_SCHEMA.SCHEMATA
    pass

@router.get("/single-server/connections/{id}/schemas/{schema}/tables")
async def get_tables(id: int, schema: str):
    # Query INFORMATION_SCHEMA.TABLES
    pass

@router.get("/single-server/connections/{id}/schemas/{schema}/tables/{table}/columns")
async def get_columns(id: int, schema: str, table: str):
    # Query INFORMATION_SCHEMA.COLUMNS
    # Return: column_name, data_type
    pass
```

#### **Workflows API** (`/api/single-server/workflows`)
```python
@router.post("/single-server/workflows")
async def create_workflow(data: WorkflowCreate):
    # 1. Insert into single_server_workflows
    # 2. Insert column_mappings into single_server_column_mappings
    pass

@router.get("/single-server/workflows/{id}")
async def get_workflow(id: int):
    # Join workflow + connection + column_mappings
    # Return complete workflow object
    pass

@router.get("/single-server/workflows/{id}/executions")
async def get_executions(id: int):
    # Query single_server_executions
    # Order by started_at DESC
    pass
```

#### **Execution API** (`/api/single-server/workflows`)
```python
@router.post("/single-server/workflows/{id}/execute")
async def execute_workflow(id: int):
    # 1. Load workflow configuration
    # 2. Create execution record (status='queued')
    # 3. Start async task for in-place UPDATE
    # 4. Return execution_id and task_id
    pass

@router.post("/single-server/workflows/{wf_id}/executions/{exec_id}/stop")
async def stop_execution(wf_id: int, exec_id: str):
    # Cancel async task
    # Update execution status to 'stopped'
    pass
```

### **Step 3: Implement In-Place UPDATE Logic**

**Recommended Approach: Row-by-Row UPDATE with Transaction**

```python
async def execute_single_server_workflow(workflow_id: int, execution_id: str):
    """
    Execute in-place PII masking for single-server workflow
    """
    # 1. Load workflow config
    workflow = load_workflow(workflow_id)
    connection = get_connection(workflow.connection_id)

    # 2. Update execution status to 'running'
    update_execution_status(execution_id, 'running')

    # 3. Connect to database
    conn = connect_to_database(connection)

    try:
        # 4. Get primary key column(s)
        pk_columns = get_primary_keys(connection, workflow.schema_name, workflow.table_name)

        if not pk_columns:
            raise Exception("Table must have a primary key for in-place updates")

        # 5. Count total rows
        total_rows = conn.execute(f"SELECT COUNT(*) FROM {workflow.schema_name}.{workflow.table_name}").fetchone()[0]
        update_execution(execution_id, rows_processed=total_rows)

        # 6. Fetch all rows with primary keys
        rows = conn.execute(f"SELECT {', '.join(pk_columns)} FROM {workflow.schema_name}.{workflow.table_name}").fetchall()

        rows_updated = 0

        # 7. Start transaction
        with conn.begin():
            for row in rows:
                # Build WHERE clause for this row
                where_clause = ' AND '.join([f"{pk}=?" for pk in pk_columns])
                pk_values = [row[pk] for pk in pk_columns]

                # Build SET clause with masked values
                set_clauses = []
                masked_values = []

                for col_mapping in workflow.column_mappings:
                    if col_mapping.is_pii:
                        # Generate masked value based on pii_attribute
                        masked_value = generate_masked_value(col_mapping.pii_attribute, col_mapping.data_type)
                        set_clauses.append(f"{col_mapping.column_name}=?")
                        masked_values.append(masked_value)

                # Execute UPDATE
                update_sql = f"""
                    UPDATE {workflow.schema_name}.{workflow.table_name}
                    SET {', '.join(set_clauses)}
                    WHERE {where_clause}
                """

                conn.execute(update_sql, masked_values + pk_values)
                rows_updated += 1

                # Update progress every 100 rows
                if rows_updated % 100 == 0:
                    progress = int((rows_updated / total_rows) * 100)
                    update_execution(execution_id, rows_updated=rows_updated, progress=progress)

        # 8. Mark as completed
        update_execution_status(execution_id, 'completed', rows_updated=rows_updated, progress=100)

    except Exception as e:
        # Rollback and mark as failed
        update_execution_status(execution_id, 'failed', error_message=str(e))
        raise

    finally:
        conn.close()
```

**Alternative Approach: Staging Table (Safer but Slower)**
```sql
-- 1. Create temp table with masked data
CREATE TABLE #temp_masked AS
SELECT *,
       CASE WHEN is_pii THEN masked_value ELSE original_value END as new_value
FROM schema.table;

-- 2. Truncate original
TRUNCATE TABLE schema.table;

-- 3. Insert from temp
INSERT INTO schema.table SELECT * FROM #temp_masked;

-- 4. Drop temp
DROP TABLE #temp_masked;
```

---

## 🔒 Security Considerations

### **Warnings Implemented**
1. ⚠️ **Execute Dialog:** Warns users that in-place UPDATE cannot be undone
2. ⚠️ **Delete Dialog:** Confirms workflow and execution history deletion
3. ⚠️ **Connection Delete:** Prevents orphaned workflows

### **Recommended Safeguards**
1. **Backup Before Execution:**
   ```sql
   -- Auto-create backup before execution
   SELECT * INTO schema.table_backup_YYYYMMDD_HHMMSS FROM schema.table;
   ```

2. **Dry Run Mode:**
   - Add checkbox in execute dialog: "Dry Run (Preview Only)"
   - Shows what would be masked without actually updating

3. **Row-Level Backup:**
   - Store original values in a separate `masked_values_audit` table
   - Allows rollback if needed

4. **Permission Checks:**
   - Verify user has UPDATE permission on target table
   - Check for triggers that might block updates

---

## 🧪 Testing Checklist

### **Manual Testing Steps**

#### **1. Connection Management**
- [ ] Create new single-server connection
- [ ] Test connection (success case)
- [ ] Test connection (failure case - wrong credentials)
- [ ] View connection in list
- [ ] Delete connection
- [ ] Verify connection appears in workflow dropdown

#### **2. Workflow Creation**
- [ ] Create workflow - Step 1 (Basic Info)
- [ ] Select connection and verify schemas load
- [ ] Select schema and verify tables load
- [ ] Select table and verify columns load
- [ ] Mark columns as PII
- [ ] Verify PII attributes filter by data type
  - [ ] varchar column shows string attributes
  - [ ] int column shows numeric attributes
  - [ ] date column shows date attributes
- [ ] Preview masked data
- [ ] Review step shows correct summary
- [ ] Save workflow
- [ ] Verify workflow appears in list

#### **3. Workflow Execution**
- [ ] Open workflow detail page
- [ ] Verify Overview tab shows correct info
- [ ] Click "Execute Workflow"
- [ ] Confirm warning dialog
- [ ] Switch to Execution History tab
- [ ] Verify execution appears with "running" or "queued" status
- [ ] Refresh to see updated status
- [ ] View execution logs
- [ ] Verify data in database is masked

#### **4. Error Handling**
- [ ] Try creating workflow without selecting connection
- [ ] Try executing workflow on non-existent table
- [ ] Try stopping a completed execution
- [ ] Test with table that has no primary key

#### **5. UI/Navigation**
- [ ] Verify green theme for single-server pages
- [ ] Verify blue theme for two-server pages
- [ ] Verify navbar highlights active page
- [ ] Test mobile responsive design

---

## 📊 Database Schema Diagram

```
┌─────────────────────────────────┐
│ single_server_connections       │
├─────────────────────────────────┤
│ id (PK)                         │
│ name (UNIQUE)                   │
│ connection_type                 │
│ server                          │
│ database_name                   │
│ username                        │
│ password (encrypted)            │
│ port                            │
│ status                          │
│ created_at                      │
└─────────────────────────────────┘
          ▲
          │
          │ connection_id (FK)
          │
┌─────────────────────────────────┐
│ single_server_workflows         │
├─────────────────────────────────┤
│ id (PK)                         │
│ name (UNIQUE)                   │
│ description                     │
│ status                          │
│ connection_id (FK)              │
│ schema_name                     │
│ table_name                      │
│ created_at                      │
└─────────────────────────────────┘
          ▲                    ▲
          │                    │
          │                    │
          │                    │ workflow_id (FK)
          │                    │
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│ single_server_column_mappings  │    │ single_server_executions        │
├─────────────────────────────────┤    ├─────────────────────────────────┤
│ id (PK)                         │    │ id (PK)                         │
│ workflow_id (FK)                │    │ workflow_id (FK)                │
│ column_name                     │    │ execution_id (UUID)             │
│ data_type                       │    │ task_id                         │
│ is_pii                          │    │ status                          │
│ pii_attribute                   │    │ rows_processed                  │
│ created_at                      │    │ rows_updated                    │
└─────────────────────────────────┘    │ progress                        │
                                        │ error_message                   │
                                        │ execution_logs (JSON)           │
                                        │ started_at                      │
                                        │ completed_at                    │
                                        └─────────────────────────────────┘
```

---

## 🚀 Deployment Steps

### **1. Deploy Database Changes**
```bash
# Connect to your database
sqlcmd -S your-server.database.windows.net -d your-database -U username -P password

# Run migration
:r database/migrations/create_single_server_tables.sql
GO
```

### **2. Deploy Backend Code**
- Implement the 22 API endpoints listed above
- Add in-place UPDATE execution logic
- Test endpoints using Postman or curl

### **3. Deploy Frontend Code**
```bash
# Build React app
npm run build

# Deploy to your web server
# (Copy build folder to hosting provider)
```

### **4. Verify Deployment**
- [ ] Navigate to `/single-server/connections`
- [ ] Create a test connection
- [ ] Create a test workflow
- [ ] Execute workflow on a non-production table
- [ ] Verify data is masked in database

---

## 📝 Usage Examples

### **Example 1: Mask PII in UAT Database**
**Scenario:** You have a UAT database with production data that needs PII masking

1. **Create Connection:**
   - Name: "UAT Database"
   - Type: Azure SQL
   - Server: uat-server.database.windows.net
   - Database: UAT_DB

2. **Create Workflow:**
   - Name: "Mask UAT Users Table"
   - Schema: dbo
   - Table: Users
   - PII Columns:
     - first_name → first_name
     - last_name → last_name
     - email → email
     - ssn → ssn
     - phone → phone_number

3. **Execute:**
   - Original: `John Doe, john.doe@example.com, 123-45-6789`
   - Masked: `Michael Smith, michael.smith@example.com, 987-65-4321`

### **Example 2: Mask Financial Data**
**Scenario:** Mask credit card numbers in Orders table

1. **Create Workflow:**
   - Schema: dbo
   - Table: Orders
   - PII Columns:
     - credit_card_number → credit_card
     - cvv → random_number
     - billing_address → address

2. **Execute:**
   - Original: `4532-1234-5678-9010, CVV: 123`
   - Masked: `4532-9876-5432-1098, CVV: 456`

---

## 🔍 Troubleshooting

### **Issue: Connection test fails**
**Solution:**
- Verify server name and port
- Check firewall rules (allow your IP)
- Verify username/password
- Test connection using SQL Server Management Studio

### **Issue: Schemas don't load**
**Solution:**
- Verify connection has SELECT permission on INFORMATION_SCHEMA
- Check if database supports schema discovery

### **Issue: Execution stays in "queued" status**
**Solution:**
- Check backend async task queue
- Verify execution service is running
- Check logs for errors

### **Issue: Data not masked after execution**
**Solution:**
- Verify workflow has PII columns marked
- Check execution logs for errors
- Verify user has UPDATE permission on table
- Check if table has primary key

---

## 📞 Support & Maintenance

### **Files to Monitor**
- Backend logs: Check for execution errors
- Database: Monitor `single_server_executions` table
- Frontend console: Check for API errors

### **Common Maintenance Tasks**
1. **Clean up old executions:**
   ```sql
   DELETE FROM single_server_executions
   WHERE completed_at < DATEADD(month, -3, GETDATE());
   ```

2. **Update PII attributes:**
   - Modify backend `/workflows/pii-attributes` endpoint
   - No frontend changes needed (dynamic loading)

3. **Add new connection types:**
   - Update `CreateSingleServerConnectionDialog.js` dropdown
   - Add backend support for new database type

---

## ✅ Summary

### **What's Been Delivered**
✅ Complete database schema (4 tables)
✅ 22 API endpoint specifications
✅ 5 React components with Material-UI
✅ Full routing and navigation
✅ Smart PII attribute filtering
✅ Execution monitoring and logging
✅ Warning dialogs for destructive operations

### **What's Needed Next**
⏳ Backend API implementation (Python/Node.js/Java)
⏳ In-place UPDATE execution logic
⏳ End-to-end testing on test database
⏳ User documentation and training

### **Estimated Time to Complete**
- Backend Implementation: 3-4 days
- Testing: 2 days
- Documentation: 1 day
- **Total: ~7 days**

---

## 🎉 Success Metrics

After implementation, you should be able to:
- ✅ Create single-server connections without affecting two-server system
- ✅ Create workflows with simplified 3-step process
- ✅ Execute in-place PII masking on same database/schema/table
- ✅ Monitor execution progress and view logs
- ✅ Distinguish single-server vs two-server by green/blue color coding
- ✅ Manage both systems independently in the same application

---

**Implementation Date:** 2025-11-05
**Version:** 1.0.0
**Status:** Frontend Complete ✅ | Backend Pending ⏳
