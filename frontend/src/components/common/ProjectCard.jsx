import { Link } from 'react-router-dom';
import { Calendar, Users, ListChecks } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-ink-900 dark:text-white line-clamp-1">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="text-sm text-ink-400 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-1">
        <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
          <span>Progress</span>
          <span className="font-medium text-ink-600 dark:text-ink-200">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
          <div className="h-full rounded-full bg-signal-500" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-400 mt-1">
        {project.team_name && (
          <span className="flex items-center gap-1">
            <Users size={13} /> {project.team_name}
          </span>
        )}
        {project.task_count !== undefined && (
          <span className="flex items-center gap-1">
            <ListChecks size={13} /> {project.task_count} tasks
          </span>
        )}
        {project.end_date && (
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {new Date(project.end_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
