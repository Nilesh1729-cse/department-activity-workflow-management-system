import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { AnnouncementItem } from '../../types';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { Megaphone, Plus, Trash2, Calendar, User, Search, AlertCircle } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedPriority) params.append('priority', selectedPriority);

      const res: any = await api.get(`/announcements?${params.toString()}`);
      if (res.success && res.data) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedPriority]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const isHodOrAdmin = user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Department Announcements & Bulletins
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official department notices, academic deadlines, competition guidelines, and event circulars.
          </p>
        </div>

        {isHodOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAnnouncements()}
            placeholder="Search bulletins..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent Alerts</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
          No notices found matching query.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      ann.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-700'
                        : ann.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Audience: {ann.audience}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ann.publishDate).toLocaleDateString()}
                  </span>
                  {isHodOrAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight">{ann.title}</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </p>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Posted by <strong>{ann.author.name}</strong> ({ann.author.role.replace('ROLE_', '')})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchAnnouncements}
      />
    </div>
  );
};
