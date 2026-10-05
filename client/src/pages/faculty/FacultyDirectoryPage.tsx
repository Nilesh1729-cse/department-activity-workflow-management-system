import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FacultyProfile } from '../../types';
import { UserCheck, Search, Mail, Phone, Building } from 'lucide-react';

export const FacultyDirectoryPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res: any = await api.get(`/faculty?${params.toString()}`);
      if (res.success && res.data) {
        setFacultyList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFaculty();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
            Faculty Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department teaching and research faculty, designations, specializations, and office cabins.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          {facultyList.length} Faculty Members
        </span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by faculty name, employee ID, specialization..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </form>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No faculty members found matching search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {f.employeeId}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {f.user?.role.replace('ROLE_', '')}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{f.user?.name}</h4>
                <p className="text-xs text-brand-700 font-medium mt-0.5">{f.designation}</p>

                {f.specialization && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    <strong className="text-slate-700 font-semibold">Specialization:</strong>{' '}
                    {f.specialization}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cabin: {f.cabinNumber || 'Academic Block'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{f.user?.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
