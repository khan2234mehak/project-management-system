import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Pencil, Trash2, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProjectById, deleteProject, clearCurrentProject } from '../../features/projects/projectsSlice';
import StatusBadge from '../../components/common/StatusBadge';
import { PageSpinner } from '../../components/common/Feedback';
import KanbanBoard from '../../features/tasks/KanbanBoard';
import ProjectFormModal from '../../features/projects/ProjectFormModal';
import { useAuth } from '../../hooks/useAuth';

export default function ProjectDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const project = useSelector((state) => state.projects.current);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    return () => dispatch(clearCurrentProject());
  }, [id, dispatch]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    const result = await dispatch(deleteProject(id));
    if (deleteProject.fulfilled.match(result)) {
      toast.success('Project deleted');
      navigate('/projects');
    } else {
      toast.error(result.payload || 'Failed to delete project');
    }
  };

  if (!project) return <PageSpinner />;

  return (
    <div className="flex flex-col h-full p-6 max-w-[1400px] mx-auto w-full">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-600 mb-4 w-fit">
        <ArrowLeft size={14} /> Back to projects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && <p className="text-sm text-ink-400 max-w-2xl">{project.description}</p>}
          <div className="flex items-center gap-4 text-xs text-ink-400 mt-2">
            {project.team_name && <span className="flex items-center gap-1"><Users size={13} /> {project.team_name}</span>}
            {project.manager_name && <span>Managed by {project.manager_name}</span>}
            {project.end_date && <span className="flex items-center gap-1"><Calendar size={13} /> Due {new Date(project.end_date).toLocaleDateString()}</span>}
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditOpen(true)} className="btn-secondary"><Pencil size={14} /> Edit</button>
            <button onClick={handleDelete} className="btn-danger"><Trash2 size={14} /> Delete</button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard projectId={project.id} teamId={project.team_id} />
      </div>

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
    </div>
  );
}
