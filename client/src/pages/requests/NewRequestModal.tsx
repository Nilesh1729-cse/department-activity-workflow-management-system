import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';
import { RequestType } from '../../types';
import { AlertCircle } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [requestType, setRequestType] = useState<RequestType>('LEAVE_OD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const requestTypeOptions: { value: RequestType; label: string }[] = [
    { value: 'LEAVE_OD', label: 'On-Duty (OD) / Leave Permission' },
    { value: 'SEMINAR_PERMISSION', label: 'Seminar / Conference Attendance' },
    { value: 'EVENT_PERMISSION', label: 'College / Inter-Collegiate Event' },
    { value: 'PROJECT_RELATED', label: 'Project-Related Requisition' },
    { value: 'RESOURCE_REQUEST', label: 'Lab Computing / Server Resource Request' },
    { value: 'OTHER', label: 'Other Departmental Request' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/requests', {
        requestType,
        title,
        description,
        submitImmediately,
      });

      setTitle('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Departmental Request" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Request Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as RequestType)}
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {requestTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Subject / Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Permission to attend National AI Research Summit 2026"
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Detailed Reason / Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, dates, venue, or technical justification..."
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="submitImmediately"
            checked={submitImmediately}
            onChange={(e) => setSubmitImmediately(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
          />
          <label htmlFor="submitImmediately" className="text-xs font-medium text-slate-700 cursor-pointer">
            Submit directly for HOD evaluation (Recommended)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Creating...' : submitImmediately ? 'Submit to HOD' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
