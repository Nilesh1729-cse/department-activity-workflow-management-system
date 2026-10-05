import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FileText,
  Clock,
  CheckCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
  Megaphone,
  User,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RequestItem, AnnouncementItem } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, reqsRes, annRes]: any = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/requests'),
          api.get('/announcements'),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (reqsRes.success) setRecentRequests(reqsRes.data.slice(0, 4));
        if (annRes.success) setAnnouncements(annRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const profile = user?.studentProfile;
  const allocation = stats?.allocation;

  return (
    <div className="space-y-8">
      {/* Student Welcome & Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg shadow-brand-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              Undergraduate Engineering Portal
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}!</h2>
            <p className="text-sm text-brand-100 mt-1">
              Roll No: <span className="font-semibold text-white">{profile?.rollNumber || '23CS001'}</span> •{' '}
              {profile?.program?.name || 'B.Tech Computer Science & Engineering'} •{' '}
              Batch: <span className="font-semibold text-white">{profile?.batch?.name || '2023-2027'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 self-start md:self-auto">
            <div className="text-right">
              <p className="text-[11px] text-brand-100 font-medium uppercase tracking-wider">Semester</p>
              <p className="text-xl font-bold text-white">Sem {profile?.currentSemester || 6}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-right">
              <p className="text-[11px] text-brand-100 font-medium uppercase tracking-wider">CGPA</p>
              <p className="text-xl font-bold text-emerald-300">{profile?.cgpa || '8.92'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.metrics?.totalRequests || 0}
          subtitle="All submitted requisitions"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.metrics?.pendingRequests || 0}
          subtitle="Under authority evaluation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Requests"
          value={stats?.metrics?.approvedRequests || 0}
          subtitle="Sanctioned permissions"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Project Allocation"
          value={stats?.metrics?.isAllocated ? 'Allocated' : 'In Progress'}
          subtitle={stats?.metrics?.isAllocated ? 'Assigned Capstone Project' : 'Cycle 2026 active'}
          icon={Briefcase}
          color={stats?.metrics?.isAllocated ? 'indigo' : 'purple'}
        />
      </div>

      {/* Capstone Project Status Highlight Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Capstone Project Allocation</h3>
          </div>
          {allocation && <StatusBadge status={allocation.status} />}
        </div>

        {allocation ? (
          <div className="bg-indigo-50/40 rounded-xl p-5 border border-indigo-100/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-indigo-950">
                {allocation.project.projectCode}: {allocation.project.title}
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {allocation.project.domain}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {allocation.project.description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-indigo-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mentor: <strong className="text-slate-800">{allocation.project.faculty.name}</strong></span>
              </div>
              <div>
                Tech Stack: <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200">{allocation.project.technologies}</code>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">You do not have a finalized project allocation yet.</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Review available faculty project proposals and submit your ranked preferences before the deadline.
              </p>
            </div>
            <Link
              to="/projects/preferences"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs shrink-0"
            >
              Submit Preferences
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Two Column Layout: Recent Requests & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              Recent Departmental Requests
            </h3>
            <Link to="/requests" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No requests submitted yet.</p>
            ) : (
              recentRequests.map((req) => (
                <Link
                  key={req.id}
                  to={`/requests/${req.id}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 truncate transition-colors">
                      {req.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {req.requestType.replace('_', ' ')} • {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-600" />
              Department Announcements
            </h3>
            <Link to="/announcements" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active announcements.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{ann.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-700'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Posted by {ann.author.name} • {new Date(ann.publishDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
