import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { Question, Session } from '~/lib/models';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const body = await request.json();
    const { answer, creatorFid } = body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }
    
    if (!answer || !creatorFid) {
      return NextResponse.json(
        { error: 'Missing required fields: answer, creatorFid' },
        { status: 400 }
      );
    }
    
    const question = await Question.findById(id);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Verify the person answering is the session creator
    const session = await Session.findById(question.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (session.creatorFid !== creatorFid) {
      return NextResponse.json(
        { error: 'Only the session creator can answer questions' },
        { status: 403 }
      );
    }
    
    question.answer = answer;
    await question.save();
    
    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
