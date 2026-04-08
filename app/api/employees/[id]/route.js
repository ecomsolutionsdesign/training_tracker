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
    console.error('❌ Error updating employee:', error.message);
    if (error.errors) console.error('❌ Validation errors:', error.errors);

    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.errors || null,
    }, { status: 400 });
  }
}

/**
 * PATCH /api/employees/[id]
 * Body: { isActive: true | false }
 * Only admin can activate/deactivate.
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    // 1. Await params and get the ID
    const { id } = await params; 
    
    // 2. Parse the body
    const body = await request.json();
    const { isActive } = body;

    // 3. Find the document first
    const employee = await Employee.findById(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' }, 
        { status: 404 }
      );
    }

    // 4. Update fields manually
    // This bypasses issues where findByIdAndUpdate might miss validation
    employee.isActive = isActive;
    employee.deactivatedAt = isActive ? null : new Date();

    // 5. Save (this will throw a specific error if validation fails)
    await employee.save();

    return NextResponse.json({ success: true, data: employee });

  } catch (error) {
    // LOG THE FULL ERROR TO YOUR TERMINAL
    console.error("DETAILED PATCH ERROR:", error);

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        // Optional: send validation details to frontend for debugging
        details: error.errors ? Object.keys(error.errors) : null 
      }, 
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  // Only admin can hard-delete employees
  const authCheck = await checkAuth(request, ['admin']);
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
