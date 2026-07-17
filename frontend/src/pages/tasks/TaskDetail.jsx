import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Trash2, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchTaskById, updateTask, deleteTask, clearCurrentTask } from '../../features/tasks/tasksSlice';
import { PageSpinner } from '../../components/common/Feedback';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import SubtaskList from '../../features/tasks/SubtaskList';
import CommentThread from '../../features/tasks/CommentThread';
import TaskAttachments from '../../features/tasks/TaskAttachments';
import { useAuth } from '../../hooks/useAuth';

export default function TaskDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const task = useSelector((state) => state.tasks.current);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    dispatch(fetchTaskById(id));
    return () => dispatch(clearCurrentTask());
  }, [id, dispatch]);

  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setDescDraft(task.description || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!task) return <PageSpinner />;

  const saveTitle = async () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== task.title) {
      await dispatch(updateTask({ id: task.id, title: titleDraft.trim() }));
      dispatch(fetchTaskById(id));
    }
  };

  const saveDescription = async () => {
    setEditingDesc(false);
    if (descDraft !== (task.description || '')) {
      await dispatch(updateTask({ id: task.id, description: descDraft }));
      dispatch(fetchTaskById(id));
    }
  };

  const handlePriorityChange = async (priority) => {
    await dispatch(updateTask({ id: task.id, priority }));
    dispatch(fetchTaskById(id));
  };

  const handleDueDateChange = async (dueDate) => {
    await dispatch(updateTask({ id: task.id, dueDate: dueDate || null }));
    dispatch(fetchTaskById(id));
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task permanently?')) return;
    const result = await dispatch(deleteTask({ id: task.id, status: task.status }));
    if (deleteTask.fulfilled.match(result)) {
      toast.success('Task deleted');
      navigate(`/projects/${task.project_id}`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link to={`/projects/${task.project_id}`} className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-600 mb-4">
        <ArrowLeft size={14} /> Back to {task.project_name || 'project'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              {editingTitle ? (
                <input
                  className="input font-display text-lg font-semibold !py-1.5"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => canManage && setEditingTitle(true)}
                  className={`font-display text-xl font-semibold text-ink-900 dark:text-white ${canManage ? 'cursor-text hover:bg-ink-50 dark:hover:bg-ink-700 rounded px-1 -mx-1' : ''}`}
                >
                  {task.title}
                </h1>
              )}
              {canManage && (
                <button onClick={handleDelete} className="text-ink-300 hover:text-priority-critical shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>

            {editingDesc ? (
              <textarea
                className="input text-sm"
                rows={4}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={saveDescription}
                autoFocus
              />
            ) : (
              <p
                onClick={() => canManage && setEditingDesc(true)}
                className={`text-sm text-ink-500 dark:text-ink-300 whitespace-pre-wrap ${canManage ? 'cursor-text hover:bg-ink-50 dark:hover:bg-ink-700 rounded px-1 -mx-1' : ''}`}
              >
                {task.description || (canManage ? 'Add a description…' : 'No description provided.')}
              </p>
            )}
          </div>

          <div className="card p-5">
            <SubtaskList taskId={task.id} subtasks={task.subtasks || []} />
          </div>

          <div className="card p-5">
            <TaskAttachments taskId={task.id} />
          </div>

          <div className="card p-5">
            <CommentThread taskId={task.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Priority</label>
              <select className="input text-sm" value={task.priority} onChange={(e) => handlePriorityChange(e.target.value)} disabled={!canManage}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-1"><Calendar size={12} /> Due date</label>
              <input
                type="date"
                className="input text-sm"
                value={task.due_date || ''}
                onChange={(e) => handleDueDateChange(e.target.value)}
                disabled={!canManage}
              />
            </div>

            <div>
              <label className="label flex items-center gap-1"><User size={12} /> Assignee</label>
              <p className="text-sm text-ink-600 dark:text-ink-300">{task.assignee_name || 'Unassigned'}</p>
            </div>

            <div className="pt-3 border-t border-ink-100 dark:border-ink-700 text-xs text-ink-400 space-y-1">
              <p>Created by {task.creator_name}</p>
              <p>{new Date(task.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
