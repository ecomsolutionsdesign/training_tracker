// app/api/schedules/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const schedule = await Schedule.findById(id)
      .populate('topicIds')
      .populate('employeeIds')
      .populate('trainer', 'name email role');

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

    if (!body.topicIds || body.topicIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Please provide at least one topic ID' }, { status: 400 });
    }
    if (!body.trainer) {
      return NextResponse.json({ success: false, error: 'Please provide a trainer' }, { status: 400 });
    }

    const schedule = await Schedule.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate('topicIds')
      .populate('employeeIds')
      .populate('trainer', 'name email role');

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