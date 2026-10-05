import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Department, Program, Batch } from '../../types';
import { Modal } from '../../components/Modal';
import { Building2, Layers, Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export const AcademicManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [progForm, setProgForm] = useState({ departmentId: '', name: '', code: '', level: 'UG', durationYears: '4' });
  const [batchForm, setBatchForm] = useState({ programId: '', name: '', startYear: '2025', endYear: '2029' });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAcademic = async () => {
    try {
      setLoading(true);
      const [deptRes, progRes, batchRes]: any = await Promise.all([
        api.get('/academic/departments'),
        api.get('/academic/programs'),
        api.get('/academic/batches'),
      ]);

      if (deptRes.success) setDepartments(deptRes.data);
      if (progRes.success) {
        setPrograms(progRes.data);
        if (progRes.data.length > 0) {
          setProgForm((prev) => ({ ...prev, departmentId: deptRes.data[0]?.id || '' }));
          setBatchForm((prev) => ({ ...prev, programId: progRes.data[0]?.id || '' }));
        }
      }
      if (batchRes.success) setBatches(batchRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademic();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/departments', deptForm);
      setMessage('Department created successfully');
      setDeptForm({ name: '', code: '', description: '' });
      setIsDeptModalOpen(false);
      fetchAcademic();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    }
  };

  const handleCreateProg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/programs', {
        ...progForm,
        durationYears: Number(progForm.durationYears) || 4,
      });
      setMessage('Program created successfully');
      setProgForm({ departmentId: departments[0]?.id || '', name: '', code: '', level: 'UG', durationYears: '4' });
      setIsProgModalOpen(false);
      fetchAcademic();
    } catch (err: any) {
      setError(err.message || 'Failed to create program');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/batches', {
        programId: batchForm.programId,
        name: batchForm.name,
        startYear: Number(batchForm.startYear),
        endYear: Number(batchForm.endYear),
      });
      setMessage('Batch cohort created successfully');
      setBatchForm({ programId: programs[0]?.id || '', name: '', startYear: '2025', endYear: '2029' });
      setIsBatchModalOpen(false);
      fetchAcademic();
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Academic Hierarchy Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department faculties, degree programs (UG/PG), and academic batch cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Department
          </button>
          <button
            onClick={() => setIsProgModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            + Program
          </button>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-colors cursor-pointer"
          >
            + Batch Cohort
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Departments & Programs View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            Configured Departments ({departments.length})
          </h3>

          <div className="space-y-3">
            {departments.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{d.name}</h4>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {d.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{d.description || 'No description provided'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Degree Programs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            Academic Degree Programs ({programs.length})
          </h3>

          <div className="space-y-3">
            {programs.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                    {p.level} • {p.durationYears} Years
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Code: {p.code}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            Registered Academic Batch Cohorts ({batches.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Batch Cohort</th>
                <th className="py-3.5 px-4">Degree Program</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{b.name}</td>
                  <td className="py-3.5 px-4">{b.program?.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {b.startYear} – {b.endYear}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Department Modal */}
      <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title="Add Department" maxWidth="md">
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Information Technology"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="IT"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg">Create</button>
          </div>
        </form>
      </Modal>

      {/* Create Program Modal */}
      <Modal isOpen={isProgModalOpen} onClose={() => setIsProgModalOpen(false)} title="Add Degree Program" maxWidth="md">
        <form onSubmit={handleCreateProg} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={progForm.departmentId}
              onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Program Name</label>
            <input
              type="text"
              required
              value={progForm.name}
              onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
              placeholder="e.g. B.Tech Artificial Intelligence"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Program Code</label>
              <input
                type="text"
                required
                value={progForm.code}
                onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                placeholder="BT-AI"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Level</label>
              <select
                value={progForm.level}
                onChange={(e) => setProgForm({ ...progForm, level: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="UG">Undergraduate (UG)</option>
                <option value="PG">Postgraduate (PG)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsProgModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg">Create</button>
          </div>
        </form>
      </Modal>

      {/* Create Batch Modal */}
      <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Add Batch Cohort" maxWidth="md">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
            <select
              value={batchForm.programId}
              onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Name</label>
            <input
              type="text"
              required
              value={batchForm.name}
              onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
              placeholder="e.g. 2025-2029"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Year</label>
              <input
                type="number"
                required
                value={batchForm.startYear}
                onChange={(e) => setBatchForm({ ...batchForm, startYear: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Year</label>
              <input
                type="number"
                required
                value={batchForm.endYear}
                onChange={(e) => setBatchForm({ ...batchForm, endYear: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsBatchModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
