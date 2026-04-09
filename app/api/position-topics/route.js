// app/api/position-topics/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PositionTopicMap from '@/models/PositionTopicMap';
import { checkAuth } from '@/lib/auth';

// ... existing imports

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('position'); // This is now an ID

    const filter = positionId ? { position: positionId } : {};
    // Added populate('position') to get the name along with the map
    const maps = await PositionTopicMap.find(filter)
      .populate('position') 
      .populate('topicIds')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: maps });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const authCheck = await checkAuth(request, ['admin', 'qa-officer']);
  if (!authCheck.authorized) return authCheck.response;

  try {
    await connectDB();
    const { position, topicIds } = await request.json(); // position is now an ID

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position ID is required' }, { status: 400 });
    }

    const map = await PositionTopicMap.findOneAndUpdate(
      { position }, // Matches based on the Position ObjectId
      { position, topicIds: topicIds || [] },
      { new: true, upsert: true, runValidators: true }
    ).populate('topicIds');

    return NextResponse.json({ success: true, data: map }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}