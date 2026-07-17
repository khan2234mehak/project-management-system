import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import TaskCard, { TASK_DRAG_TYPE } from './TaskCard';

const COLUMN_CONFIG = {
  backlog: { label: 'Backlog', bar: 'bg-ink-300' },
  todo: { label: 'To Do', bar: 'bg-blue-500' },
  in_progress: { label: 'In Progress', bar: 'bg-signal-500' },
  review: { label: 'Review', bar: 'bg-purple-500' },
  done: { label: 'Done', bar: 'bg-green-500' },
};

export default function KanbanColumn({ status, tasks, onDropTask, onAddTask }) {
  const config = COLUMN_CONFIG[status];

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: TASK_DRAG_TYPE,
    drop: (item) => {
      // Dropped on the column body (not a specific card) -> append to end
      if (item.status !== status || item.index !== tasks.length) {
        onDropTask(item, status, tasks.length);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  }), [status, tasks.length, onDropTask]);

  return (
    <div className="flex flex-col w-72 shrink-0 bg-ink-50 dark:bg-ink-900/60 rounded-card">
      <div className={`h-1 rounded-t-card ${config.bar}`} />
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-100">{config.label}</span>
          <span className="text-xs text-ink-400 bg-ink-100 dark:bg-ink-700 rounded-full px-1.5 py-0.5">{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(status)} className="text-ink-400 hover:text-signal-500" aria-label={`Add task to ${config.label}`}>
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={dropRef}
        className={`flex-1 flex flex-col gap-2 px-2.5 pb-3 min-h-[120px] rounded-b-card transition-colors ${isOver ? 'bg-signal-100/40 dark:bg-signal-500/10' : ''}`}
      >
        {tasks.map((task, index) => (
          <DraggableSlot key={task.id} task={task} index={index} status={status} onDropTask={onDropTask} />
        ))}
        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status)}
            className="text-xs text-ink-300 border border-dashed border-ink-200 dark:border-ink-600 rounded-lg py-6 hover:border-signal-400 hover:text-signal-500 transition-colors"
          >
            + Add a task
          </button>
        )}
      </div>
    </div>
  );
}

// Wraps each card with its own drop target so dropping mid-list reorders precisely.
function DraggableSlot({ task, index, status, onDropTask }) {
  const [, dropRef] = useDrop(() => ({
    accept: TASK_DRAG_TYPE,
    drop: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.status === status && item.index === index) return;
      onDropTask(item, status, index);
    },
  }), [status, index, onDropTask]);

  return (
    <div ref={dropRef}>
      <TaskCard task={task} index={index} status={status} />
    </div>
  );
}
