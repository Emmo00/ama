import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { Question, Session, User } from '~/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const askerFid = searchParams.get('askerFid');
    
    let query: any = {};
    
    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return NextResponse.json(
          { error: 'Invalid session ID' },
          { status: 400 }
        );
      }
      query.sessionId = sessionId;
    }
    
    if (askerFid) {
      query.askerFid = askerFid;
    }
    
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { sessionId, askerFid, content } = body;
    
    if (!sessionId || !askerFid || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, askerFid, content' },
        { status: 400 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Verify session exists and is live
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (session.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Session is not live' },
        { status: 400 }
      );
    }
    
    // Verify user exists
    const user = await User.findOne({ fid: askerFid });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please create user first.' },
        { status: 404 }
      );
    }
    
    const question = new Question({
      sessionId,
      askerFid,
      content,
    });
    
    await question.save();
    
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
