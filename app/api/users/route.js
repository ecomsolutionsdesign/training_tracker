// app/api/users/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { checkAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const authCheck = await checkAuth(request, ['admin']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const authCheck = await checkAuth(request, ['admin']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 6);
    
    const user = await User.create({
      ...body,
      password: hashedPassword,
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return NextResponse.json({ success: true, data: userResponse }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}