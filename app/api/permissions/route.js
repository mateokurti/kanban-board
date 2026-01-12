import { requireAuth, canCreateTasks, canManageProjects } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const canCreateTasksForTeam = teamId ? await canCreateTasks(session, teamId) : false;
    const canManageProjectsForTeam = teamId ? await canManageProjects(session, teamId) : false;

    return NextResponse.json({
      canCreateTasks: canCreateTasksForTeam,
      canManageProjects: canManageProjectsForTeam,
      isGlobalAdmin: session.user.role === 'admin',
    }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error checking permissions:', error);
    return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
  }
}
