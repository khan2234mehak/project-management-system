import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { createProject, updateProject, fetchProjects } from '../../features/projects/projectsSlice';
import { fetchTeams } from '../../features/teams/teamsSlice';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectFormModal({ open, onClose, project = null }) {
  const dispatch = useDispatch();
  const teams = useSelector((state) => state.teams.items);
  const isEdit = Boolean(project);

  const [form, setForm] = useState({
    name: '', description: '', status: 'planning', teamId: '', startDate: '', endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) dispatch(fetchTeams({ limit: 100 }));
  }, [open, dispatch]);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        teamId: project.team_id || '',
        startDate: project.start_date || '',
        endDate: project.end_date || '',
      });
    } else {
      setForm({ name: '', description: '', status: 'planning', teamId: '', startDate: '', endDate: '' });
    }
  }, [project, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, teamId: form.teamId || null };

    const result = isEdit
      ? await dispatch(updateProject({ id: project.id, ...payload }))
      : await dispatch(createProject(payload));

    setSubmitting(false);

    const succeeded = isEdit ? updateProject.fulfilled.match(result) : createProject.fulfilled.match(result);

    if (succeeded) {
      toast.success(isEdit ? 'Project updated' : 'Project created');
      dispatch(fetchProjects());
      onClose();
    } else {
      toast.error(result.payload || 'Something went wrong');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Project' : 'New Project'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="project-form" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Project name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Team</label>
            <select className="input" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" className="input" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
