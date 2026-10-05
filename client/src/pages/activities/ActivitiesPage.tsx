import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ActivityItem } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { NewActivityModal } from './NewActivityModal';
import {
  CalendarDays,
  Plus,
  Search,
  ArrowRight,
  MapPin,
  Users,
  IndianRupee,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);

      const res: any = await api.get(`/activities?${params.toString()}`);
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivities();
  };

  const isFacultyOrHod =
    user?.role === 'ROLE_FACULTY' || user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-600" />
            Department Activities & Workflows
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Faculty proposals for academic seminars, student workshops, guest lectures, and institutional symposiums.
          </p>
        </div>

        {isFacultyOrHod && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Propose Activity
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, venue, or organizer..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="SEMINAR">Seminar</option>
              <option value="GUEST_LECTURE">Guest Lecture</option>
              <option value="TECHNICAL_EVENT">Technical Event</option>
              <option value="CONFERENCE">Conference</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Approval Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted / In Review</option>
              <option value="APPROVED">Approved / Active</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </form>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No departmental activities found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search parameters or propose a new departmental event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 uppercase">
                    {act.activityType.replace('_', ' ')}
                  </span>
                  <StatusBadge status={act.status} size="sm" />
                </div>

                <Link
                  to={`/activities/${act.id}`}
                  className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors block mb-1.5"
                >
                  {act.title}
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {act.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {act.venue}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {act.expectedParticipants} Expected
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-900">
                    ₹{act.budget.toLocaleString('en-IN')} Budget
                  </span>
                  <Link
                    to={`/activities/${act.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 text-xs"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <NewActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchActivities}
      />
    </div>
  );
};
