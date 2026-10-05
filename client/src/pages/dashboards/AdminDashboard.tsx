import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import {
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Layers,
  ShieldCheck,
  UserPlus,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuditLogItem } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, auditRes]: any = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/audit-logs'),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (auditRes.success) setAuditLogs(auditRes.data.slice(0, 6));
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = stats?.metrics;

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              Central System Administration
            </div>
            <h2 className="text-2xl font-bold tracking-tight">System Infrastructure Portal</h2>
            <p className="text-sm text-purple-200 mt-1">
              Welcome, {user?.name} • Superuser Configuration Console
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-purple-500/25"
            >
              <UserPlus className="w-4 h-4" />
              Manage Users
            </Link>
            <Link
              to="/admin/academic"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition-colors border border-white/20"
            >
              <Building2 className="w-4 h-4" />
              Academic Structure
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers || 0}
          subtitle="Registered accounts"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Students"
          value={metrics?.totalStudents || 0}
          subtitle="Enrolled student profiles"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Faculty"
          value={metrics?.totalFaculty || 0}
          subtitle="Faculty & HOD profiles"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Departments"
          value={metrics?.departmentsCount || 1}
          subtitle="Academic faculties"
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Programs"
          value={metrics?.programsCount || 2}
          subtitle="UG and PG degrees"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Recent System Audit Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              System Audit Trail & Security Events
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Immutable record of critical administrative and workflow actions</p>
          </div>
          <Link to="/audit-logs" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View full log
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-500">
                    by <strong>{log.actor?.name || 'System / Anonymous'}</strong> ({log.actorRole || 'SYSTEM'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Entity: {log.entityType} {log.entityId ? `[${log.entityId.slice(0, 8)}...]` : ''}
                </p>
              </div>
              <time className="text-xs text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
