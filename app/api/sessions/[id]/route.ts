import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { Session, Question, Tip, ArchivedSessionStats, ITip, IQuestion } from '~/lib/models';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    const session = await Session.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Get questions and tips for this session
    const questions = await Question.find({ sessionId: id })
      .sort({ createdAt: -1 });
    
    const tips = await Tip.find({ sessionId: id })
      .sort({ createdAt: -1 });
    
    const totalTips = tips.reduce((sum: number, tip: ITip) => sum + tip.amount, 0);
    
    return NextResponse.json({
      session,
      questions,
      tips,
      stats: {
        totalTips,
        totalQuestions: questions.length,
        totalParticipants: new Set([
          ...questions.map((q: IQuestion) => q.askerFid),
          ...tips.map((t: ITip) => t.senderFid)
        ]).size
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    const session = await Session.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Only allow updating status for now
    if (body.status && ['LIVE', 'ENDED'].includes(body.status)) {
      session.status = body.status;
      
      // If ending the session, create archived stats
      if (body.status === 'ENDED' && session.status !== 'ENDED') {
        const questions = await Question.find({ sessionId: id });
        const tips = await Tip.find({ sessionId: id });
        
        const archivedStats = new ArchivedSessionStats({
          sessionId: id,
          totalTips: tips.reduce((sum: number, tip: ITip) => sum + tip.amount, 0),
          totalQuestions: questions.length,
          totalParticipants: new Set([
            ...questions.map((q: IQuestion) => q.askerFid),
            ...tips.map((t: ITip) => t.senderFid)
          ]).size
        });
        
        await archivedStats.save();
      }
      
      await session.save();
    }
    
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
