import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { FacultyDashboard } from './FacultyDashboard';
import { HodDashboard } from './HodDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'ROLE_STUDENT':
      return <StudentDashboard />;
    case 'ROLE_FACULTY':
      return <FacultyDashboard />;
    case 'ROLE_HOD':
      return <HodDashboard />;
    case 'ROLE_ADMIN':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
};
