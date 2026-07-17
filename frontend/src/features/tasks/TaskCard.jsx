import { useDrag } from 'react-dnd';
import { Link } from 'react-router-dom';
import { MessageSquare, Paperclip, ListChecks, Calendar } from 'lucide-react';
import PriorityBadge from '../../components/common/PriorityBadge';
import Avatar from '../../components/common/Avatar';

export const TASK_DRAG_TYPE = 'TASK_CARD';

export default function TaskCard({ task, index, status }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: TASK_DRAG_TYPE,
    item: { id: task.id, index, status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [task.id, index, status]);

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && status !== 'done';

  return (
    <div
      ref={dragRef}
      className={`card p-3.5 cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      <Link to={`/tasks/${task.id}`} className="block">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-ink-800 dark:text-ink-100 line-clamp-2">{task.title}</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <PriorityBadge priority={task.priority} />
          {task.assignee_name && <Avatar name={task.assignee_name} src={task.assignee_avatar} size="xs" />}
        </div>

        {task.subtask_count > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[11px] text-ink-400 mb-1">
              <span className="flex items-center gap-1"><ListChecks size={11} /> {task.subtask_done}/{task.subtask_count}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${task.subtask_count ? (task.subtask_done / task.subtask_count) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-ink-300">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-priority-critical font-medium' : ''}`}>
              <Calendar size={11} /> {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.comment_count > 0 && <span className="flex items-center gap-1"><MessageSquare size={11} /> {task.comment_count}</span>}
          {task.attachment_count > 0 && <span className="flex items-center gap-1"><Paperclip size={11} /> {task.attachment_count}</span>}
        </div>
      </Link>
    </div>
  );
}
