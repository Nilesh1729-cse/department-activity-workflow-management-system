import React from 'react';
import { WorkflowStatus, ProjectStatus, AllocationStatus, TaskStatus } from '../types';

interface StatusBadgeProps {
  status: WorkflowStatus | ProjectStatus | AllocationStatus | TaskStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  switch (normalized) {
    case 'APPROVED':
    case 'FINALIZED':
    case 'COMPLETED':
      colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      break;
    case 'SUBMITTED':
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'UNDER_REVIEW':
    case 'HOD_REVIEW':
    case 'GENERATED':
      colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      break;
    case 'REJECTED':
    case 'CANCELLED':
      colorClasses = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      break;
    case 'FULL':
      colorClasses = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      break;
    case 'DRAFT':
    default:
      colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs tracking-wide uppercase transition-colors ${sizeClasses} ${colorClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatText(status)}
    </span>
  );
};
