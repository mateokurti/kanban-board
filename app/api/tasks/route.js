import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import { requireAuth } from '@/lib/auth';

// GET all tasks for the authenticated user
export async function GET() {
  try {
    const session = await requireAuth();
    await dbConnect();

    const tasks = await Task.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json({ tasks }, { status: 200 });
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

    const { title, description, status, priority, teamId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      teamId: teamId || null,
      userId: session.user.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}