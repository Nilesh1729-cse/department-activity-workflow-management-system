import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';
import { AnnouncementAudience, AnnouncementPriority } from '../../types';
import { AlertCircle } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('ALL');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/announcements', {
        title,
        content,
        audience,
        priority,
      });

      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish Department Announcement" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Announcement Headline <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Capstone Project Final Presentation Schedule"
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">Everyone (All)</option>
              <option value="STUDENTS">Students Only</option>
              <option value="FACULTY">Faculty Only</option>
              <option value="UG">Undergraduate (UG)</option>
              <option value="PG">Postgraduate (PG)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent Alert</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Notice Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write announcement details, dates, instructions..."
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
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
            {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
