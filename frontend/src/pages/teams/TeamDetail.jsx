import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, UserPlus, Trash2, X, CheckCircle2, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchTeamById, deleteTeam, removeTeamMember, clearCurrentTeam } from '../../features/teams/teamsSlice';
import AddMemberModal from '../../features/teams/AddMemberModal';
import Avatar from '../../components/common/Avatar';
import { PageSpinner } from '../../components/common/Feedback';
import { useAuth } from '../../hooks/useAuth';

export default function TeamDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const team = useSelector((state) => state.teams.current);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTeamById(id));
    return () => dispatch(clearCurrentTeam());
  }, [id, dispatch]);

  if (!team) return <PageSpinner />;

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    await dispatch(removeTeamMember({ teamId: id, userId }));
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Delete this team? Projects will remain but lose their team association.')) return;
    const result = await dispatch(deleteTeam(id));
    if (deleteTeam.fulfilled.match(result)) {
      toast.success('Team deleted');
      navigate('/teams');
    }
  };

  const completionRate = team.metrics?.total_tasks
    ? Math.round((team.metrics.completed_tasks / team.metrics.total_tasks) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/teams" className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-600 mb-4 w-fit">
        <ArrowLeft size={14} /> Back to teams
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{team.name}</h1>
          {team.description && <p className="text-sm text-ink-400 mt-1 max-w-xl">{team.description}</p>}
        </div>
        {canManage && (
          <button onClick={handleDeleteTeam} className="btn-danger shrink-0"><Trash2 size={14} /> Delete Team</button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={FolderKanban} label="Projects" value={team.metrics?.total_projects || 0} />
        <MetricCard icon={CheckCircle2} label="Completed Projects" value={team.metrics?.completed_projects || 0} />
        <MetricCard icon={FolderKanban} label="Total Tasks" value={team.metrics?.total_tasks || 0} />
        <MetricCard icon={CheckCircle2} label="Completion Rate" value={`${completionRate}%`} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-ink-800 dark:text-white">Members ({team.members.length})</h3>
          {canManage && (
            <button onClick={() => setAddModalOpen(true)} className="btn-secondary !py-1.5 text-sm">
              <UserPlus size={14} /> Add Members
            </button>
          )}
        </div>

        <ul className="divide-y divide-ink-50 dark:divide-ink-700">
          {team.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3 group">
              <Avatar name={m.name} src={m.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{m.name}</p>
                <p className="text-xs text-ink-400">{m.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.team_role === 'lead' ? 'bg-signal-100 text-signal-600' : 'bg-ink-100 text-ink-500'}`}>
                {m.team_role === 'lead' ? 'Lead' : 'Member'}
              </span>
              {canManage && (
                <button onClick={() => handleRemoveMember(m.id)} className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-priority-critical transition-opacity">
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <AddMemberModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        teamId={id}
        existingMemberIds={team.members.map((m) => m.id)}
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-ink-400 mb-1">
        <Icon size={14} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-display text-xl font-semibold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}
