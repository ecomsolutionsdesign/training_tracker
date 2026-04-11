// app/api/topics/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Topic from '@/models/Topic';
import { checkAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  const res = await fetch('/api/attendances');
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text.slice(0, 200)); // shows what's actually being returned
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
  const authCheck = await checkAuth(request, ['admin']);
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
  const authCheck = await checkAuth(request, ['admin']);
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