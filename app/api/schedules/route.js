// FILE: app/api/schedules/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';

export async function GET(request) {
  try {
    await connectDB();
    const schedules = await Schedule.find()
      .populate('topicIds')
      .populate('employeeIds')
      .sort({ date: -1 });
    
    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.topicIds || body.topicIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Please provide at least one topic ID' }, { status: 400 });
    }

    const schedule = await Schedule.create(body);
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('topicIds')
      .populate('employeeIds');
    
    return NextResponse.json({ success: true, data: populatedSchedule }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}