import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { RequestItem, WorkflowStatus, RequestType } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { NewRequestModal } from './NewRequestModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const RequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedType) params.append('type', selectedType);

      const res: any = await api.get(`/requests?${params.toString()}`);
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            {user?.role === 'ROLE_STUDENT' ? 'My Departmental Requests' : 'Department Request Registry'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track on-duty permissions, conference attendance, laboratory resource requisition, and formal approvals.
          </p>
        </div>

        {user?.role === 'ROLE_STUDENT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Request
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
              placeholder="Search by title or description..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted / In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Request Types</option>
              <option value="LEAVE_OD">On-Duty / Leave</option>
              <option value="SEMINAR_PERMISSION">Seminar Attendance</option>
              <option value="EVENT_PERMISSION">Event Permission</option>
              <option value="PROJECT_RELATED">Project Requisition</option>
              <option value="RESOURCE_REQUEST">Lab / Server Resource</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </form>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {user?.role === 'ROLE_STUDENT'
                ? 'You have not submitted any departmental requests matching the current filters.'
                : 'No student requests in the registry match the current search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Request Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  {user?.role !== 'ROLE_STUDENT' && <th className="py-3.5 px-4">Student</th>}
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link to={`/requests/${req.id}`} className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block">
                        {req.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">{req.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {req.requestType.replace('_', ' ')}
                      </span>
                    </td>
                    {user?.role !== 'ROLE_STUDENT' && (
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{req.student?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {req.student?.studentProfile?.rollNumber || '23CS001'}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 text-xs"
                      >
                        Inspect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchRequests}
      />
    </div>
  );
};
