import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { Session, User } from '~/lib/models';

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

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { creatorFid, title, description } = body;
    
    if (!creatorFid || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorFid, title, description' },
        { status: 400 }
      );
    }
    
    // Ensure user exists
    let user = await User.findOne({ fid: creatorFid });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please create user first.' },
        { status: 404 }
      );
    }
    
    const session = new Session({
      creatorFid,
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
}
