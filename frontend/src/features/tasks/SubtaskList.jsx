import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, X, Check } from 'lucide-react';
import api from '../../utils/api';
import { fetchTaskById } from './tasksSlice';

export default function SubtaskList({ taskId, subtasks = [] }) {
  const dispatch = useDispatch();
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const completed = subtasks.filter((s) => s.is_completed).length;
  const pct = subtasks.length ? Math.round((completed / subtasks.length) * 100) : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await api.post(`/tasks/${taskId}/subtasks`, { title: newTitle.trim() });
      setNewTitle('');
      dispatch(fetchTaskById(taskId));
    } finally {
      setAdding(false);
    }
  };

  const toggleComplete = async (subtask) => {
    await api.put(`/subtasks/${subtask.id}`, { isCompleted: !subtask.is_completed });
    dispatch(fetchTaskById(taskId));
  };

  const handleDelete = async (subtaskId) => {
    await api.delete(`/subtasks/${subtaskId}`);
    dispatch(fetchTaskById(taskId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100">Subtasks</h3>
        {subtasks.length > 0 && <span className="text-xs text-ink-400">{completed}/{subtasks.length} complete</span>}
      </div>

      {subtasks.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden mb-3">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <ul className="space-y-1.5 mb-3">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggleComplete(s)}
              className={`h-4.5 w-4.5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                s.is_completed ? 'bg-green-500 border-green-500' : 'border-ink-300 hover:border-signal-400'
              }`}
              style={{ height: 18, width: 18 }}
            >
              {s.is_completed && <Check size={12} className="text-white" />}
            </button>
            <span className={`text-sm flex-1 ${s.is_completed ? 'line-through text-ink-300' : 'text-ink-700 dark:text-ink-200'}`}>
              {s.title}
            </span>
            <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-priority-critical transition-opacity">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input !py-1.5 text-sm"
          placeholder="Add a subtask…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" disabled={adding || !newTitle.trim()} className="btn-secondary !px-2.5">
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}
