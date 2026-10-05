import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';
import { Role, Program, Batch, Department } from '../../types';
import { AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [role, setRole] = useState<Role>('ROLE_STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Demo@123');
  const [phone, setPhone] = useState('+91 ');

  // Student fields
  const [rollNumber, setRollNumber] = useState('');
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [currentSemester, setCurrentSemester] = useState('1');
  const [cgpa, setCgpa] = useState('8.50');

  // Faculty fields
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specialization, setSpecialization] = useState('Artificial Intelligence');
  const [cabinNumber, setCabinNumber] = useState('B-101');

  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [deptRes, progRes, batchRes]: any = await Promise.all([
          api.get('/academic/departments'),
          api.get('/academic/programs'),
          api.get('/academic/batches'),
        ]);

        if (deptRes.success && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
          setDepartmentId(deptRes.data[0].id);
        }
        if (progRes.success && progRes.data.length > 0) {
          setPrograms(progRes.data);
          setProgramId(progRes.data[0].id);
        }
        if (batchRes.success && batchRes.data.length > 0) {
          setBatches(batchRes.data);
          setBatchId(batchRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) {
      fetchDropdowns();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload: any = {
        name,
        email,
        password,
        phone,
        role,
      };

      if (role === 'ROLE_STUDENT') {
        payload.rollNumber = rollNumber;
        payload.programId = programId;
        payload.batchId = batchId;
        payload.currentSemester = Number(currentSemester) || 1;
        payload.cgpa = Number(cgpa) || null;
      } else if (role === 'ROLE_FACULTY' || role === 'ROLE_HOD') {
        payload.employeeId = employeeId;
        payload.departmentId = departmentId;
        payload.designation = designation;
        payload.specialization = specialization;
        payload.cabinNumber = cabinNumber;
      }

      await api.post('/users', payload);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Department Account" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">User Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="ROLE_STUDENT">Student (Scholars)</option>
              <option value="ROLE_FACULTY">Faculty Member</option>
              <option value="ROLE_HOD">Head of Department (HOD)</option>
              <option value="ROLE_ADMIN">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anand Kumar"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. akumar@department.local"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Student Specific Fields */}
        {role === 'ROLE_STUDENT' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Academic Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="23CS003"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Degree Program</label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch Cohort</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Faculty Specific Fields */}
        {(role === 'ROLE_FACULTY' || role === 'ROLE_HOD') && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Faculty Staff Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-CSE-004"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Assistant Professor"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Cloud & Distributed Systems"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Creating User...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
