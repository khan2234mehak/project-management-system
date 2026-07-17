import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Search, UsersRound, Users } from 'lucide-react';
import { fetchTeams } from '../../features/teams/teamsSlice';
import TeamFormModal from '../../features/teams/TeamFormModal';
import { SkeletonCard, EmptyState } from '../../components/common/Feedback';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';

export default function Teams() {
  const dispatch = useDispatch();
  const { canManage } = useAuth();
  const { items, status } = useSelector((state) => state.teams);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    dispatch(fetchTeams({ search: debouncedSearch, limit: 50 }));
  }, [dispatch, debouncedSearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Teams</h1>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Team
          </button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input className="input !pl-9" placeholder="Search teams…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {status !== 'loading' && items.length === 0 && (
        <EmptyState icon={UsersRound} title="No teams yet" description="Create a team to start organizing people and projects." />
      )}

      {status !== 'loading' && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <Link key={t.id} to={`/teams/${t.id}`} className="card p-5 hover:shadow-card-hover transition-shadow">
              <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">{t.name}</h3>
              {t.description && <p className="text-sm text-ink-400 line-clamp-2 mb-3">{t.description}</p>}
              <div className="flex items-center gap-1.5 text-xs text-ink-400">
                <Users size={13} /> {t.member_count} members · Created by {t.creator_name}
              </div>
            </Link>
          ))}
        </div>
      )}

      <TeamFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
