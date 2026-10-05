import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';
import { ActivityType } from '../../types';
import { AlertCircle } from 'lucide-react';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewActivityModal: React.FC<NewActivityModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [activityType, setActivityType] = useState<ActivityType>('WORKSHOP');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [venue, setVenue] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('100');
  const [budget, setBudget] = useState('15000');
  const [organizer, setOrganizer] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activityOptions: { value: ActivityType; label: string }[] = [
    { value: 'WORKSHOP', label: 'Technical Hands-On Workshop' },
    { value: 'SEMINAR', label: 'Academic Seminar' },
    { value: 'GUEST_LECTURE', label: 'Distinguished Industry Guest Lecture' },
    { value: 'TECHNICAL_EVENT', label: 'Technical Competition / Hackathon' },
    { value: 'INDUSTRIAL_VISIT', label: 'Industrial Field Visit' },
    { value: 'CONFERENCE', label: 'National / International Conference' },
    { value: 'DEPARTMENT_MEETING', label: 'Faculty / Departmental Meeting' },
    { value: 'OTHER', label: 'Other Academic Activity' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !proposedDate || !venue.trim() || !organizer.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/activities', {
        title,
        activityType,
        description,
        proposedDate: new Date(proposedDate).toISOString(),
        venue,
        expectedParticipants: Number(expectedParticipants) || 0,
        budget: Number(budget) || 0,
        organizer,
        remarks,
        submitImmediately,
      });

      setTitle('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propose Department Activity" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activity Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {activityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Proposed Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Activity Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2-Day Workshop on Quantum Computing Protocols"
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Scope & Objectives <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline topics covered, target student batches, speaker credentials, and learning outcomes..."
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Venue <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. CSE Seminar Hall 2"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Participants <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={expectedParticipants}
              onChange={(e) => setExpectedParticipants(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Budget (INR ₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Organizer / Student Chapter <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="e.g. IEEE Student Branch & CSE Department"
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="submitActivityNow"
            checked={submitImmediately}
            onChange={(e) => setSubmitImmediately(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
          />
          <label htmlFor="submitActivityNow" className="text-xs font-medium text-slate-700 cursor-pointer">
            Submit directly for HOD administrative approval
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
