import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  CalendarDays,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  Megaphone,
  UserCheck,
  FolderGit2,
  Building2,
  GraduationCap,
  Settings,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-xs shadow-brand-500/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 min-h-screen transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">DeptFlow</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Activity & Workflows</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {/* Core Dashboard */}
        <NavLink to="/dashboard" end className={navItemClass}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

        {/* STUDENT NAVIGATION */}
        {role === 'ROLE_STUDENT' && (
          <>
            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Academic & Workflow
            </div>
            <NavLink to="/requests" end className={navItemClass}>
              <FileText className="w-4 h-4" />
              My Requests
            </NavLink>
            <NavLink to="/projects" end className={navItemClass}>
              <Briefcase className="w-4 h-4" />
              Approved Projects Pool
            </NavLink>
            <NavLink to="/projects/preferences" end className={navItemClass}>
              <CheckSquare className="w-4 h-4" />
              Project Preferences
            </NavLink>
            <NavLink to="/projects/my-allocation" end className={navItemClass}>
              <Sparkles className="w-4 h-4" />
              My Allocation
            </NavLink>
          </>
        )}

        {/* FACULTY NAVIGATION */}
        {role === 'ROLE_FACULTY' && (
          <>
            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Department & Mentoring
            </div>
            <NavLink to="/projects" end className={navItemClass}>
              <Briefcase className="w-4 h-4" />
              Project Proposals
            </NavLink>
            <NavLink to="/faculty/my-students" end className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              My Assigned Students
            </NavLink>
            <NavLink to="/activities" end className={navItemClass}>
              <CalendarDays className="w-4 h-4" />
              Department Activities
            </NavLink>
            <NavLink to="/requests" end className={navItemClass}>
              <FileText className="w-4 h-4" />
              Student Requests
            </NavLink>
          </>
        )}

        {/* HOD NAVIGATION */}
        {role === 'ROLE_HOD' && (
          <>
            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workflow Authority
            </div>
            <NavLink to="/approvals" end className={navItemClass}>
              <CheckSquare className="w-4 h-4" />
              Pending Approvals
            </NavLink>
            <NavLink to="/requests" end className={navItemClass}>
              <FileText className="w-4 h-4" />
              Department Requests
            </NavLink>
            <NavLink to="/activities" end className={navItemClass}>
              <CalendarDays className="w-4 h-4" />
              Activities & Events
            </NavLink>

            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Academic Projects
            </div>
            <NavLink to="/projects" end className={navItemClass}>
              <Briefcase className="w-4 h-4" />
              Project Pool & Proposals
            </NavLink>
            <NavLink to="/allocations" end className={navItemClass}>
              <FolderGit2 className="w-4 h-4" />
              Project Allocation Engine
            </NavLink>

            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Directory & Reports
            </div>
            <NavLink to="/students" end className={navItemClass}>
              <Users className="w-4 h-4" />
              Students Directory
            </NavLink>
            <NavLink to="/faculty" end className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              Faculty Directory
            </NavLink>
            <NavLink to="/reports" end className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              Department Reports
            </NavLink>
            <NavLink to="/audit-logs" end className={navItemClass}>
              <ShieldCheck className="w-4 h-4" />
              Audit Trail
            </NavLink>
          </>
        )}

        {/* ADMIN NAVIGATION */}
        {role === 'ROLE_ADMIN' && (
          <>
            <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              System Administration
            </div>
            <NavLink to="/admin/users" end className={navItemClass}>
              <Users className="w-4 h-4" />
              User Management
            </NavLink>
            <NavLink to="/admin/academic" end className={navItemClass}>
              <Building2 className="w-4 h-4" />
              Departments & Programs
            </NavLink>
            <NavLink to="/allocations" end className={navItemClass}>
              <FolderGit2 className="w-4 h-4" />
              Project Allocation
            </NavLink>
            <NavLink to="/reports" end className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              System Analytics
            </NavLink>
            <NavLink to="/audit-logs" end className={navItemClass}>
              <ShieldCheck className="w-4 h-4" />
              System Audit Logs
            </NavLink>
          </>
        )}

        {/* Universal Links */}
        <div className="pt-4 pb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          General
        </div>
        <NavLink to="/announcements" end className={navItemClass}>
          <Megaphone className="w-4 h-4" />
          Announcements
        </NavLink>
        <NavLink to="/profile" end className={navItemClass}>
          <Settings className="w-4 h-4" />
          My Profile
        </NavLink>
      </nav>

      {/* Role Footer Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Demonstration Mode</div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</div>
      </div>
    </aside>
  );
};
