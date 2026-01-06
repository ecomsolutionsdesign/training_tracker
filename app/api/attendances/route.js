// FILE: app/api/attendances/route.js
// ============================================
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request) {
  try {
    await connectDB();
    const attendances = await Attendance.find()
      .populate({
        path: 'scheduleId',
        populate: { path: 'topicIds' }
      })
      .populate('employeeId')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: attendances });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const attendance = await Attendance.create(body);
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'scheduleId',
        populate: { path: 'topicIds' }
      })
      .populate('employeeId');
    
    return NextResponse.json({ success: true, data: populatedAttendance }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
