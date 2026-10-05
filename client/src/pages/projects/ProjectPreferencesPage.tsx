import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ProjectItem, ProjectPreference } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CheckSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectPreferencesPage: React.FC = () => {
  const [availableProjects, setAvailableProjects] = useState<ProjectItem[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<{ projectId: string; rank: number }[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPreferenceData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/projects/preferences/available');
      if (res.success && res.data) {
        setAvailableProjects(res.data.projects || []);
        setIsFinalized(res.data.isFinalized || false);
        setStudentInfo(res.data.student || null);

        // Prepopulate existing preferences
        if (res.data.preferences && res.data.preferences.length > 0) {
          const mapped = res.data.preferences.map((p: ProjectPreference) => ({
            projectId: p.projectId,
            rank: p.rank,
          }));
          setSelectedPreferences(mapped);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch available projects' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferenceData();
  }, []);

  const handleAddProject = (projectId: string) => {
    if (selectedPreferences.some((p) => p.projectId === projectId)) return;
    if (selectedPreferences.length >= 5) {
      setMessage({ type: 'error', text: 'You can submit a maximum of 5 preferences.' });
      return;
    }

    const nextRank = selectedPreferences.length + 1;
    setSelectedPreferences([...selectedPreferences, { projectId, rank: nextRank }]);
    setMessage(null);
  };

  const handleRemovePreference = (projectId: string) => {
    const filtered = selectedPreferences.filter((p) => p.projectId !== projectId);
    // Re-rank 1..N
    const reRanked = filtered.map((p, idx) => ({ ...p, rank: idx + 1 }));
    setSelectedPreferences(reRanked);
    setMessage(null);
  };

  const handleMoveRank = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedPreferences.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...selectedPreferences];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Fix ranks
    const reRanked = updated.map((p, idx) => ({ ...p, rank: idx + 1 }));
    setSelectedPreferences(reRanked);
  };

  const handleSavePreferences = async () => {
    if (selectedPreferences.length < 1) {
      setMessage({ type: 'error', text: 'Please select at least 1 project preference.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res: any = await api.post('/projects/preferences', {
        preferences: selectedPreferences,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: 'Preferences saved successfully! They will be evaluated deterministically during allocation.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Project Preference Selection
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rank up to 5 capstone project choices in order of preference. The allocation engine matches students based on rank and project capacity.
          </p>
        </div>

        {studentInfo && (
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 font-medium self-start sm:self-auto">
            {studentInfo.rollNumber} • {studentInfo.batch}
          </div>
        )}
      </div>

      {isFinalized && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong>Allocation Finalized:</strong> Your project assignment has already been finalized by the Head of Department. Preferences can no longer be edited.
            <Link to="/projects/my-allocation" className="ml-2 font-bold underline">
              View your allocated project
            </Link>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Chosen Preferences Ordered List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Ranked Choices ({selectedPreferences.length} / 5)
              </h3>
              <span className="text-xs text-slate-400">Order by priority</span>
            </div>

            {selectedPreferences.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                No preferences selected yet. Click "Add to Preferences" on any project from the right list.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPreferences.map((pref, idx) => {
                  const proj = availableProjects.find((p) => p.id === pref.projectId);
                  if (!proj) return null;

                  return (
                    <div
                      key={pref.projectId}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {pref.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate">
                            {proj.projectCode}: {proj.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Mentor: {proj.faculty?.name} • Domain: {proj.domain}
                          </p>
                        </div>
                      </div>

                      {!isFinalized && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveRank(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRank(idx, 'down')}
                            disabled={idx === selectedPreferences.length - 1}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePreference(pref.projectId)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isFinalized && (
              <div className="pt-5 mt-5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={saving || selectedPreferences.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving Choices...' : 'Save & Submit Preferences'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Available Projects Pool */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 px-1">
            Available Approved Projects Pool ({availableProjects.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {availableProjects.map((proj) => {
              const isSelected = selectedPreferences.some((p) => p.projectId === proj.id);

              return (
                <div
                  key={proj.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-brand-50/40 border-brand-200'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        {proj.projectCode}
                      </span>
                      <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {proj.difficulty}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      Cap: {proj.maxStudents}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 mb-1 leading-snug">
                    {proj.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                    {proj.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-600">
                      Mentor: <strong>{proj.faculty?.name}</strong>
                    </span>

                    {!isFinalized && (
                      <button
                        type="button"
                        onClick={() => handleAddProject(proj.id)}
                        disabled={isSelected || selectedPreferences.length >= 5}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand-100 text-brand-800 cursor-not-allowed'
                            : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                        }`}
                      >
                        {isSelected ? (
                          'Selected'
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add Choice
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
