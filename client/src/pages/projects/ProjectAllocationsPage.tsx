import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Program, Batch } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  FolderGit2,
  Play,
  CheckCircle,
  AlertCircle,
  Users,
  GraduationCap,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ProjectAllocationsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load programs & batches
  useEffect(() => {
    const initAcademic = async () => {
      try {
        const [progRes, batchRes]: any = await Promise.all([
          api.get('/academic/programs'),
          api.get('/academic/batches'),
        ]);

        if (progRes.success && progRes.data.length > 0) {
          setPrograms(progRes.data);
          setSelectedProgramId(progRes.data[0].id);
        }
        if (batchRes.success && batchRes.data.length > 0) {
          setBatches(batchRes.data);
          setSelectedBatchId(batchRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initAcademic();
  }, []);

  const fetchOverview = async () => {
    if (!selectedProgramId || !selectedBatchId) return;
    try {
      setLoading(true);
      const res: any = await api.get(
        `/allocations?programId=${selectedProgramId}&batchId=${selectedBatchId}`
      );
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedProgramId, selectedBatchId]);

  // Execute Allocation Algorithm
  const handleGenerate = async () => {
    setIsGenerating(true);
    setFeedback(null);
    try {
      const res: any = await api.post('/allocations/generate', {
        programId: selectedProgramId,
        batchId: selectedBatchId,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Allocation preview successfully computed for ${res.data.length} students. Inspect assignments below before finalization.`,
        });
        fetchOverview();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to generate allocation.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Finalize Allocation Commit
  const handleFinalize = async () => {
    try {
      const res: any = await api.post('/allocations/finalize', {
        programId: selectedProgramId,
        batchId: selectedBatchId,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'Allocations finalized successfully! Student dashboards updated.',
        });
        fetchOverview();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to finalize allocation.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-600" />
            Capstone Project Allocation Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated deterministic preference matching algorithm honoring faculty capacity, student ranked choices, and merit ranking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {isGenerating ? 'Running Matching Algorithm...' : 'Generate Allocation Preview'}
          </button>

          <button
            onClick={() => setIsFinalizeOpen(true)}
            disabled={loading || !overview?.students?.some((s: any) => s.allocation?.status === 'GENERATED')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            Finalize & Sanction
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Cohort Selector & KPIs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Degree Program</label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 p-2 font-medium bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Academic Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 p-2 font-medium bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Eligible Students</span>
            <span className="text-slate-900 text-sm">{overview?.totalStudents || 0}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Finalized</span>
            <span className="text-emerald-600 text-sm">{overview?.allocatedStudents || 0}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Preview Matches</span>
            <span className="text-amber-600 text-sm">{overview?.generatedAllocations || 0}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Total Project Capacity</span>
            <span className="text-indigo-600 text-sm">{overview?.totalCapacity || 0} Seats</span>
          </div>
        </div>
      </div>

      {/* Allocation Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">
            Student Cohort Preference & Assignment Roster
          </h3>
          <span className="text-xs text-slate-400">Deterministic sorting: CGPA Descending</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : !overview?.students || overview.students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found in this program and batch cohort.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">CGPA</th>
                  <th className="py-3.5 px-4">Submitted Preferences</th>
                  <th className="py-3.5 px-4">Allocated Project</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Matching Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.students.map((student: any) => {
                  const alloc = student.allocation;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{student.user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{student.rollNumber}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {student.cgpa !== null ? student.cgpa.toFixed(2) : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        {student.preferences && student.preferences.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {student.preferences.map((p: any) => (
                              <span
                                key={p.id}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono"
                                title={p.project.title}
                              >
                                #{p.rank}: {p.project.projectCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No preferences submitted</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {alloc ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {alloc.project.projectCode}: {alloc.project.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Mentor: {alloc.project.faculty.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unallocated</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {alloc ? (
                          <StatusBadge status={alloc.status} size="sm" />
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-medium">
                            UNASSIGNED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs">
                        {alloc?.allocationReason || 'Pending matching computation'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finalize Dialog */}
      <ConfirmDialog
        isOpen={isFinalizeOpen}
        onClose={() => setIsFinalizeOpen(false)}
        onConfirm={handleFinalize}
        title="Finalize & Publish Project Allocations"
        message="Are you sure you want to finalize this allocation round? All matched students and faculty mentors will be officially notified and project capacities committed."
        confirmText="Finalize All Assignments"
        confirmVariant="success"
      />
    </div>
  );
};
