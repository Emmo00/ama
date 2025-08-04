import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { User, Session, Question, Tip } from '~/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }
    
    // Find users who have interacted most with this user's sessions
    const userSessions = await Session.find({ creatorFid: fid });
    const sessionIds = userSessions.map(session => session._id);
    
    if (sessionIds.length === 0) {
      return NextResponse.json({ bestFriends: [] });
    }
    
    // Get questions from user's sessions
    const questions = await Question.find({ 
      sessionId: { $in: sessionIds },
      askerFid: { $ne: fid } // Exclude the user themselves
    });
    
    // Get tips to user's sessions
    const tips = await Tip.find({ 
      sessionId: { $in: sessionIds },
      senderFid: { $ne: fid } // Exclude the user themselves
    });
    
    // Count interactions per user
    const interactionCounts: { [key: string]: number } = {};
    
    // Count questions
    questions.forEach(question => {
      interactionCounts[question.askerFid] = (interactionCounts[question.askerFid] || 0) + 1;
    });
    
    // Count tips (weight them more heavily)
    tips.forEach(tip => {
      interactionCounts[tip.senderFid] = (interactionCounts[tip.senderFid] || 0) + 2;
    });
    
    // Sort by interaction count and get top friends
    const sortedFids = Object.entries(interactionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([fid]) => fid);
    
    // Get user details for best friends
    const bestFriends = await User.find({ fid: { $in: sortedFids } });
    
    // Add interaction counts to the response
    const bestFriendsWithCounts = bestFriends.map(friend => ({
      ...friend.toObject(),
      interactionCount: interactionCounts[friend.fid]
    }));
    
    // Sort by interaction count
    bestFriendsWithCounts.sort((a, b) => b.interactionCount - a.interactionCount);
    
    return NextResponse.json({ bestFriends: bestFriendsWithCounts });
  } catch (error) {
    console.error('Error fetching best friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best friends' },
      { status: 500 }
    );
  }
} 