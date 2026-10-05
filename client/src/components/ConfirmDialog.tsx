import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments?: string) => Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  requireComments?: boolean;
  commentsPlaceholder?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  requireComments = false,
  commentsPlaceholder = 'Enter remarks/comments...',
}) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireComments && (!comments || comments.trim().length === 0)) {
      setError('Please provide comments/reasons before proceeding.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(comments);
      setComments('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonColors = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  }[confirmVariant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

        {(requireComments || commentsPlaceholder) && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Comments / Endorsement Remarks {requireComments && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={commentsPlaceholder}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-xs ${buttonColors}`}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
