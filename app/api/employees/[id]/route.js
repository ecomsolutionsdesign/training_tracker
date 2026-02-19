// app/api/employees/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { checkAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  // Only admin and qa-officer can update employees
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    
    const employee = await Employee.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    if (error.errors) {
      console.error('❌ Validation errors:', error.errors);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.errors || null 
    }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  // Only admin and qa-officer can delete employees
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  const { id } = await params;
  try {
    await connectDB();
    const employee = await Employee.findByIdAndDelete(id);
    
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}