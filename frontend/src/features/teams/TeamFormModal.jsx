import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { createTeam, fetchTeams } from './teamsSlice';

export default function TeamFormModal({ open, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: '', description: '' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(createTeam(form));
    setSubmitting(false);

    if (createTeam.fulfilled.match(result)) {
      toast.success('Team created');
      dispatch(fetchTeams());
      onClose();
    } else {
      toast.error(result.payload || 'Failed to create team');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Team"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="team-form" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create team'}
          </button>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Team name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <p className="text-xs text-ink-400">You can add members after creating the team.</p>
      </form>
    </Modal>
  );
}
