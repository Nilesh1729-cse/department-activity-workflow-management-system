import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, GraduationCap, Building, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const student = user.studentProfile;
  const faculty = user.facultyProfile;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-600" />
          My Department Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Institutional identity records and academic program affiliations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-brand-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <p className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 w-max mt-1 uppercase">
                {user.role.replace('ROLE_', '')}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Account Status:{' '}
            <strong className="text-emerald-600 font-semibold uppercase">ACTIVE</strong>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </span>
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.email}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Phone Number
            </span>
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              {user.phone || '+91 98765 43210'}
            </span>
          </div>
        </div>

        {/* Student Specific Profile */}
        {student && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              Student Academic Standing
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Roll Number</span>
                <span className="font-mono font-bold text-slate-900">{student.rollNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Semester</span>
                <span className="font-bold text-slate-900">Semester {student.currentSemester}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Cumulative CGPA</span>
                <span className="font-bold text-emerald-600">{student.cgpa || '8.92'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Cohort</span>
                <span className="font-bold text-slate-900">{student.batch?.name || '2023-2027'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Faculty Specific Profile */}
        {faculty && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-600" />
              Faculty Department Affiliation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Employee ID</span>
                <span className="font-mono font-bold text-slate-900">{faculty.employeeId}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Designation</span>
                <span className="font-bold text-slate-900">{faculty.designation}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Office Cabin</span>
                <span className="font-bold text-slate-900">{faculty.cabinNumber || 'B-104'}</span>
              </div>
            </div>
            {faculty.specialization && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs">
                <span className="text-[10px] text-slate-400 uppercase block">Research Specialization</span>
                <span className="font-medium text-slate-800">{faculty.specialization}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
