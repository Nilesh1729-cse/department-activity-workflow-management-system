import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Page
import { Login } from './pages/auth/Login';

// Dashboard Router
import { DashboardRouter } from './pages/dashboards/DashboardRouter';

// Requests
import { RequestsPage } from './pages/requests/RequestsPage';
import { RequestDetailPage } from './pages/requests/RequestDetailPage';

// Activities
import { ActivitiesPage } from './pages/activities/ActivitiesPage';
import { ActivityDetailPage } from './pages/activities/ActivityDetailPage';

// Approvals (HOD / Admin)
import { PendingApprovalsPage } from './pages/approvals/PendingApprovalsPage';

// Projects
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ProjectPreferencesPage } from './pages/projects/ProjectPreferencesPage';
import { ProjectAllocationsPage } from './pages/projects/ProjectAllocationsPage';
import { MyAllocationPage } from './pages/projects/MyAllocationPage';

// Faculty & Students
import { MyStudentsPage } from './pages/faculty/MyStudentsPage';
import { FacultyDirectoryPage } from './pages/faculty/FacultyDirectoryPage';
import { StudentsDirectoryPage } from './pages/students/StudentsDirectoryPage';

// Announcements, Reports, Audit
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';

// Admin
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { AcademicManagementPage } from './pages/admin/AcademicManagementPage';

// Profile
import { ProfilePage } from './pages/profile/ProfilePage';

import { ThemeProvider } from './context/ThemeContext';

// Route Guard Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Dashboard based on User Role */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Department Requests */}
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />

            {/* Department Activities */}
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityDetailPage />} />

            {/* Pending Approvals (HOD & Admin) */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_ADMIN']}>
                  <PendingApprovalsPage />
                </ProtectedRoute>
              }
            />

            {/* Projects */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route
              path="/projects/preferences"
              element={
                <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                  <ProjectPreferencesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/my-allocation"
              element={
                <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
                  <MyAllocationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/allocations"
              element={
                <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_ADMIN', 'ROLE_FACULTY']}>
                  <ProjectAllocationsPage />
                </ProtectedRoute>
              }
            />

            {/* Faculty Specific */}
            <Route
              path="/faculty/my-students"
              element={
                <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD']}>
                  <MyStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/faculty" element={<FacultyDirectoryPage />} />

            {/* Student Directory */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_FACULTY', 'ROLE_ADMIN']}>
                  <StudentsDirectoryPage />
                </ProtectedRoute>
              }
            />

            {/* Announcements */}
            <Route path="/announcements" element={<AnnouncementsPage />} />

            {/* Reports & Analytics */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_ADMIN']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Management */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                  <UsersManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic"
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                  <AcademicManagementPage />
                </ProtectedRoute>
              }
            />

            {/* User Profile */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  );
}
