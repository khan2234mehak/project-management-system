import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Search } from 'lucide-react';
import { fetchBoard, moveTask, moveTaskLocal, STATUSES } from './tasksSlice';
import KanbanColumn from './KanbanColumn';
import QuickAddTaskModal from './QuickAddTaskModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getSocket } from '../../hooks/useSocket';

export default function KanbanBoard({ projectId, teamId }) {
  const dispatch = useDispatch();
  const board = useSelector((state) => state.tasks.board);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [addModalStatus, setAddModalStatus] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const loadBoard = useCallback(() => {
    dispatch(fetchBoard({ projectId, search: debouncedSearch, priority: priorityFilter }));
  }, [dispatch, projectId, debouncedSearch, priorityFilter]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  // Live board sync: when any teammate moves/creates/deletes a task on
  // this project, refresh. (Simple + robust over fine-grained patching.)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('project:join', projectId);

    const refresh = () => loadBoard();
    socket.on('board:task_created', refresh);
    socket.on('board:task_updated', refresh);
    socket.on('board:task_moved', refresh);
    socket.on('board:task_deleted', refresh);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('board:task_created', refresh);
      socket.off('board:task_updated', refresh);
      socket.off('board:task_moved', refresh);
      socket.off('board:task_deleted', refresh);
    };
  }, [projectId, loadBoard]);

  const handleDropTask = (item, toStatus, toIndex) => {
    const fromStatus = item.status;
    // Optimistic UI update
    dispatch(moveTaskLocal({ id: item.id, fromStatus, toStatus, toIndex }));
    // Persist to backend
    dispatch(moveTask({ id: item.id, status: toStatus, position: toIndex, fromStatus }))
      .unwrap()
      .catch(() => loadBoard()); // on failure, resync from server
    // Update the dragged item's tracked status/index so subsequent drops in
    // the same drag session (rare, but possible with fast pointer moves) are correct.
    item.status = toStatus;
    item.index = toIndex;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-3 px-1 pb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className="input !pl-9 !py-1.5 text-sm" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40 !py-1.5 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <DndProvider backend={HTML5Backend}>
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 flex-1">
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              tasks={board[s] || []}
              onDropTask={handleDropTask}
              onAddTask={setAddModalStatus}
            />
          ))}
        </div>
      </DndProvider>

      <QuickAddTaskModal
        open={Boolean(addModalStatus)}
        onClose={() => setAddModalStatus(null)}
        projectId={projectId}
        teamId={teamId}
        initialStatus={addModalStatus || 'backlog'}
      />
    </div>
  );
}
