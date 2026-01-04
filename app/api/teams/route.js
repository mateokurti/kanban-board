import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Team from '@/lib/models/Team';
import { NextResponse } from 'next/server';

function serializeTeam(doc) {
  const team = doc.toObject({ virtuals: false });
  return {
    ...team,
    _id: team._id.toString(),
    userId: team.userId.toString(),
    members: team.members?.map((m) => ({
      userId: m.userId?._id?.toString() || m.userId?.toString() || m.userId,
      name: m.userId?.name,
      email: m.userId?.email,
      role: m.role || 'Member',
      addedAt: m.addedAt?.toISOString?.() || m.addedAt,
    })) || [],
    createdAt: team.createdAt?.toISOString?.() || team.createdAt,
    updatedAt: team.updatedAt?.toISOString?.() || team.updatedAt,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    await dbConnect();

    const teams = await Team.find({ userId: session.user.id })
      .populate('members.userId', 'name email')
      .sort({ name: 1 });
    return NextResponse.json({ teams: teams.map(serializeTeam) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    await dbConnect();

    const team = await Team.create({
      name: name.trim(),
      userId: session.user.id,
    });

    return NextResponse.json({ team: serializeTeam(team) }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}