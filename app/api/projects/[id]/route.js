import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Task from '@/lib/models/Task';
import Team from '@/lib/models/Team';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

function serializeProject(doc) {
  const project = doc.toObject({ virtuals: false });
  return {
    ...project,
    _id: project._id.toString(),
    userId: project.userId.toString(),
    teamIds: (project.teamIds || []).map((id) => id.toString()),
    createdAt: project.createdAt?.toISOString?.() || project.createdAt,
    updatedAt: project.updatedAt?.toISOString?.() || project.updatedAt,
  };
}

async function resolveTeamIds(teamIds, userId) {
  if (!Array.isArray(teamIds) || teamIds.length === 0) return [];
  const validIds = [...new Set(teamIds.filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  if (validIds.length === 0) return [];
  const teams = await Team.find({ _id: { $in: validIds }, userId });
  return teams.map((team) => team._id);
}

async function findProjectOr404(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid project ID', status: 400 };
  }
  await dbConnect();
  const project = await Project.findOne({ _id: id, userId });
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }
  return { project };
}

export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findProjectOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ project: serializeProject(result.project) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const { name, icon, teamIds } = body;

    const result = await findProjectOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
      }
      result.project.name = name.trim();
    }

    if (icon !== undefined) {
      result.project.icon = icon;
    }

    if (teamIds !== undefined) {
      const resolved = await resolveTeamIds(teamIds, session.user.id);
      result.project.teamIds = resolved;

      if (resolved.length > 0) {
        await Task.updateMany(
          {
            userId: session.user.id,
            projectId: result.project._id,
            teamId: { $nin: resolved },
          },
          { $set: { teamId: null } }
        );
      }
    }

    await result.project.save();

    return NextResponse.json({ project: serializeProject(result.project) }, { status: 200 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findProjectOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await Task.updateMany(
      { userId: session.user.id, projectId: result.project._id },
      { $set: { projectId: null } }
    );

    await result.project.deleteOne();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}