import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StudentProfile, Program, Batch } from '../../types';
import { Users, Search, GraduationCap, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export const StudentsDirectoryPage: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [progRes, batchRes]: any = await Promise.all([
          api.get('/academic/programs'),
          api.get('/academic/batches'),
        ]);
        if (progRes.success) setPrograms(progRes.data);
        if (batchRes.success) setBatches(batchRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedProgram) params.append('programId', selectedProgram);
      if (selectedBatch) params.append('batchId', selectedBatch);

      const res: any = await api.get(`/students?${params.toString()}`);
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedProgram, selectedBatch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Students Academic Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department roster of registered undergraduate and postgraduate engineering scholars.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          {students.length} Total Scholars
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll number, or email..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Degree & Batch</th>
                  <th className="py-3.5 px-4">Semester</th>
                  <th className="py-3.5 px-4">CGPA</th>
                  <th className="py-3.5 px-4">Allocated Capstone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{s.user?.name}</p>
                      <p className="text-[11px] text-slate-400">{s.user?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {s.rollNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block">{s.program.name}</span>
                      <span className="text-[11px] text-slate-400">Batch {s.batch.name}</span>
                    </td>
                    <td className="py-3.5 px-4">Sem {s.currentSemester}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.cgpa != null ? s.cgpa.toFixed(2) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.allocation ? (
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {s.allocation.project.projectCode}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {s.allocation.project.title.slice(0, 30)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unallocated</span>
                      )}
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
