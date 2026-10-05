import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ProjectItem } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { NewProjectModal } from './NewProjectModal';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Code2,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showMyProjectsOnly, setShowMyProjectsOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedStatus) params.append('status', selectedStatus);
      if (showMyProjectsOnly) params.append('myProjects', 'true');

      const res: any = await api.get(`/projects?${params.toString()}`);
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedDifficulty, selectedStatus, showMyProjectsOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const isFaculty = user?.role === 'ROLE_FACULTY';
  const isStudent = user?.role === 'ROLE_STUDENT';
  const isHodOrAdmin = user?.role === 'ROLE_HOD' || user?.role === 'ROLE_ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            {isStudent ? 'Approved Capstone Project Pool' : 'Academic Project Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isStudent
              ? 'Browse approved faculty research and capstone projects eligible for your academic program.'
              : 'Oversee project proposals, approved capstone quotas, faculty mentor capacity, and student allocations.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isStudent && (
            <Link
              to="/projects/preferences"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Select Preferences
            </Link>
          )}

          {(isFaculty || isHodOrAdmin) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Propose Project
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, code, technologies..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Difficulty Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="MEDIUM">Medium</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isStudent}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
            >
              <option value="">All Workflow States</option>
              <option value="APPROVED">Approved / Pool</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="FULL">Full Capacity</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </form>

        {isFaculty && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowMyProjectsOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !showMyProjectsOnly ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Department Projects
            </button>
            <button
              onClick={() => setShowMyProjectsOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showMyProjectsOnly ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Proposed Projects Only
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search parameters or propose a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {proj.projectCode}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                      {proj.difficulty}
                    </span>
                  </div>
                  <StatusBadge status={proj.status} size="sm" />
                </div>

                <Link
                  to={`/projects/${proj.id}`}
                  className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors block mb-1.5 leading-snug"
                >
                  {proj.title}
                </Link>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {proj.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                  <Code2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="truncate text-slate-700 font-mono text-[11px]">
                    {proj.technologies}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Mentor</p>
                  <p className="font-semibold text-slate-800">{proj.faculty?.name}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 justify-end">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.allocatedCount} / {proj.maxStudents} Allocated</span>
                  </div>
                  <Link
                    to={`/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 text-xs mt-1"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchProjects}
      />
    </div>
  );
};
