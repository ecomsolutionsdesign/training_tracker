import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { checkAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const showAll = searchParams.get('showAll') === 'true';

    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (!showAll) {
      filter.isActive = true;
    }

    // FIX: was using undefined `query` variable instead of `filter`
    const employees = await Employee.find(filter)
      .populate('position', 'name')  // FIX: field is 'name', not 'title'
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const body = await request.json();
    const employee = await Employee.create(body);
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}