import { requireAuth } from '@/lib/auth';
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

// GET single task
export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    // Find all teams where user is owner or member
    const userTeams = await Team.find({
      $or: [
        { userId: session.user.id },
        { 'members.userId': session.user.id }
      ]
    });

    const userTeamIds = userTeams.map(team => team._id.toString());

    // Find task where user has access (either created by user or in user's team)
    const task = await Task.findOne({
      _id: id,
      $or: [
        { userId: session.user.id },
        { teamId: { $in: userTeamIds } }
      ]
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: serializeTask(task) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT update task
export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    // Find all teams where user is owner or member
    const userTeams = await Team.find({
      $or: [
        { userId: session.user.id },
        { 'members.userId': session.user.id }
      ]
    });

    const userTeamIds = userTeams.map(team => team._id.toString());

    // Find task where user has access
    const task = await Task.findOne({
      _id: id,
      $or: [
        { userId: session.user.id },
        { teamId: { $in: userTeamIds } }
      ]
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'scheduled'];
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        task[field] = body[field];
      }
    });

    if (body.assignedTo !== undefined) {
      task.assignedTo = body.assignedTo || null;
    }

    if (body.teamId !== undefined) {
      if (body.teamId === null) {
        task.teamId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(body.teamId)) {
          return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
        }
        const team = await Team.findOne({ _id: body.teamId, userId: session.user.id });
        if (!team) {
          return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }
        task.teamId = team._id;
      }
    }

    if (body.projectId !== undefined) {
      if (body.projectId === null) {
        task.projectId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(body.projectId)) {
          return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }
        const project = await Project.findOne({ _id: body.projectId, userId: session.user.id });
        if (!project) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        task.projectId = project._id;

        if (task.teamId) {
          const projectTeamIds = project.teamIds.map((id) => id.toString());
          if (projectTeamIds.length > 0 && !projectTeamIds.includes(task.teamId.toString())) {
            return NextResponse.json(
              { error: 'Project is not assigned to the selected team' },
              { status: 400 }
            );
          }
        } else if (project.teamIds.length === 1) {
          task.teamId = project.teamIds[0];
        }
      }
    }

    await task.save();
    
    // Populate assignedTo before serializing
    await task.populate('assignedTo', 'name email');

    return NextResponse.json({ task: serializeTask(task) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE task
export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    // Find all teams where user is owner or member
    const userTeams = await Team.find({
      $or: [
        { userId: session.user.id },
        { 'members.userId': session.user.id }
      ]
    });

    const userTeamIds = userTeams.map(team => team._id.toString());

    // Find and delete task where user has access
    const task = await Task.findOneAndDelete({
      _id: id,
      $or: [
        { userId: session.user.id },
        { teamId: { $in: userTeamIds } }
      ]
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}