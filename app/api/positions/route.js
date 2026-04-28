// app/api/positions/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Position from '@/models/Position';
import { checkAuth } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const positions = await Position.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: positions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const authCheck = await checkAuth(request, ['admin']); // Admin only
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Position name is required' }, { status: 400 });
    }

    const newPosition = await Position.create({ name: name.trim() });
    return NextResponse.json({ success: true, data: newPosition }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Position already exists or invalid' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const authCheck = await checkAuth(request, ['admin']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const { id } = await request.json();
    await Position.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}