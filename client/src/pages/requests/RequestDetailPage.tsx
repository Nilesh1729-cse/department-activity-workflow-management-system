import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { WorkflowTimeline } from '../../components/WorkflowTimeline';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  FileText,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  User,
  GraduationCap,
  Paperclip,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { RequestItem, WorkflowHistoryItem, ApprovalTask, DocumentItem } from '../../types';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([]);
  const [pendingTask, setPendingTask] = useState<ApprovalTask | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/requests/${id}`);
      if (res.success && res.data) {
        setRequest(res.data.request);
        setHistory(res.data.workflowHistory || []);
        setPendingTask(res.data.pendingTask || null);
        setDocuments(res.data.documents || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Handle student manual submit if in DRAFT
  const handleSubmitToHod = async () => {
    try {
      setActionError('');
      await api.post(`/requests/${id}/submit`, {
        comments: 'Submitted by student for formal evaluation',
      });
      fetchRequestDetails();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit');
    }
  };

  // Handle HOD approve
  const handleApprove = async (comments?: string) => {
    if (!pendingTask) return;
    await api.post(`/approvals/${pendingTask.id}/approve`, {
      comments: comments || 'Approved by HOD',
    });
    fetchRequestDetails();
  };

  // Handle HOD reject
  const handleReject = async (comments?: string) => {
    if (!pendingTask) return;
    await api.post(`/approvals/${pendingTask.id}/reject`, {
      comments: comments || 'Rejected by HOD',
    });
    fetchRequestDetails();
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'REQUEST');
    formData.append('entityId', id!);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchRequestDetails();
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800">Error Loading Request</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Request not found'}</p>
        <Link to="/requests" className="mt-4 inline-block text-xs font-semibold text-brand-600">
          Return to requests list
        </Link>
      </div>
    );
  }

  const isHodOrAdmin = user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN';
  const isOwner = user?.id === request.studentId;
  const canApprove = isHodOrAdmin && pendingTask && pendingTask.status === 'PENDING';
  const canSubmit = isOwner && request.status === 'DRAFT';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} size="lg" />
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Request Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200/80 uppercase">
                {request.requestType.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">ID: {request.id.slice(0, 8)}...</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {request.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Submitted on {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Action Buttons for HOD / Student */}
          <div className="flex items-center gap-2 shrink-0">
            {canSubmit && (
              <button
                onClick={handleSubmitToHod}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit to HOD
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
                  Approve Request
                </button>
              </>
            )}
          </div>
        </div>

        {/* Requester Identity & Academic Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{request.student?.name}</p>
              <p className="text-slate-400">{request.student?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="font-semibold text-slate-800">
                Roll No: {request.student?.studentProfile?.rollNumber || 'N/A'}
              </p>
              <p className="text-slate-400">
                {request.student?.studentProfile?.program?.name || 'B.Tech CSE'} (Batch{' '}
                {request.student?.studentProfile?.batch?.name || '2023-2027'})
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="py-6 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Statement of Purpose / Justification
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* Documents Attachment Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" />
              Attached Endorsements & Documents ({documents.length})
            </h3>
            {isOwner && (
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                <Upload className="w-3.5 h-3.5" />
                Attach File
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                />
              </label>
            )}
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No document attachments uploaded.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700 group"
                >
                  <span className="truncate group-hover:text-brand-600">{doc.fileName}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {(doc.fileSize / 1024).toFixed(1)} KB
                  </span>
                </a>
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
        title="Sanction Departmental Request"
        message="Are you sure you want to approve this student request? The decision will be permanently archived in the workflow timeline."
        confirmText="Confirm Approval"
        confirmVariant="success"
        commentsPlaceholder="Add approval conditions, lab instructions, or remarks..."
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Departmental Request"
        message="Please state the administrative reason for returning or rejecting this request."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        requireComments={true}
        commentsPlaceholder="Specify deficiencies or reasons for rejection..."
      />
    </div>
  );
};
