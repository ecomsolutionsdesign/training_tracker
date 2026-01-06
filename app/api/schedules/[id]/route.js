// FILE: app/api/schedules/[id]/route.js
// ============================================
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const schedule = await Schedule.findById(id)
      // CHANGED: Populate topicIds instead of topicId
      .populate('topicIds')
      .populate('employeeIds');
    
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    // Validate that topicIds is present and is an array of IDs
    if (!body.topicIds || body.topicIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Please provide at least one topic ID' }, { status: 400 });
    }
    const schedule = await Schedule.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
    // CHANGED: Populate topicIds instead of topicId
    .populate('topicIds').populate('employeeIds');
    
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const schedule = await Schedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}