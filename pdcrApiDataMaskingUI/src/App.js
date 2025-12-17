import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import RoleRegistration from './components/RoleRegistration/RoleRegistration';
import UserRegistration from './components/UserRegistration/UserRegistration';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import { SidebarProvider } from './context/SidebarContext';

// Server Components
import ServerDashboard from './components/ServerDashboard/ServerDashboard';
import ServerConnectionsPage from './components/ServerConnections/ServerConnectionsPage';
import ServerWorkflowsPage from './components/ServerWorkflows/ServerWorkflowsPage';
import CreateServerWorkflowPage from './components/ServerWorkflows/CreateWorkflowPage';
import ServerWorkflowDetailPage from './components/ServerWorkflows/WorkflowDetailPage';

function App() {
  return (
    <Router>
      <SidebarProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Server routes - Wrapped with MainLayout */}
            <Route
              path="/datamasking/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ServerDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/datamasking/connections"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ServerConnectionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/datamasking/workflows"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ServerWorkflowsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/datamasking/workflows/create"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreateServerWorkflowPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/datamasking/workflows/:id/edit"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreateServerWorkflowPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/datamasking/workflows/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ServerWorkflowDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes - Wrapped with MainLayout */}
            <Route
              path="/register-role"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RoleRegistration />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/register-user"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserRegistration />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </SidebarProvider>
    </Router>
  );
}

export default App;
