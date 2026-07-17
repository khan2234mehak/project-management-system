import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { fetchProjects } from '../../features/projects/projectsSlice';
import ProjectCard from '../../components/common/ProjectCard';
import ProjectFormModal from '../../features/projects/ProjectFormModal';
import { SkeletonCard, EmptyState } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'completed', label: 'Completed' },
];

export default function Projects() {
  const dispatch = useDispatch();
  const { canManage } = useAuth();
  const { items, pagination, status } = useSelector((state) => state.projects);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    dispatch(fetchProjects({ search: debouncedSearch, status: statusFilter, sort, page, limit: 12 }));
  }, [dispatch, debouncedSearch, statusFilter, sort, page]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Projects</h1>
          <p className="text-sm text-ink-400 mt-1">{pagination.total} total</p>
        </div>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input !pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="input sm:w-40" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="due_date">Due date</option>
          <option value="name">Name</option>
        </select>
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {status !== 'loading' && items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try adjusting your filters, or create a new project to get started."
          action={canManage && (
            <button onClick={() => setModalOpen(true)} className="btn-primary mt-2">
              <Plus size={16} /> New Project
            </button>
          )}
        />
      )}

      {status !== 'loading' && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
