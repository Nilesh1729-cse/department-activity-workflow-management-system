import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { User, Mail, Phone, GraduationCap, Building, Sun, Moon, Laptop, Check, Palette } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (!user) return null;

  const student = user.studentProfile;
  const faculty = user.facultyProfile;

  const themeOptions: { value: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light Mode',
      desc: 'Crisp and bright appearance optimal for daylight hours.',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      desc: 'Reduced eye strain in low-light environments.',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
    },
    {
      value: 'system',
      label: 'System Default',
      desc: 'Automatically synchronizes with your OS color scheme settings.',
      icon: <Laptop className="w-5 h-5 text-slate-400" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          My Department Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Institutional identity records, academic program affiliations, and portal preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
        {/* User Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-brand-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 w-max mt-1 uppercase border border-brand-200/80 dark:border-brand-800/60">
                {user.role.replace('ROLE_', '')}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Account Status:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">ACTIVE</strong>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Email Address
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              {user.email}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Phone Number
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              {user.phone || '+91 98765 43210'}
            </span>
          </div>
        </div>

        {/* Student Specific Profile */}
        {student && (
          <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Student Academic Standing
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Roll Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{student.rollNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Semester</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">Semester {student.currentSemester}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Cumulative CGPA</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{student.cgpa || '8.92'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Cohort</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{student.batch?.name || '2023-2027'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Faculty Specific Profile */}
        {faculty && (
          <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Faculty Department Affiliation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Employee ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{faculty.employeeId}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Designation</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{faculty.designation}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Office Cabin</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{faculty.cabinNumber || 'B-104'}</span>
              </div>
            </div>
            {faculty.specialization && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase block">Research Specialization</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{faculty.specialization}</span>
              </div>
            )}
          </div>
        )}

        {/* Portal Appearance & Theme Preference */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Portal Appearance & Theme
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Active: <strong className="capitalize text-brand-600 dark:text-brand-400">{theme}</strong> ({resolvedTheme})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      {opt.icon}
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      {opt.label}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
