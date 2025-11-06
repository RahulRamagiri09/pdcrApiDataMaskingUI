# Backend API Quick Reference - Single Server System

## 🎯 API Endpoints to Implement (22 total)

### Base URL
```
http://localhost:8000/api
```

---

## 1️⃣ Connections API

### GET `/single-server/connections`
**Description:** Get all single-server connections
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "UAT Database",
      "connection_type": "azure_sql",
      "server": "uat-server.database.windows.net",
      "database_name": "UAT_DB",
      "username": "admin",
      "port": 1433,
      "status": "active",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST `/single-server/connections`
**Description:** Create new connection
**Request Body:**
```json
{
  "name": "UAT Database",
  "connection_type": "azure_sql",
  "server": "uat-server.database.windows.net",
  "database_name": "UAT_DB",
  "username": "admin",
  "password": "SecurePassword123!",
  "port": 1433
}
```
**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "UAT Database",
    "status": "active"
  }
}
```
**Notes:**
- Encrypt password using AES-256 before storing
- Set status to 'active' by default
- Validate unique name

---

### GET `/single-server/connections/:id`
**Description:** Get connection by ID
**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "UAT Database",
    "connection_type": "azure_sql",
    "server": "uat-server.database.windows.net",
    "database_name": "UAT_DB",
    "username": "admin",
    "port": 1433,
    "status": "active"
  }
}
```

---

### DELETE `/single-server/connections/:id`
**Description:** Delete connection
**Response:**
```json
{
  "message": "Connection deleted successfully"
}
```
**Notes:**
- CASCADE delete will remove related workflows and executions

---

### POST `/single-server/connections/test`
**Description:** Test connection credentials
**Request Body:**
```json
{
  "connection_type": "azure_sql",
  "server": "uat-server.database.windows.net",
  "database_name": "UAT_DB",
  "username": "admin",
  "password": "SecurePassword123!",
  "port": 1433
}
```
**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "connection_time_ms": 234
}
```
**Response (Failure):**
```json
{
  "success": false,
  "message": "Login failed for user 'admin'"
}
```

---

### GET `/single-server/connections/:id/schemas`
**Description:** Get all schemas in database
**SQL Query:**
```sql
SELECT SCHEMA_NAME
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME NOT IN ('sys', 'INFORMATION_SCHEMA')
ORDER BY SCHEMA_NAME;
```
**Response:**
```json
{
  "data": ["dbo", "sales", "hr"]
}
```

---

### GET `/single-server/connections/:id/schemas/:schema/tables`
**Description:** Get all tables in schema
**SQL Query:**
```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = ?
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```
**Response:**
```json
{
  "data": ["Users", "Orders", "Products"]
}
```

---

### GET `/single-server/connections/:id/schemas/:schema/tables/:table/columns`
**Description:** Get all columns in table with data types
**SQL Query:**
```sql
SELECT
    COLUMN_NAME as name,
    DATA_TYPE as data_type,
    IS_NULLABLE as is_nullable,
    CHARACTER_MAXIMUM_LENGTH as max_length
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
ORDER BY ORDINAL_POSITION;
```
**Response:**
```json
{
  "data": [
    {
      "name": "id",
      "data_type": "int",
      "is_nullable": "NO"
    },
    {
      "name": "first_name",
      "data_type": "varchar",
      "is_nullable": "YES"
    },
    {
      "name": "email",
      "data_type": "varchar",
      "is_nullable": "YES"
    }
  ]
}
```

---

## 2️⃣ Workflows API

### GET `/single-server/workflows`
**Description:** Get all workflows
**SQL Query:**
```sql
SELECT
    w.id,
    w.name,
    w.description,
    w.status,
    w.connection_id,
    w.schema_name,
    w.table_name,
    w.created_at,
    w.updated_at,
    c.name as connection_name
FROM single_server_workflows w
LEFT JOIN single_server_connections c ON w.connection_id = c.id
ORDER BY w.created_at DESC;
```
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mask UAT Users",
      "description": "Mask PII in UAT Users table",
      "status": "active",
      "connection_id": 1,
      "connection_name": "UAT Database",
      "schema_name": "dbo",
      "table_name": "Users",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST `/single-server/workflows`
**Description:** Create new workflow
**Request Body:**
```json
{
  "name": "Mask UAT Users",
  "description": "Mask PII in UAT Users table",
  "connection_id": 1,
  "schema_name": "dbo",
  "table_name": "Users",
  "column_mappings": [
    {
      "column_name": "first_name",
      "data_type": "varchar",
      "is_pii": true,
      "pii_attribute": "first_name"
    },
    {
      "column_name": "email",
      "data_type": "varchar",
      "is_pii": true,
      "pii_attribute": "email"
    },
    {
      "column_name": "created_at",
      "data_type": "datetime",
      "is_pii": false,
      "pii_attribute": ""
    }
  ]
}
```
**Implementation:**
```python
# Pseudocode
def create_workflow(data):
    # 1. Insert into single_server_workflows
    workflow_id = db.execute("""
        INSERT INTO single_server_workflows
        (name, description, connection_id, schema_name, table_name, status)
        VALUES (?, ?, ?, ?, ?, 'active')
    """, data.name, data.description, data.connection_id, data.schema_name, data.table_name)

    # 2. Insert column mappings
    for col in data.column_mappings:
        db.execute("""
            INSERT INTO single_server_column_mappings
            (workflow_id, column_name, data_type, is_pii, pii_attribute)
            VALUES (?, ?, ?, ?, ?)
        """, workflow_id, col.column_name, col.data_type, col.is_pii, col.pii_attribute)

    return workflow_id
```
**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Mask UAT Users"
  }
}
```

---

### GET `/single-server/workflows/:id`
**Description:** Get workflow with column mappings
**SQL Query:**
```sql
-- Main workflow
SELECT
    w.*,
    c.name as connection_name,
    c.connection_type,
    c.server,
    c.database_name
FROM single_server_workflows w
LEFT JOIN single_server_connections c ON w.connection_id = c.id
WHERE w.id = ?;

-- Column mappings
SELECT *
FROM single_server_column_mappings
WHERE workflow_id = ?
ORDER BY id;
```
**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Mask UAT Users",
    "description": "Mask PII in UAT Users table",
    "status": "active",
    "connection_id": 1,
    "connection_name": "UAT Database",
    "schema_name": "dbo",
    "table_name": "Users",
    "column_mappings": [
      {
        "id": 1,
        "column_name": "first_name",
        "data_type": "varchar",
        "is_pii": true,
        "pii_attribute": "first_name"
      },
      {
        "id": 2,
        "column_name": "email",
        "data_type": "varchar",
        "is_pii": true,
        "pii_attribute": "email"
      }
    ]
  }
}
```

---

### PUT `/single-server/workflows/:id`
**Description:** Update workflow
**Request Body:** Same as POST
**Implementation:** Update workflow + delete old column_mappings + insert new ones

---

### DELETE `/single-server/workflows/:id`
**Description:** Delete workflow
**Notes:** CASCADE delete handles column_mappings and executions

---

### GET `/single-server/workflows/:id/executions`
**Description:** Get execution history
**SQL Query:**
```sql
SELECT *
FROM single_server_executions
WHERE workflow_id = ?
ORDER BY started_at DESC;
```
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "workflow_id": 1,
      "execution_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "task_id": "task_12345",
      "status": "completed",
      "rows_processed": 1000,
      "rows_updated": 1000,
      "progress": 100,
      "error_message": null,
      "execution_logs": "[\"Started\", \"Processing rows\", \"Completed\"]",
      "started_at": "2025-01-15T14:00:00Z",
      "completed_at": "2025-01-15T14:05:23Z"
    }
  ]
}
```

---

### GET `/workflows/pii-attributes`
**Description:** Get categorized PII attributes (shared with two-server)
**Response:**
```json
{
  "data": {
    "string": ["first_name", "last_name", "email", "address", "city", "ssn", "phone_number"],
    "numeric": ["random_number", "age", "zip_code"],
    "date": ["date_shift"],
    "datetime": ["datetime_shift"],
    "boolean": ["random_boolean"]
  }
}
```

---

## 3️⃣ Execution API

### POST `/single-server/workflows/:id/execute`
**Description:** Execute workflow (in-place UPDATE)
**Implementation:**
```python
async def execute_workflow(workflow_id: int):
    # 1. Create execution record
    execution_id = str(uuid.uuid4())
    task_id = str(uuid.uuid4())

    db.execute("""
        INSERT INTO single_server_executions
        (workflow_id, execution_id, task_id, status, started_at)
        VALUES (?, ?, ?, 'queued', GETDATE())
    """, workflow_id, execution_id, task_id)

    # 2. Start async task
    task = asyncio.create_task(run_execution(workflow_id, execution_id))

    # 3. Return immediately
    return {
        "execution_id": execution_id,
        "task_id": task_id,
        "status": "queued",
        "message": "Execution started"
    }
```
**Response:**
```json
{
  "execution_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "task_id": "task_12345",
  "status": "queued",
  "message": "Execution started"
}
```

---

### GET `/single-server/workflows/:wf_id/executions/:exec_id/status`
**Description:** Get execution status
**SQL Query:**
```sql
SELECT status, progress, rows_processed, rows_updated, error_message
FROM single_server_executions
WHERE execution_id = ?;
```
**Response:**
```json
{
  "data": {
    "status": "running",
    "progress": 65,
    "rows_processed": 1000,
    "rows_updated": 650,
    "error_message": null
  }
}
```

---

### POST `/single-server/workflows/:wf_id/executions/:exec_id/stop`
**Description:** Stop running execution
**Implementation:**
```python
def stop_execution(execution_id: str):
    # 1. Cancel async task
    cancel_task(execution_id)

    # 2. Update status
    db.execute("""
        UPDATE single_server_executions
        SET status = 'stopped', completed_at = GETDATE()
        WHERE execution_id = ?
    """, execution_id)
```

---

### POST `/masking/sample-data`
**Description:** Generate sample masked data (shared with two-server)
**Request:**
```json
{
  "pii_attribute": "first_name",
  "count": 5
}
```
**Response:**
```json
{
  "samples": ["Michael", "Sarah", "David", "Jennifer", "Robert"]
}
```

---

## 4️⃣ In-Place UPDATE Logic

### Core Execution Function
```python
async def run_execution(workflow_id: int, execution_id: str):
    """
    Execute in-place PII masking
    """
    try:
        # 1. Load workflow config
        workflow = db.query("""
            SELECT w.*, c.server, c.database_name, c.username, c.password, c.port
            FROM single_server_workflows w
            JOIN single_server_connections c ON w.connection_id = c.id
            WHERE w.id = ?
        """, workflow_id)

        column_mappings = db.query("""
            SELECT * FROM single_server_column_mappings
            WHERE workflow_id = ? AND is_pii = 1
        """, workflow_id)

        # 2. Update status to 'running'
        db.execute("""
            UPDATE single_server_executions
            SET status = 'running'
            WHERE execution_id = ?
        """, execution_id)

        # 3. Connect to target database
        conn = connect_to_database(workflow.connection)

        # 4. Get primary key columns
        pk_columns = get_primary_keys(conn, workflow.schema_name, workflow.table_name)

        if not pk_columns:
            raise Exception("Table must have a primary key")

        # 5. Count total rows
        total_rows = conn.execute(f"""
            SELECT COUNT(*)
            FROM {workflow.schema_name}.{workflow.table_name}
        """).fetchone()[0]

        db.execute("""
            UPDATE single_server_executions
            SET rows_processed = ?
            WHERE execution_id = ?
        """, total_rows, execution_id)

        # 6. Fetch primary keys
        pk_list_str = ', '.join(pk_columns)
        rows = conn.execute(f"""
            SELECT {pk_list_str}
            FROM {workflow.schema_name}.{workflow.table_name}
        """).fetchall()

        rows_updated = 0
        logs = ["Execution started", f"Total rows: {total_rows}"]

        # 7. Update each row
        with conn.begin():
            for row in rows:
                # Build WHERE clause
                where_parts = [f"{pk}=?" for pk in pk_columns]
                where_clause = ' AND '.join(where_parts)
                pk_values = [row[i] for i in range(len(pk_columns))]

                # Build SET clause with masked values
                set_parts = []
                masked_values = []

                for col_mapping in column_mappings:
                    # Generate masked value
                    masked_value = generate_masked_value(
                        col_mapping.pii_attribute,
                        col_mapping.data_type
                    )
                    set_parts.append(f"{col_mapping.column_name}=?")
                    masked_values.append(masked_value)

                # Execute UPDATE
                update_sql = f"""
                    UPDATE {workflow.schema_name}.{workflow.table_name}
                    SET {', '.join(set_parts)}
                    WHERE {where_clause}
                """

                conn.execute(update_sql, masked_values + pk_values)
                rows_updated += 1

                # Update progress every 100 rows
                if rows_updated % 100 == 0:
                    progress = int((rows_updated / total_rows) * 100)
                    logs.append(f"Processed {rows_updated}/{total_rows} rows ({progress}%)")

                    db.execute("""
                        UPDATE single_server_executions
                        SET rows_updated = ?, progress = ?, execution_logs = ?
                        WHERE execution_id = ?
                    """, rows_updated, progress, json.dumps(logs), execution_id)

        # 8. Mark as completed
        logs.append("Execution completed successfully")
        db.execute("""
            UPDATE single_server_executions
            SET status = 'completed',
                rows_updated = ?,
                progress = 100,
                execution_logs = ?,
                completed_at = GETDATE()
            WHERE execution_id = ?
        """, rows_updated, json.dumps(logs), execution_id)

    except Exception as e:
        # Mark as failed
        logs.append(f"Error: {str(e)}")
        db.execute("""
            UPDATE single_server_executions
            SET status = 'failed',
                error_message = ?,
                execution_logs = ?,
                completed_at = GETDATE()
            WHERE execution_id = ?
        """, str(e), json.dumps(logs), execution_id)
        raise

    finally:
        if conn:
            conn.close()
```

---

## 5️⃣ Helper Functions

### Get Primary Keys
```python
def get_primary_keys(connection, schema_name, table_name):
    """
    Get primary key column names for a table
    """
    query = """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
          AND TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
    """

    result = connection.execute(query, schema_name, table_name).fetchall()
    return [row[0] for row in result]
```

### Generate Masked Value
```python
def generate_masked_value(pii_attribute: str, data_type: str):
    """
    Generate masked value based on PII attribute
    """
    if pii_attribute == "first_name":
        return random.choice(["Michael", "Sarah", "David", "Jennifer", "Robert"])

    elif pii_attribute == "last_name":
        return random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones"])

    elif pii_attribute == "email":
        first = random.choice(["john", "jane", "bob", "alice"])
        last = random.choice(["smith", "doe", "brown"])
        return f"{first}.{last}@example.com"

    elif pii_attribute == "phone_number":
        return f"{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"

    elif pii_attribute == "ssn":
        return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"

    elif pii_attribute == "random_number":
        return random.randint(1, 100)

    elif pii_attribute == "date_shift":
        # Shift date by random days
        days_shift = random.randint(-365, 365)
        return f"DATEADD(day, {days_shift}, {column_name})"  # SQL expression

    # Add more attributes as needed
    else:
        return "MASKED"
```

---

## 🎯 Quick Start Checklist

### Backend Developer Tasks
- [ ] Run database migration script
- [ ] Implement 8 connection endpoints
- [ ] Implement 6 workflow endpoints
- [ ] Implement 3 execution endpoints
- [ ] Implement in-place UPDATE logic
- [ ] Add generate_masked_value function
- [ ] Test with Postman
- [ ] Deploy to staging
- [ ] End-to-end test with frontend

### Estimated Time: 3-4 days

---

**Last Updated:** 2025-11-05
