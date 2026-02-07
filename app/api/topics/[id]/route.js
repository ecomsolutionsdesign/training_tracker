// app/api/topics/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Topic from '@/models/Topic';
import { checkAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const topic = await Topic.findById(id);
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: topic });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  // Only admin and qa-officer can update topics
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const topic = await Topic.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: topic });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  // Only admin and qa-officer can delete topics
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  const { id } = await params;
  try {
    await connectDB();
    const topic = await Topic.findByIdAndDelete(id);
    
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}