import React from 'react';
import { WorkflowHistoryItem, ApprovalTask } from '../types';
import { CheckCircle2, Clock, XCircle, User as UserIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface WorkflowTimelineProps {
  history: WorkflowHistoryItem[];
  pendingTask?: ApprovalTask | null;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ history, pendingTask }) => {
  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case 'APPROVE':
      case 'APPROVE_REQUEST':
      case 'APPROVE_ACTIVITY':
      case 'APPROVE_PROPOSAL':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'REJECT':
      case 'REJECT_REQUEST':
      case 'REJECT_ACTIVITY':
      case 'REJECT_PROPOSAL':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'SUBMIT':
      case 'SUBMIT_REQUEST':
      case 'SUBMIT_ACTIVITY':
      case 'SUBMIT_PROPOSAL':
      default:
        return <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        Workflow & Approval Timeline
      </h3>

      <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {history.map((item) => (
          <div key={item.id} className="relative group">
            {/* Timeline icon */}
            <div className="absolute -left-6 mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xs group-hover:border-brand-500 transition-colors">
              {getActionIcon(item.action)}
            </div>

            <div className="bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 rounded-lg p-4 border border-slate-100 dark:border-slate-800 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {item.action.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={item.newStatus} size="sm" />
                </div>
                <time className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.timestamp)}</time>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.actor.name}</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {item.actorRole.replace('ROLE_', '')}
                </span>
              </div>

              {item.comments && (
                <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/70 dark:border-slate-700 italic">
                  "{item.comments}"
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Pending next step if present */}
        {pendingTask && (
          <div className="relative group">
            <div className="absolute -left-6 mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-600 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-amber-900 dark:text-amber-200 text-sm">
                  Awaiting Review & Approval
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300">
                  {pendingTask.assignedRole.replace('ROLE_', '')} ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                This item is currently queued for evaluation by designated authority.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
