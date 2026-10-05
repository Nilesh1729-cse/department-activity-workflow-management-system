import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ApprovalTask } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Calendar,
  FileText,
  Briefcase,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PendingApprovalsPage: React.FC = () => {
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ApprovalTask | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/approvals/pending');
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenApprove = (task: ApprovalTask) => {
    setSelectedTask(task);
    setIsApproveOpen(true);
  };

  const handleOpenReject = (task: ApprovalTask) => {
    setSelectedTask(task);
    setIsRejectOpen(true);
  };

  const handleConfirmApprove = async (comments?: string) => {
    if (!selectedTask) return;
    await api.post(`/approvals/${selectedTask.id}/approve`, {
      comments: comments || 'Approved by authority',
    });
    setSuccessMessage(`Successfully approved ${selectedTask.workflowInstance.entityType.toLowerCase()}`);
    setTimeout(() => setSuccessMessage(''), 4000);
    fetchTasks();
  };

  const handleConfirmReject = async (comments?: string) => {
    if (!selectedTask) return;
    await api.post(`/approvals/${selectedTask.id}/reject`, {
      comments,
    });
    setSuccessMessage(`Successfully rejected ${selectedTask.workflowInstance.entityType.toLowerCase()}`);
    setTimeout(() => setSuccessMessage(''), 4000);
    fetchTasks();
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'REQUEST':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'ACTIVITY':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'PROJECT':
        return <Briefcase className="w-5 h-5 text-emerald-600" />;
      default:
        return <CheckSquare className="w-5 h-5 text-slate-600" />;
    }
  };

  const getEntityLink = (task: ApprovalTask) => {
    const { entityType, entityId } = task.workflowInstance;
    switch (entityType) {
      case 'REQUEST':
        return `/requests/${entityId}`;
      case 'ACTIVITY':
        return `/activities/${entityId}`;
      case 'PROJECT':
        return `/projects/${entityId}`;
      default:
        return '/';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            Authority Pending Approvals Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate, sanction, or reject submitted student requests, faculty project proposals, and departmental activity requests.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold self-start sm:self-auto">
          {tasks.length} Action Items Pending
        </span>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Task Queue Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Approvals Inbox is Clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            There are currently no submissions awaiting your review or endorsement.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const details = task.entityDetails;
            const entityType = task.workflowInstance.entityType;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {getEntityIcon(entityType)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 uppercase">
                        {entityType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {details?.title || `${entityType} Submission`}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {details?.description || 'No description provided'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Requester:{' '}
                        <strong>
                          {details?.student?.name || details?.faculty?.name || 'Department Member'}
                        </strong>
                      </span>
                      {details?.student?.studentProfile?.rollNumber && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({details.student.studentProfile.rollNumber})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                  <Link
                    to={getEntityLink(task)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Inspect Details
                  </Link>
                  <button
                    onClick={() => handleOpenReject(task)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleOpenApprove(task)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleConfirmApprove}
        title={`Approve ${selectedTask?.workflowInstance.entityType || 'Task'}`}
        message="Are you sure you want to approve this submission? It will advance the workflow state and notify the requester."
        confirmText="Confirm Approval"
        confirmVariant="success"
        commentsPlaceholder="Add formal approval remarks or instructions..."
      />

      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleConfirmReject}
        title={`Reject ${selectedTask?.workflowInstance.entityType || 'Task'}`}
        message="Please state the administrative or academic reason for rejecting this item."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        requireComments={true}
        commentsPlaceholder="Specify deficiencies or grounds for rejection..."
      />
    </div>
  );
};
