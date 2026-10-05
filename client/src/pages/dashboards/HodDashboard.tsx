import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import {
  Users,
  UserCheck,
  CheckSquare,
  Briefcase,
  CalendarDays,
  UserX,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  FolderGit2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHodData = async () => {
      try {
        const [statsRes, analyticsRes]: any = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/analytics'),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load HOD dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHodData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = stats?.metrics;

  const PIE_COLORS = ['#026fc7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* HOD Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl shadow-brand-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              Department Executive Desk
            </div>
            <h2 className="text-2xl font-bold tracking-tight">HOD Command Center</h2>
            <p className="text-sm text-brand-100 mt-1">
              Welcome, {user?.name} • Head of Computer Science & Engineering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/approvals"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/25"
            >
              <CheckSquare className="w-4 h-4" />
              Pending Approvals Queue ({metrics?.pendingApprovals || 0})
            </Link>
            <Link
              to="/allocations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition-colors border border-white/20"
            >
              <FolderGit2 className="w-4 h-4" />
              Allocation Engine
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Students"
          value={metrics?.totalStudents || 0}
          subtitle="UG & PG enrolled"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Faculty"
          value={metrics?.totalFaculty || 0}
          subtitle="Department professors"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          subtitle="Requests awaiting action"
          icon={CheckSquare}
          color="amber"
        />
        <StatCard
          title="Active Projects"
          value={metrics?.activeProjects || 0}
          subtitle="Approved capstone pool"
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Approved Activities"
          value={metrics?.approvedActivities || 0}
          subtitle="Seminars & workshops"
          icon={CalendarDays}
          color="purple"
        />
        <StatCard
          title="Unallocated"
          value={metrics?.unallocatedStudents || 0}
          subtitle="Students awaiting project"
          icon={UserX}
          color="rose"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Enrolment by Academic Program */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-600" />
                Student Enrolment by Program
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribution across UG and PG degrees</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.studentsByProgram || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#026fc7" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Request Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-600" />
                Department Workflow Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Breakdown of submitted request states</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.requestStatusData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {(analytics?.requestStatusData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
