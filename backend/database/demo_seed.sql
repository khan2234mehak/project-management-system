-- Demo seed — uses subqueries to avoid hardcoded IDs
PRAGMA foreign_keys = OFF;

-- Extra users (password = Admin@123 for all)
INSERT OR IGNORE INTO users (name, email, password, role_id, is_email_verified, job_title) VALUES
  ('Priya Sharma', 'priya@pms.local', '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2', 2, 1, 'Project Manager'),
  ('Ravi Kumar',   'ravi@pms.local',  '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2', 3, 1, 'Frontend Developer'),
  ('Sneha Patel',  'sneha@pms.local', '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2', 3, 1, 'Backend Developer'),
  ('Amit Singh',   'amit@pms.local',  '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2', 3, 1, 'UI Designer'),
  ('Neha Gupta',   'neha@pms.local',  '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2', 3, 1, 'QA Engineer');

-- Teams (created by admin = id 1)
INSERT OR IGNORE INTO teams (name, description, created_by) VALUES
  ('Alpha Squad',  'Core product development team', 1),
  ('Design Guild', 'UI/UX and branding team', 1);

-- Team members using email subqueries
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Alpha Squad'), id, 'lead' FROM users WHERE email='admin@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Alpha Squad'), id, 'lead' FROM users WHERE email='priya@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Alpha Squad'), id, 'member' FROM users WHERE email='ravi@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Alpha Squad'), id, 'member' FROM users WHERE email='sneha@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Design Guild'), id, 'lead' FROM users WHERE email='admin@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Design Guild'), id, 'member' FROM users WHERE email='amit@pms.local';
INSERT OR IGNORE INTO team_members (team_id, user_id, team_role)
SELECT (SELECT id FROM teams WHERE name='Design Guild'), id, 'member' FROM users WHERE email='neha@pms.local';

-- Projects
INSERT OR IGNORE INTO projects (name, description, status, team_id, manager_id, start_date, end_date, progress)
SELECT 'PulseBoard Relaunch','Redesign and rebuild PulseBoard','in_progress',
  (SELECT id FROM teams WHERE name='Alpha Squad'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-05-01','2026-08-31', 45
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name='PulseBoard Relaunch');

INSERT OR IGNORE INTO projects (name, description, status, team_id, manager_id, start_date, end_date, progress)
SELECT 'Mobile App v2','New React Native mobile application','planning',
  (SELECT id FROM teams WHERE name='Alpha Squad'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-07-01','2026-12-31', 10
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name='Mobile App v2');

INSERT OR IGNORE INTO projects (name, description, status, team_id, manager_id, start_date, end_date, progress)
SELECT 'Brand Identity Refresh','Update logos, colors, and design system','in_progress',
  (SELECT id FROM teams WHERE name='Design Guild'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-06-01','2026-07-31', 70
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name='Brand Identity Refresh');

INSERT OR IGNORE INTO projects (name, description, status, team_id, manager_id, start_date, end_date, progress)
SELECT 'API Gateway Migration','Move from monolith to microservices','completed',
  (SELECT id FROM teams WHERE name='Alpha Squad'),
  1,
  '2026-01-01','2026-04-30', 100
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name='API Gateway Migration');

-- Tasks for PulseBoard Relaunch
INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Setup project repository','Init git, CI/CD pipeline','done','high',
  (SELECT id FROM users WHERE email='ravi@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-05-10', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Setup project repository');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Database schema design','ERD + SQLite schema','done','critical',
  (SELECT id FROM users WHERE email='sneha@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-05-15', 1
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Database schema design');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Auth API endpoints','Login, register, JWT refresh','done','critical',
  (SELECT id FROM users WHERE email='sneha@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-05-20', 2
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Auth API endpoints');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Dashboard UI component','Stats cards + recharts','in_progress','high',
  (SELECT id FROM users WHERE email='ravi@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-06-30', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Dashboard UI component');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Projects CRUD UI','List, create, edit, delete views','in_progress','high',
  (SELECT id FROM users WHERE email='ravi@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-07-05', 1
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Projects CRUD UI');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Kanban board drag-and-drop','Task drag between columns','todo','high',
  (SELECT id FROM users WHERE email='ravi@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-07-15', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Kanban board drag-and-drop');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Notification system','Real-time alerts via Socket.IO','todo','medium',
  (SELECT id FROM users WHERE email='sneha@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'),
  '2026-07-20', 1
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Notification system');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'File upload (attachments)','Multer + local storage','backlog','medium',NULL,
  (SELECT id FROM users WHERE email='priya@pms.local'), 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='File upload (attachments)');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, position)
SELECT (SELECT id FROM projects WHERE name='PulseBoard Relaunch'),
  'Reports & analytics page','Charts and export to PDF','backlog','low',NULL,
  (SELECT id FROM users WHERE email='priya@pms.local'), 1
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Reports & analytics page');

-- Tasks for Mobile App v2
INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Mobile App v2'),
  'Define mobile app architecture','Tech stack decision document','done','high',
  (SELECT id FROM users WHERE email='priya@pms.local'), 1, '2026-07-10', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Define mobile app architecture');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Mobile App v2'),
  'Wireframes - onboarding flow','Login, signup, welcome screens','in_progress','medium',
  (SELECT id FROM users WHERE email='amit@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'), '2026-07-25', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Wireframes - onboarding flow');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Mobile App v2'),
  'Setup React Native project','Expo + navigation boilerplate','todo','high',
  (SELECT id FROM users WHERE email='ravi@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'), '2026-08-01', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Setup React Native project');

-- Tasks for Brand Identity
INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Brand Identity Refresh'),
  'Logo concepts round 1','3 concept directions','done','high',
  (SELECT id FROM users WHERE email='amit@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'), '2026-06-10', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Logo concepts round 1');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Brand Identity Refresh'),
  'Logo concepts round 2','Refine selected direction','done','high',
  (SELECT id FROM users WHERE email='amit@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'), '2026-06-20', 1
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Logo concepts round 2');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date, position)
SELECT (SELECT id FROM projects WHERE name='Brand Identity Refresh'),
  'Color palette and typography','Primary, secondary, accent colors','in_progress','medium',
  (SELECT id FROM users WHERE email='neha@pms.local'),
  (SELECT id FROM users WHERE email='priya@pms.local'), '2026-07-01', 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Color palette and typography');

INSERT OR IGNORE INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, position)
SELECT (SELECT id FROM projects WHERE name='Brand Identity Refresh'),
  'Brand guidelines PDF','Final deliverable document','backlog','low',NULL,
  (SELECT id FROM users WHERE email='priya@pms.local'), 0
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title='Brand guidelines PDF');

-- Subtasks
INSERT OR IGNORE INTO subtasks (task_id, title, is_completed, created_by)
SELECT (SELECT id FROM tasks WHERE title='Dashboard UI component'),
  'Create StatCard component', 1,
  (SELECT id FROM users WHERE email='priya@pms.local')
WHERE NOT EXISTS (SELECT 1 FROM subtasks WHERE title='Create StatCard component');

INSERT OR IGNORE INTO subtasks (task_id, title, is_completed, created_by)
SELECT (SELECT id FROM tasks WHERE title='Dashboard UI component'),
  'Integrate recharts PieChart', 1,
  (SELECT id FROM users WHERE email='priya@pms.local')
WHERE NOT EXISTS (SELECT 1 FROM subtasks WHERE title='Integrate recharts PieChart');

INSERT OR IGNORE INTO subtasks (task_id, title, is_completed, created_by)
SELECT (SELECT id FROM tasks WHERE title='Dashboard UI component'),
  'Add BarChart for priorities', 0,
  (SELECT id FROM users WHERE email='priya@pms.local')
WHERE NOT EXISTS (SELECT 1 FROM subtasks WHERE title='Add BarChart for priorities');

-- Activity logs
INSERT INTO activity_logs (user_id, action, entity_type, description) VALUES
  (1, 'project.created', 'project', 'Project "PulseBoard Relaunch" created'),
  ((SELECT id FROM users WHERE email='priya@pms.local'), 'task.created', 'task', 'Task "Dashboard UI component" created'),
  ((SELECT id FROM users WHERE email='ravi@pms.local'), 'task.status_changed', 'task', 'Task "Auth API endpoints" moved to done'),
  ((SELECT id FROM users WHERE email='priya@pms.local'), 'team.created', 'team', 'Team "Alpha Squad" created'),
  (1, 'project.created', 'project', 'Project "API Gateway Migration" created'),
  ((SELECT id FROM users WHERE email='priya@pms.local'), 'project.updated', 'project', 'Project progress updated to 45%'),
  ((SELECT id FROM users WHERE email='amit@pms.local'), 'task.status_changed', 'task', 'Task "Logo concepts round 2" moved to done');

PRAGMA foreign_keys = ON;
