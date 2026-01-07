# PII Masking Tool

A React-based web application for masking Personally Identifiable Information (PII) in databases. This tool performs in-place data masking using UPDATE operations directly within the same database.

## Prerequisites

- Node.js: 23.11.1
- npm: 10.9.2

## Installation

```bash
npm install
```

## Environment Configuration

The application uses different environment files for different deployment environments. Copy `.env.example` to create environment-specific files:

```bash
# Create environment files from example
cp .env.example .env.loc    # Local development
cp .env.example .env.dev    # Development server
cp .env.example .env.qa     # QA server
cp .env.example .env.prod   # Production server
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:9000` |
| `VITE_PORT` | Application port | `5000` |
| `VITE_ENCRYPTION_ENABLED` | Enable/disable encryption | `true` |
| `VITE_ENCRYPTION_KEY` | 32-character AES-256 key | `YourSecure32CharacterKeyHere!!` |

## Running the Application

### Development

```bash
# Local environment
npm run start:loc

# Development server
npm run start:dev

# QA server
npm run start:qa

# Production server
npm run start:prod
```

### Building for Production

```bash
# Build for development
npm run build:dev

# Build for QA
npm run build:qa

# Build for production
npm run build:prod
```

### Preview Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API service functions
├── utils/          # Utility functions
└── App.jsx         # Main application component
```

## Documentation

See the `docs/` folder for detailed documentation:
- [How It Works](docs/PII_Masking_Tool_How_It_Works.md)
- [MasterCraft vs PII Tool Comparison](docs/MasterCraft_vs_PII_Tool_Simple.md)
