import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'Admin', email: 'admin@department.local', role: 'ROLE_ADMIN', color: 'bg-purple-100 text-purple-700' },
    { label: 'HOD (Dr. Ramanathan)', email: 'hod@department.local', role: 'ROLE_HOD', color: 'bg-blue-100 text-blue-700' },
    { label: 'Faculty 1 (Prof. Anita)', email: 'faculty1@department.local', role: 'ROLE_FACULTY', color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Faculty 2 (Dr. Rajesh)', email: 'faculty2@department.local', role: 'ROLE_FACULTY', color: 'bg-teal-100 text-teal-700' },
    { label: 'Student 1 (Rahul Verma)', email: 'student1@department.local', role: 'ROLE_STUDENT', color: 'bg-amber-100 text-amber-800' },
    { label: 'Student 2 (Priya Patel)', email: 'student2@department.local', role: 'ROLE_STUDENT', color: 'bg-orange-100 text-orange-800' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-20 bg-white/10 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/10 dark:border-slate-700/60 p-1">
        <ThemeToggle />
      </div>

      {/* Background aesthetic blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-xl shadow-brand-500/25 mb-4">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Department Activity & Workflow Portal
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Department of Computer Science & Engineering
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@department.local"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign into Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Lab Viva Quick-Demo Accounts (Password: Demo@123)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleSelectDemo(account.email)}
                  className={`text-left p-2.5 rounded-lg border border-slate-200/80 hover:border-brand-400 transition-all cursor-pointer ${
                    email === account.email ? 'ring-2 ring-brand-500 bg-brand-50/50' : 'bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                    {account.label}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.2 rounded ${account.color}`}>
                    {account.role.replace('ROLE_', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
