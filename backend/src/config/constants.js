// Centralized enums/constants — keep in sync with database/schema.sql

const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_MEMBER: 'team_member',
};

const ROLE_IDS = {
  admin: 1,
  project_manager: 2,
  team_member: 3,
};

const PROJECT_STATUS = ['planning', 'in_progress', 'testing', 'completed'];

const TASK_STATUS = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'];

const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  PROJECT_UPDATED: 'project_updated',
  COMMENT_ADDED: 'comment_added',
  DUE_DATE_REMINDER: 'due_date_reminder',
  STATUS_CHANGED: 'status_changed',
  TEAM_INVITE: 'team_invite',
  MENTION: 'mention',
};

const ACTIVITY_ACTIONS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_BLOCKED: 'user.blocked',
  USER_UNBLOCKED: 'user.unblocked',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_DELETED: 'user.deleted',
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  TASK_STATUS_CHANGED: 'task.status_changed',
  SUBTASK_CREATED: 'subtask.created',
  SUBTASK_UPDATED: 'subtask.updated',
  SUBTASK_DELETED: 'subtask.deleted',
  COMMENT_ADDED: 'comment.added',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  FILE_UPLOADED: 'file.uploaded',
  FILE_DELETED: 'file.deleted',
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',
  TEAM_MEMBER_ADDED: 'team.member_added',
  TEAM_MEMBER_REMOVED: 'team.member_removed',
};

module.exports = {
  ROLES,
  ROLE_IDS,
  PROJECT_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  NOTIFICATION_TYPES,
  ACTIVITY_ACTIONS,
};
