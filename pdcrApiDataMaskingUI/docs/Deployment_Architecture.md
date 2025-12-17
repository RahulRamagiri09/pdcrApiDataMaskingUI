# DEPLOYMENT ARCHITECTURE

**Document Type:** Deployment Guide
**Version:** 1.0
**Date:** December 2025

---

## Table of Contents

- [7.1 Development Environment](#71-development-environment)
- [7.2 Production Environment (Docker)](#72-production-environment-docker)
- [7.3 Docker Configuration Files](#73-docker-configuration-files)
- [7.4 Deployment Commands](#74-deployment-commands)
- [7.5 Environment Variables Reference](#75-environment-variables-reference)

---

## 7. DEPLOYMENT ARCHITECTURE

This section describes the deployment architecture for the PII Masking Tool across development and production environments.

---

## 7.1 Development Environment

```
DEVELOPMENT ENVIRONMENT

Developer Workstation (Windows/Mac/Linux)
+---------------------------------------------------+
|                                                   |
|  +---------------------------------------------+  |
|  |        Frontend (Port 3000)                 |  |
|  |  --------------------------------------     |  |
|  |  React Development Server                   |  |
|  |  - npm start                                |  |
|  |  - Hot Module Replacement (HMR)             |  |
|  |  - Source maps for debugging                |  |
|  |  - React Developer Tools                    |  |
|  |  - Auto-reload on file changes              |  |
|  |  - URL: http://localhost:3000               |  |
|  +---------------------------------------------+  |
|                      |                            |
|                      | API Calls                  |
|                      v                            |
|  +---------------------------------------------+  |
|  |        Backend (Port 8000)                  |  |
|  |  --------------------------------------     |  |
|  |  FastAPI with Uvicorn                       |  |
|  |  - uvicorn main:app --reload                |  |
|  |  - Auto-reload on code changes              |  |
|  |  - OpenAPI docs: /docs                      |  |
|  |  - Debug logging enabled                    |  |
|  |  - Single worker                            |  |
|  |  - URL: http://localhost:8000               |  |
|  +---------------------------------------------+  |
|                      |                            |
|                      | SQL Queries                |
|                      v                            |
|  +---------------------------------------------+  |
|  |      Database Server                        |  |
|  |  --------------------------------------     |  |
|  |  PostgreSQL or SQL Server                   |  |
|  |  - Application DB: pii_tool_dev             |  |
|  |  - Test databases for masking               |  |
|  |  - Sample data for testing                  |  |
|  |  - PostgreSQL: localhost:5432               |  |
|  |  - SQL Server: localhost:1433               |  |
|  +---------------------------------------------+  |
|                                                   |
|  Configuration (.env file):                       |
|  - SECRET_KEY=dev-secret-key-12345                |
|  - DATABASE_URL=postgresql://localhost:5432/db    |
|  - ENVIRONMENT=development                        |
|  - DEBUG=True                                     |
|  - LOG_LEVEL=DEBUG                                |
|  - CORS_ORIGINS=http://localhost:3000             |
|                                                   |
+---------------------------------------------------+
```

### Development Setup Steps

1. **Frontend Setup:**
   ```bash
   cd pii-masking-tool
   npm install
   npm start
   ```

2. **Backend Setup:**
   ```bash
   cd pii_masking_poc_internal
   pip install -r requirements.txt
   python run.py
   ```

3. **Access Points:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

---

## 7.2 Production Environment (Docker)

```
PRODUCTION ENVIRONMENT (Docker)

+------------------------------------------------------------------+
|                     Docker Host Server                            |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                   Docker Network (pii-network)              |  |
|  |                                                              |  |
|  |  +------------------+  +------------------+  +------------+  |  |
|  |  |                  |  |                  |  |            |  |  |
|  |  |  pii-frontend    |  |  pii-backend     |  |  pii-db    |  |  |
|  |  |  (nginx:alpine)  |  |  (python:3.11)   |  | (postgres) |  |  |
|  |  |                  |  |                  |  |            |  |  |
|  |  |  Port: 80/443    |  |  Port: 8000      |  | Port: 5432 |  |  |
|  |  |                  |  |  (internal)      |  | (internal) |  |  |
|  |  |  Serves:         |  |                  |  |            |  |  |
|  |  |  - React build   |  |  Runs:           |  | Stores:    |  |  |
|  |  |  - Static files  |  |  - FastAPI       |  | - Users    |  |  |
|  |  |  - Reverse proxy |  |  - Uvicorn       |  | - Workflows|  |  |
|  |  |    to backend    |  |  - 4 workers     |  | - Logs     |  |  |
|  |  |                  |  |                  |  |            |  |  |
|  |  +--------+---------+  +--------+---------+  +------+-----+  |  |
|  |           |                     |                   |        |  |
|  |           |   HTTP Requests     |   SQL Queries     |        |  |
|  |           +-------------------->+------------------>+        |  |
|  |                                                              |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  External Access:                                                 |
|  - HTTPS: Port 443 (via nginx)                                   |
|  - HTTP: Port 80 (redirects to HTTPS)                            |
|                                                                   |
|  Volumes:                                                         |
|  - postgres_data: Database persistence                            |
|  - nginx_logs: Access and error logs                              |
|                                                                   |
+------------------------------------------------------------------+
```

### Production Architecture Benefits

| Aspect | Benefit |
|--------|---------|
| **Isolation** | Each service runs in its own container |
| **Scalability** | Backend can be scaled horizontally |
| **Portability** | Same containers work across environments |
| **Security** | Internal network isolates database |
| **Maintenance** | Update individual containers without downtime |

---

## 7.3 Docker Configuration Files

### 7.3.1 Frontend Dockerfile

Create `Dockerfile.frontend` in the frontend project root:

```dockerfile
# Stage 1: Build React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Set production API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL:-/api}

# Build production bundle
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 7.3.2 Frontend nginx.conf

Create `nginx.conf` in the frontend project root:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # React Router support - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://pii-backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://pii-backend:8000/health;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3.3 Backend Dockerfile

Create `Dockerfile.backend` in the backend project root:

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies for database drivers
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    unixodbc-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
CMD ["uvicorn", "pii_masking.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 7.3.4 docker-compose.yml

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  # Frontend Service
  pii-frontend:
    build:
      context: ./pii-masking-tool
      dockerfile: Dockerfile.frontend
      args:
        REACT_APP_API_URL: /api
    container_name: pii-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - pii-backend
    networks:
      - pii-network
    restart: unless-stopped

  # Backend Service
  pii-backend:
    build:
      context: ./pii_masking_poc_internal
      dockerfile: Dockerfile.backend
    container_name: pii-backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:${DB_PASSWORD}@pii-db:5432/pii_masking
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=1440
      - CORS_ORIGINS=http://localhost,https://yourdomain.com
      - ENVIRONMENT=production
      - DEBUG=False
      - LOG_LEVEL=INFO
    depends_on:
      pii-db:
        condition: service_healthy
    networks:
      - pii-network
    restart: unless-stopped

  # Database Service
  pii-db:
    image: postgres:15-alpine
    container_name: pii-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=pii_masking
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - pii-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

networks:
  pii-network:
    driver: bridge

volumes:
  postgres_data:
```

### 7.3.5 .dockerignore

Create `.dockerignore` in both frontend and backend directories:

**Frontend .dockerignore:**
```
node_modules
build
.git
.gitignore
.env
.env.local
*.md
.vscode
coverage
```

**Backend .dockerignore:**
```
__pycache__
*.pyc
*.pyo
.git
.gitignore
.env
*.md
.vscode
.pytest_cache
venv
.venv
```

### 7.3.6 Production Environment File

Create `.env.production` in the project root:

```env
# Database
DB_PASSWORD=your_secure_database_password_here

# JWT Secret (generate with: openssl rand -hex 32)
SECRET_KEY=your_256_bit_secret_key_here

# Application
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
```

---

## 7.4 Deployment Commands

### Build and Start

```bash
# Build all containers
docker-compose build

# Start all services in detached mode
docker-compose up -d

# Build and start in one command
docker-compose up -d --build
```

### Stop and Remove

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes (WARNING: deletes data)
docker-compose down -v
```

### Monitoring and Logs

```bash
# View logs for all services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f pii-backend

# Check container status
docker-compose ps

# Check resource usage
docker stats
```

### Container Management

```bash
# Restart a specific service
docker-compose restart pii-backend

# Execute command in running container
docker-compose exec pii-backend bash

# View backend API logs
docker-compose exec pii-backend cat /app/logs/app.log

# Scale backend service (if needed)
docker-compose up -d --scale pii-backend=3
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker-compose exec pii-db psql -U postgres -d pii_masking

# Backup database
docker-compose exec pii-db pg_dump -U postgres pii_masking > backup.sql

# Restore database
docker-compose exec -T pii-db psql -U postgres pii_masking < backup.sql
```

---

## 7.5 Environment Variables Reference

### Development vs Production Comparison

| Variable | Development | Production |
|----------|-------------|------------|
| `SECRET_KEY` | `dev-secret-key-12345` | Strong 256-bit key |
| `DATABASE_URL` | `localhost:5432` | `pii-db:5432` (container) |
| `ENVIRONMENT` | `development` | `production` |
| `DEBUG` | `True` | `False` |
| `LOG_LEVEL` | `DEBUG` | `INFO` or `WARNING` |
| `CORS_ORIGINS` | `http://localhost:3000` | Production domain(s) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | `1440` (24 hours) |

### Secret Management Best Practices

1. **Never commit secrets to version control**
   - Use `.env` files (add to `.gitignore`)
   - Use Docker secrets for sensitive data

2. **Generate strong secrets:**
   ```bash
   # Generate SECRET_KEY
   openssl rand -hex 32

   # Generate DB_PASSWORD
   openssl rand -base64 24
   ```

3. **Use environment-specific files:**
   - `.env.development` - Local development
   - `.env.production` - Production (not in repo)

4. **Rotate secrets periodically:**
   - Database passwords: Every 90 days
   - JWT secret keys: Every 180 days

---

## Port Summary

| Service | Development Port | Production Port | Internal Only |
|---------|-----------------|-----------------|---------------|
| Frontend | 3000 | 80/443 | No |
| Backend | 8000 | 8000 | Yes (via nginx) |
| PostgreSQL | 5432 | 5432 | Yes |
| SQL Server | 1433 | 1433 | Yes |

---

## Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Backend health check | `{"status": "healthy"}` |
| `GET /` | Backend root | `{"message": "PII Masking API"}` |
| `GET /docs` | API documentation | Swagger UI |

---

**Document End**
