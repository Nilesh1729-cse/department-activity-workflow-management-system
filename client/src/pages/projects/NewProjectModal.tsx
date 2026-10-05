import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { api } from '../../api/client';
import { ProjectDifficulty, Program, Batch } from '../../types';
import { AlertCircle } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programId, setProgramId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [domain, setDomain] = useState('Artificial Intelligence & Systems');
  const [technologies, setTechnologies] = useState('Python, PyTorch, React');
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>('MEDIUM');
  const [maxStudents, setMaxStudents] = useState('2');
  const [description, setDescription] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgramsAndBatches = async () => {
      try {
        const [progRes, batchRes]: any = await Promise.all([
          api.get('/academic/programs'),
          api.get('/academic/batches'),
        ]);
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
      fetchProgramsAndBatches();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectCode.trim() || !description.trim() || !programId || !batchId) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/projects', {
        programId,
        batchId,
        title,
        projectCode,
        description,
        domain,
        technologies,
        difficulty,
        maxStudents: Number(maxStudents) || 2,
        submitImmediately,
      });

      setTitle('');
      setProjectCode('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to propose project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propose Capstone Project" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Academic Program <span className="text-rose-500">*</span>
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Eligible Batch <span className="text-rose-500">*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed IoT Sensor Fusion with eBPF Observability"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unique Project Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
              placeholder="PRJ-CSE-2026-006"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 font-mono uppercase focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Domain / Research Area <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Cybersecurity & Cloud"
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as ProjectDifficulty)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="MEDIUM">Medium</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Max Students Capacity
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Key Technologies & Frameworks <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="e.g. Go, Kubernetes, eBPF, Grafana, Docker"
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Detailed Project Description & Scope <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe problem definition, research methodology, expected deliverables, and evaluation criteria..."
            className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="submitProjectNow"
            checked={submitImmediately}
            onChange={(e) => setSubmitImmediately(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
          />
          <label htmlFor="submitProjectNow" className="text-xs font-medium text-slate-700 cursor-pointer">
            Submit proposal immediately for HOD review & approval
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-xs"
          >
            {isSubmitting ? 'Submitting...' : submitImmediately ? 'Submit Proposal to HOD' : 'Save Draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
