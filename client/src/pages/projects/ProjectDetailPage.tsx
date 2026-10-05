import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { WorkflowTimeline } from '../../components/WorkflowTimeline';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  Briefcase,
  ArrowLeft,
  Users,
  Code2,
  CheckCircle,
  XCircle,
  Send,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { ProjectItem, WorkflowHistoryItem, ApprovalTask } from '../../types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [pendingTask, setPendingTask] = useState<ApprovalTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/projects/${id}`);
      if (res.success && res.data) {
        setProject(res.data.project);
        setHistory(res.data.workflowHistory || []);
        setPendingTask(res.data.pendingTask || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleSubmitToHod = async () => {
    try {
      setActionError('');
      await api.post(`/projects/${id}/submit`, {
        comments: 'Faculty mentor submitted proposal for HOD review',
      });
      fetchProjectDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit proposal');
    }
  };

  const handleApprove = async (comments?: string) => {
    if (!pendingTask) return;
    await api.post(`/approvals/${pendingTask.id}/approve`, {
      comments: comments || 'Approved into capstone allocation pool',
    });
    fetchProjectDetails();
  };

  const handleReject = async (comments?: string) => {
    if (!pendingTask) return;
    await api.post(`/approvals/${pendingTask.id}/reject`, {
      comments: comments || 'Proposal rejected by HOD',
    });
    fetchProjectDetails();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800">Error Loading Project</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Project not found'}</p>
        <Link to="/projects" className="mt-4 inline-block text-xs font-semibold text-brand-600">
          Return to projects pool
        </Link>
      </div>
    );
  }

  const isHodOrAdmin = user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN';
  const isOwner = user?.id === project.facultyId;
  const canApprove = isHodOrAdmin && pendingTask && pendingTask.status === 'PENDING';
  const canSubmit = isOwner && project.status === 'DRAFT';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <StatusBadge status={project.status} size="lg" />
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Project Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 uppercase">
                {project.projectCode}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700">
                {project.difficulty}
              </span>
              <span className="text-xs text-slate-400">
                {project.program?.name} • Batch {project.batch?.name}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.title}
            </h1>

            <p className="text-xs text-slate-500 mt-1 font-medium">
              Domain: <strong className="text-slate-700">{project.domain}</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canSubmit && (
              <button
                onClick={handleSubmitToHod}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit Proposal
              </button>
            )}

            {canApprove && (
              <>
                <button
                  onClick={() => setIsRejectOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setIsApproveOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Proposal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mentor & Capacity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{project.faculty?.name}</p>
              <p className="text-slate-400">
                {project.faculty?.facultyProfile?.designation || 'Faculty Mentor'} •{' '}
                {project.faculty?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center sm:justify-end gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
                Allocation Capacity
              </span>
              <span className="font-bold text-slate-800 text-sm">
                {project.allocatedCount} / {project.maxStudents} Students Allocated
              </span>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="py-4 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-brand-600" />
            Technologies, Frameworks & Tooling
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.split(',').map((tech, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-medium"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Scope */}
        <div className="py-6 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Project Abstract & Deliverables
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Allocated Students Section */}
        <div className="pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Allocated Student Mentees (
            {project.allocations ? project.allocations.length : 0})
          </h3>

          {!project.allocations || project.allocations.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No students currently allocated to this project.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.allocations.map((alloc) => (
                <div
                  key={alloc.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-900">
                      {alloc.studentProfile.user?.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Roll No: {alloc.studentProfile.rollNumber}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Allocated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Workflow Timeline */}
      <WorkflowTimeline history={history} pendingTask={pendingTask} />

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
        title="Sanction Project Proposal"
        message="Are you sure you want to approve this project proposal? It will immediately enter the active capstone allocation pool for eligible students."
        confirmText="Confirm Approval"
        confirmVariant="success"
        commentsPlaceholder="Add formal approval remarks..."
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Project Proposal"
        message="Please state the academic or technical grounds for returning this proposal to the faculty mentor."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        requireComments={true}
        commentsPlaceholder="Specify scope overlap, difficulty concerns, or required modifications..."
      />
    </div>
  );
};
