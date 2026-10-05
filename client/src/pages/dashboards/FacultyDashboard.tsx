import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Briefcase,
  Users,
  CalendarDays,
  Clock,
  Plus,
  ArrowRight,
  UserCheck,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProjectItem, ActivityItem } from '../../types';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<ProjectItem[]>([]);
  const [myActivities, setMyActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const [statsRes, projRes, actRes]: any = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/projects?myProjects=true'),
          api.get('/activities'),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (projRes.success) setMyProjects(projRes.data.slice(0, 4));
        if (actRes.success) {
          // Filter to my activities
          const mine = actRes.data.filter((a: any) => a.facultyId === user?.id);
          setMyActivities(mine.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const profile = user?.facultyProfile;

  return (
    <div className="space-y-8">
      {/* Faculty Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              <Building className="w-3.5 h-3.5" />
              CSE Faculty Portal
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{user?.name}</h2>
            <p className="text-sm text-slate-300 mt-1">
              {profile?.designation || 'Associate Professor'} • Employee ID:{' '}
              <span className="font-semibold text-white">{profile?.employeeId || 'EMP-CSE-002'}</span> •{' '}
              Cabin: <span className="font-semibold text-white">{profile?.cabinNumber || 'B-104'}</span>
            </p>
            <p className="text-xs text-brand-300 mt-1 font-mono">
              Specialization: {profile?.specialization || 'Artificial Intelligence & Systems'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/projects?new=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Propose Project
            </Link>
            <Link
              to="/activities?new=true"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
            >
              <CalendarDays className="w-4 h-4" />
              New Activity
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={stats?.metrics?.approvedProjects || 0}
          subtitle="Sanctioned capstone projects"
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          title="Assigned Mentees"
          value={stats?.metrics?.assignedStudents || 0}
          subtitle="Allocated project students"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending Proposals"
          value={stats?.metrics?.pendingProjects || 0}
          subtitle="Proposals awaiting HOD review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Submitted Activities"
          value={stats?.metrics?.myActivities || 0}
          subtitle="Workshops & guest lectures"
          icon={CalendarDays}
          color="purple"
        />
      </div>

      {/* Grid: My Projects & Department Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Proposal Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              My Project Proposals
            </h3>
            <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {myProjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No projects proposed yet.</p>
            ) : (
              myProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 truncate transition-colors">
                      {p.projectCode}: {p.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Domain: {p.domain} • Capacity: {p.allocatedCount}/{p.maxStudents} Students
                    </p>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Department Activities Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-600" />
              Department Activities & Events
            </h3>
            <Link to="/activities" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {myActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No departmental activities proposed.</p>
            ) : (
              myActivities.map((act) => (
                <Link
                  key={act.id}
                  to={`/activities/${act.id}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 truncate transition-colors">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.activityType.replace('_', ' ')} • Venue: {act.venue}
                    </p>
                  </div>
                  <StatusBadge status={act.status} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
