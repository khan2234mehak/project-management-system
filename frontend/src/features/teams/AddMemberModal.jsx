import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import { addTeamMembers, fetchTeamById } from './teamsSlice';

export default function AddMemberModal({ open, onClose, teamId, existingMemberIds = [] }) {
  const dispatch = useDispatch();
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/users', { params: { limit: 100 } }).then((res) => setAllUsers(res.data.data));
      setSelected([]);
      setSearch('');
    }
  }, [open]);

  const candidates = allUsers.filter(
    (u) => !existingMemberIds.includes(u.id) && u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    const result = await dispatch(addTeamMembers({ teamId, memberIds: selected }));
    setSubmitting(false);

    if (addTeamMembers.fulfilled.match(result)) {
      toast.success('Members added');
      dispatch(fetchTeamById(teamId));
      onClose();
    } else {
      toast.error(result.payload || 'Failed to add members');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Team Members"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !selected.length} className="btn-primary">
            {submitting ? 'Adding…' : `Add ${selected.length || ''} member${selected.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <input
        className="input mb-3"
        placeholder="Search people…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-72 overflow-y-auto space-y-1">
        {candidates.map((u) => (
          <label key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-700 cursor-pointer">
            <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="accent-signal-500" />
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-100">{u.name}</p>
              <p className="text-xs text-ink-400">{u.email}</p>
            </div>
          </label>
        ))}
        {candidates.length === 0 && <p className="text-sm text-ink-400 text-center py-6">No matching users</p>}
      </div>
    </Modal>
  );
}
