import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json({
    session,
    hasRole: !!session?.user?.role,
    role: session?.user?.role || 'NOT SET IN SESSION'
  });
}
