import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { createTask } from './tasksSlice';
import { fetchTeamById } from '../teams/teamsSlice';

export default function QuickAddTaskModal({ open, onClose, projectId, teamId, initialStatus = 'backlog' }) {
  const dispatch = useDispatch();
  const team = useSelector((state) => state.teams.current);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && teamId) dispatch(fetchTeamById(teamId));
  }, [open, teamId, dispatch]);

  useEffect(() => {
    if (open) setForm({ title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(createTask({
      projectId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
      status: initialStatus,
    }));
    setSubmitting(false);

    if (createTask.fulfilled.match(result)) {
      toast.success('Task created');
      onClose();
    } else {
      toast.error(result.payload || 'Failed to create task');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Task"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="quick-task-form" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="quick-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Assignee</label>
          <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {team?.members?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
}
