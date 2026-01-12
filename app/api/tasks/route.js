import { requireAuth, canCreateTasks } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Task from '@/lib/models/Task';
import Team from '@/lib/models/Team';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

function serializeTask(taskDoc) {
  const task = taskDoc.toObject({ virtuals: false });
  return {
    ...task,
    _id: task._id.toString(),
    userId: task.userId.toString(),
    teamId: task.teamId ? task.teamId.toString() : null,
    projectId: task.projectId ? task.projectId.toString() : null,
    assignedTo: task.assignedTo ? {
      _id: task.assignedTo._id?.toString() || task.assignedTo.toString(),
      name: task.assignedTo.name,
      email: task.assignedTo.email
    } : null,
    createdAt: task.createdAt?.toISOString?.() || task.createdAt,
    updatedAt: task.updatedAt?.toISOString?.() || task.updatedAt,
  };
}

// GET all tasks for the authenticated user
export async function GET(request) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');
    const includeUnassigned = searchParams.get('includeUnassigned');

    // Find all teams where user is owner or member
    const userTeams = await Team.find({
      $or: [
        { userId: session.user.id },
        { 'members.userId': session.user.id }
      ]
    });

    const userTeamIds = userTeams.map(team => team._id.toString());

    // Base query: tasks from user's teams OR tasks created by user
    const query = {
      $or: [
        { userId: session.user.id },
        { teamId: { $in: userTeamIds } }
      ]
    };

    if (teamId) {
      if (teamId === 'unassigned') {
        query.teamId = null;
        delete query.$or;
      } else if (mongoose.Types.ObjectId.isValid(teamId)) {
        query.teamId = teamId;
        delete query.$or;
      }
    }

    if (projectId) {
      if (projectId === 'unassigned') {
        query.projectId = null;
      } else if (mongoose.Types.ObjectId.isValid(projectId)) {
        query.projectId = projectId;
      }
    }

    if (includeUnassigned === 'true') {
      delete query.teamId;
      delete query.projectId;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks: tasks.map(serializeTask) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST create a new task
export async function POST(request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { title, description, status, priority, teamId, projectId, assignedTo } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let resolvedTeamId = null;
    let resolvedProjectId = null;

    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
      }
      const team = await Team.findOne({ _id: teamId, userId: session.user.id });
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
      resolvedTeamId = team._id;
    }

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
      }
      const project = await Project.findOne({ _id: projectId, userId: session.user.id });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      resolvedProjectId = project._id;

      if (resolvedTeamId) {
        const projectTeamIds = project.teamIds.map((id) => id.toString());
        if (projectTeamIds.length > 0 && !projectTeamIds.includes(resolvedTeamId.toString())) {
          return NextResponse.json(
            { error: 'Project is not assigned to the selected team' },
            { status: 400 }
          );
        }
      } else if (project.teamIds.length === 1) {
        // Auto-set team if project only belongs to one team
        resolvedTeamId = project.teamIds[0];
      }
    }

    // Check if user has permission to create tasks
    const hasPermission = await canCreateTasks(session, resolvedTeamId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You need admin, project_manager role, or Project Manager role in this team to create tasks' },
        { status: 403 }
      );
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      teamId: resolvedTeamId,
      projectId: resolvedProjectId,
      assignedTo: assignedTo || null,
      userId: session.user.id,
    });

    // Populate assignedTo before serializing
    await task.populate('assignedTo', 'name email');

    return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}