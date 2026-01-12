import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from './db';
import Team from './models/Team';

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return session;
}

export async function requireAdminOrProjectManager() {
  const session = await requireAuth();

  if (session.user.role !== 'admin' && session.user.role !== 'project_manager') {
    throw new Error('Forbidden: Admin or Project Manager access required');
  }

  return session;
}

export async function hasTeamRole(userId, teamId, roles) {
  if (!teamId) return false;

  await dbConnect();
  const team = await Team.findById(teamId);

  if (!team) return false;

  if (team.userId.toString() === userId.toString()) {
    return true;
  }

  const member = team.members.find(
    m => m.userId.toString() === userId.toString()
  );

  if (!member) return false;

  return roles.includes(member.role);
}

export async function canManageTeam(userId, teamId) {
  if (!teamId) return false;
  return await hasTeamRole(userId, teamId, ['Admin', 'Project Manager']);
}

export async function canCreateTasks(session, teamId = null) {
  if (!teamId) return false;
  return await canManageTeam(session.user.id, teamId);
}

export async function canManageProjects(session, teamId = null) {
  if (!teamId) return false;
  return await canManageTeam(session.user.id, teamId);
}

export function isAdmin(session) {
  return session?.user?.role === 'admin';
}

export function isProjectManager(session) {
  return session?.user?.role === 'project_manager';
}

export function isAdminOrProjectManager(session) {
  return isAdmin(session) || isProjectManager(session);
}

