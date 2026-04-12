// app/api/users/trainers/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const trainers = await User.find({
      role: { $in: ['admin', 'qa-officer', 'department-head'] },
      isActive: true,
    })
      .select('name email role department')
      .sort({ name: 1 });

    return NextResponse.json({ success: true, data: trainers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}