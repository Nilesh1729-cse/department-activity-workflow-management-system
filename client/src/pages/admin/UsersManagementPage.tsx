import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { User, Role } from '../../types';
import { CreateUserModal } from './CreateUserModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Power,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole) params.append('role', selectedRole);

      const res: any = await api.get(`/users?${params.toString()}`);
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      setMessage(`User account ${currentActive ? 'deactivated' : 'activated'} successfully.`);
      setTimeout(() => setMessage(''), 3000);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">ADMIN</span>;
      case 'ROLE_HOD':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">HOD</span>;
      case 'ROLE_FACULTY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">FACULTY</span>;
      case 'ROLE_STUDENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">STUDENT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            User Management & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provision faculty, staff, and student accounts, assign security roles, and enforce account activation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name or email..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Security Roles</option>
            <option value="ROLE_STUDENT">Students</option>
            <option value="ROLE_FACULTY">Faculty</option>
            <option value="ROLE_HOD">HOD</option>
            <option value="ROLE_ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No user accounts found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Profile Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {u.studentProfile ? (
                        <span>
                          Roll: <strong className="font-mono text-slate-800">{u.studentProfile.rollNumber}</strong> ({u.studentProfile.program?.code})
                        </span>
                      ) : u.facultyProfile ? (
                        <span>
                          EMP: <strong className="font-mono text-slate-800">{u.facultyProfile.employeeId}</strong> • {u.facultyProfile.designation}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          u.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchUsers}
      />
    </div>
  );
};
