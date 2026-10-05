import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLogItem } from '../../types';
import { ShieldCheck, Search, Filter, Clock, User, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);

      const res: any = await api.get(`/audit-logs?${params.toString()}`);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            System Audit Trail & Security Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident operational trail tracking logins, role escalations, request approvals, and allocation commits.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          {logs.length} Recorded Events
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, entity ID..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </form>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Audited Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CREATE_USER">User Registrations</option>
            <option value="SUBMIT_REQUEST">Request Submissions</option>
            <option value="APPROVE_REQUEST">Request Approvals</option>
            <option value="SUBMIT_PROJECT">Project Submissions</option>
            <option value="APPROVE_PROJECT">Project Approvals</option>
            <option value="GENERATE_ALLOCATION">Allocation Generation</option>
            <option value="FINALIZE_ALLOCATION">Allocation Finalization</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit logs match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Entity Details</th>
                  <th className="py-3.5 px-4">Client IP</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-sans">
                      <span className="font-semibold text-slate-900 block">
                        {log.actor?.name || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.actorRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {log.newValue ? log.newValue : log.entityId || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
