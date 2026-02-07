// // FILE: app/api/topics/route.js
// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/mongodb';
// import Topic from '@/models/Topic';

// export async function GET(request) {
//   try {
//     await connectDB();
//     const { searchParams } = new URL(request.url);
//     const department = searchParams.get('department');
    
//     const filter = department && department !== 'All' ? { department } : {};
//     const topics = await Topic.find(filter).sort({ createdAt: -1 });
    
//     return NextResponse.json({ success: true, data: topics });
//   } catch (error) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
//   }
// }

// export async function POST(request) {
//   try {
//     await connectDB();
//     const body = await request.json();
//     const topic = await Topic.create(body);
    
//     return NextResponse.json({ success: true, data: topic }, { status: 201 });
//   } catch (error) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
//   }
// }

// app/api/topics/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Topic from '@/models/Topic';
import { checkAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    const filter = department && department !== 'All' ? { department } : {};
    const topics = await Topic.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: topics });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  // Only admin and qa-officer can add topics
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const body = await request.json();
    const topic = await Topic.create(body);
    
    return NextResponse.json({ success: true, data: topic }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}