import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Sparkles,
  User,
  Mail,
  Phone,
  Code2,
  Calendar,
  Building,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyAllocationPage: React.FC = () => {
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAllocation = async () => {
      try {
        const res: any = await api.get('/allocations/my-allocation');
        if (res.success && res.data) {
          setAllocation(res.data.allocation || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAllocation();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-xl mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Project Allocation in Progress</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          You have not been assigned a finalized capstone project yet. Make sure you have submitted your ranked project preferences.
        </p>
        <Link
          to="/projects/preferences"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          Review Project Preferences
        </Link>
      </div>
    );
  }

  const proj = allocation.project;
  const faculty = proj.faculty;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20">
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs w-max mb-3 border border-white/10">
          <FileCheck2 className="w-3.5 h-3.5" />
          Official Departmental Capstone Assignment
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Your Allocated Capstone Project</h2>
        <p className="text-xs text-emerald-100 mt-1">
          Assigned on {new Date(allocation.allocatedAt).toLocaleDateString()} • Status:{' '}
          <strong className="text-white uppercase">{allocation.status}</strong>
        </p>
      </div>

      {/* Main Allocation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {proj.projectCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                {proj.domain}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{proj.title}</h1>
          </div>
          <StatusBadge status={allocation.status} size="lg" />
        </div>

        {/* Matching Rationale Pill */}
        {allocation.allocationReason && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong>Allocation Reason:</strong> {allocation.allocationReason}
            </span>
          </div>
        )}

        {/* Mentor Card */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Designated Faculty Mentor
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">{faculty.name}</p>
                <p className="text-xs text-slate-500">
                  {faculty.facultyProfile?.designation || 'Associate Professor'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {faculty.email}
              </span>
              {faculty.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {faculty.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Project Description & Technologies */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Project Description
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {proj.description}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Technologies & Tools
          </h4>
          <div className="flex flex-wrap gap-2">
            {proj.technologies.split(',').map((tech: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-medium"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
