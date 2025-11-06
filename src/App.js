import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import POCDashboard from './components/POCDashboard/POCDashboard';
import POCConnectionsPage from './components/POCConnections/POCConnectionsPage';
import POCWorkflowsPage from './components/POCWorkflows/POCWorkflowsPage';
import CreateWorkflowPage from './components/POCWorkflows/CreateWorkflowPage';
import WorkflowDetailPage from './components/POCWorkflows/WorkflowDetailPage';
import RoleRegistration from './components/RoleRegistration/RoleRegistration';
import UserRegistration from './components/UserRegistration/UserRegistration';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Single Server Components
import SingleServerDashboard from './components/SingleServerDashboard/SingleServerDashboard';
import SingleServerConnectionsPage from './components/SingleServerConnections/SingleServerConnectionsPage';
import SingleServerWorkflowsPage from './components/SingleServerWorkflows/SingleServerWorkflowsPage';
import CreateSingleServerWorkflowPage from './components/SingleServerWorkflows/CreateWorkflowPage';
import SingleServerWorkflowDetailPage from './components/SingleServerWorkflows/WorkflowDetailPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with copied POC components */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <POCDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <POCConnectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <POCWorkflowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/create"
            element={
              <ProtectedRoute>
                <CreateWorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id/edit"
            element={
              <ProtectedRoute>
                <CreateWorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id"
            element={
              <ProtectedRoute>
                <WorkflowDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Single Server routes */}
          <Route
            path="/single-server/dashboard"
            element={
              <ProtectedRoute>
                <SingleServerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/single-server/connections"
            element={
              <ProtectedRoute>
                <SingleServerConnectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/single-server/workflows"
            element={
              <ProtectedRoute>
                <SingleServerWorkflowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/single-server/workflows/create"
            element={
              <ProtectedRoute>
                <CreateSingleServerWorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/single-server/workflows/:id/edit"
            element={
              <ProtectedRoute>
                <CreateSingleServerWorkflowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/single-server/workflows/:id"
            element={
              <ProtectedRoute>
                <SingleServerWorkflowDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/register-role"
            element={
              <ProtectedRoute>
                <RoleRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-user"
            element={
              <ProtectedRoute>
                <UserRegistration />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
