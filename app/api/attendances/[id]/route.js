// FILE: app/api/attendances/[id]/route.js
// ============================================
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const attendance = await Attendance.findById(id)
      .populate({
        path: 'scheduleId',
        populate: { path: 'topicIds' }
      })
      .populate('employeeId');
    
    if (!attendance) {
      return NextResponse.json({ success: false, error: 'Attendance not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const attendance = await Attendance.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'scheduleId',
        populate: { path: 'topicIds' }
      })
      .populate('employeeId');
    
    if (!attendance) {
      return NextResponse.json({ success: false, error: 'Attendance not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return NextResponse.json({ success: false, error: 'Attendance not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
