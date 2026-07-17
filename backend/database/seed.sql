-- =====================================================================
-- Seed data: roles + default admin account (SQLite)
-- Run AFTER schema.sqlite.sql via `npm run seed`
-- =====================================================================

INSERT INTO roles (id, name, description) VALUES
  (1, 'admin', 'Full system access'),
  (2, 'project_manager', 'Manages projects, tasks, and teams'),
  (3, 'team_member', 'Works on assigned tasks')
ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description;

-- Default admin login: admin@pms.local / Admin@123
-- Password hash below is a real bcrypt(10) hash — change it after first login.
INSERT INTO users (name, email, password, role_id, is_email_verified)
VALUES (
  'System Admin',
  'admin@pms.local',
  '$2b$10$oHKGFXAv1Hxu1X.aGWxWD.TCKNUg4ZjyYyXwcDqmP4lXjZJBw8Rx2',
  1,
  1
)
ON CONFLICT(email) DO UPDATE SET password = excluded.password;
