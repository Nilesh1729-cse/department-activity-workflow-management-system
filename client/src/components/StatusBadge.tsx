import React from 'react';
import { WorkflowStatus, ProjectStatus, AllocationStatus, TaskStatus } from '../types';

interface StatusBadgeProps {
  status: WorkflowStatus | ProjectStatus | AllocationStatus | TaskStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (normalized) {
    case 'APPROVED':
    case 'FINALIZED':
    case 'COMPLETED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'SUBMITTED':
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'UNDER_REVIEW':
    case 'HOD_REVIEW':
    case 'GENERATED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'REJECTED':
    case 'CANCELLED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'FULL':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'DRAFT':
    default:
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
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
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-xs tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatText(status)}
    </span>
  );
};
