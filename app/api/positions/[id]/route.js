// app/api/positions/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Position from '@/models/Position';
import { checkAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const position = await Position.findById(id);
    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();

    // Clean arrays — remove blank entries
    if (body.responsibilities) {
      body.responsibilities = body.responsibilities.filter(r => r.trim() !== '');
    }
    if (body.requirements) {
      body.requirements = body.requirements.filter(r => r.trim() !== '');
    }

    const position = await Position.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}