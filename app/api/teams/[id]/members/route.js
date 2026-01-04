import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';
import { sendTeamInvitationEmail } from '@/lib/email';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

async function findTeamOr404(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid team ID', status: 400 };
  }
  await dbConnect();
  const team = await Team.findOne({ _id: id, userId }).populate('members.userId', 'name email');
  if (!team) {
    return { error: 'Team not found', status: 404 };
  }
  return { team };
}

export async function POST(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const { email, role = 'Member' } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const validRoles = ['Member', 'Tech Lead', 'QA'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const result = await findTeamOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    if (result.team.userId.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'Cannot add team owner as member' }, { status: 400 });
    }

    const alreadyMember = result.team.members.some(
      (member) => member.userId._id.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 409 });
    }

    result.team.members.push({
      userId: user._id,
      role,
      addedAt: new Date(),
    });

    await result.team.save();

    try {
      await sendTeamInvitationEmail({
        to: user.email,
        teamName: result.team.name,
        invitedBy: session.user.name,
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    const updatedTeam = await Team.findById(result.team._id).populate('members.userId', 'name email');

    return NextResponse.json({
      message: 'User added to team successfully',
      team: {
        _id: updatedTeam._id.toString(),
        name: updatedTeam.name,
        members: updatedTeam.members.map((m) => ({
          userId: m.userId._id.toString(),
          name: m.userId.name,
          email: m.userId.email,
          role: m.role,
          addedAt: m.addedAt?.toISOString?.() || m.addedAt,
        })),
      },
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adding member to team:', error);
    return NextResponse.json({ error: 'Failed to add member to team' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userIdToRemove)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const result = await findTeamOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const memberIndex = result.team.members.findIndex(
      (member) => member.userId._id.toString() === userIdToRemove
    );

    if (memberIndex === -1) {
      return NextResponse.json({ error: 'User is not a member of this team' }, { status: 404 });
    }

    result.team.members.splice(memberIndex, 1);
    await result.team.save();

    const updatedTeam = await Team.findById(result.team._id).populate('members.userId', 'name email');

    return NextResponse.json({
      message: 'User removed from team successfully',
      team: {
        _id: updatedTeam._id.toString(),
        name: updatedTeam.name,
        members: updatedTeam.members.map((m) => ({
          userId: m.userId._id.toString(),
          name: m.userId.name,
          email: m.userId.email,
          role: m.role,
          addedAt: m.addedAt?.toISOString?.() || m.addedAt,
        })),
      },
    }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error removing member from team:', error);
    return NextResponse.json({ error: 'Failed to remove member from team' }, { status: 500 });
  }
}
