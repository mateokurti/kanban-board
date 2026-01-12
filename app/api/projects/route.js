import { requireAuth, requireAdmin, canManageProjects } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
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

export async function GET(request) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const userTeams = await Team.find({
      $or: [
        { userId: session.user.id },
        { 'members.userId': session.user.id }
      ]
    });

    const userTeamIds = userTeams.map(team => team._id.toString());

    const query = {
      $or: [
        { userId: session.user.id },
        { teamIds: { $in: userTeamIds } }
      ]
    };

    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
      query.teamIds = teamId;
      delete query.$or;
    }

    const projects = await Project.find(query).sort({ name: 1 });
    return NextResponse.json({ projects: projects.map(serializeProject) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, icon = '', teamIds = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    await dbConnect();

    if (teamIds && teamIds.length > 0) {
      const hasPermission = await canManageProjects(session, teamIds[0]);
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Forbidden: You need Admin or Project Manager role in this team to create projects' },
          { status: 403 }
        );
      }
    }

    const resolvedTeamIds = await resolveTeamIds(teamIds, session.user.id);

    const project = await Project.create({
      name: name.trim(),
      icon,
      teamIds: resolvedTeamIds,
      userId: session.user.id,
    });

    return NextResponse.json({ project: serializeProject(project) }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}