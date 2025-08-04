import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { Session, User } from '~/lib/models';
import { withQuickAuth } from '~/lib/quickAuth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const creatorFid = searchParams.get('creatorFid');
    
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (creatorFid) {
      query.creatorFid = creatorFid;
    }
    
    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export const POST = withQuickAuth(async (user: any, request: NextRequest) => {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { title, description } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description' },
        { status: 400 }
      );
    }
    
    // Check if user already has a live session
    const existingLiveSession = await Session.findOne({ 
      creatorFid: user.fid, 
      status: 'LIVE' 
    });
    
    if (existingLiveSession) {
      return NextResponse.json(
        { error: 'You already have a live session. End your current session before creating a new one.' },
        { status: 409 }
      );
    }
    
    const session = new Session({
      creatorFid: user.fid,
      title,
      description,
      status: 'LIVE',
    });
    
    await session.save();
    
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
});
