// app/api/position-topics/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PositionTopicMap from '@/models/PositionTopicMap';
import { checkAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    const filter = position ? { position } : {};
    const maps = await PositionTopicMap.find(filter).populate('topicIds').sort({ position: 1 });

    return NextResponse.json({ success: true, data: maps });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// POST /api/position-topics  – create or overwrite a mapping
export async function POST(request) {
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const { position, topicIds } = await request.json();

    if (!position) {
      return NextResponse.json(
        { success: false, error: 'Position is required' },
        { status: 400 }
      );
    }

    // Upsert: update if exists, insert if not
    const map = await PositionTopicMap.findOneAndUpdate(
      { position },
      { position, topicIds: topicIds || [] },
      { new: true, upsert: true, runValidators: true }
    ).populate('topicIds');

    return NextResponse.json({ success: true, data: map }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}