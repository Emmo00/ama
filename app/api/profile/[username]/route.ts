import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import { User, Session, Question, Tip } from '../../../../lib/models';

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    await connectToDatabase();
    
    const { username } = await params;
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's sessions
    const sessions = await Session.find({ creatorFid: user.fid })
      .sort({ createdAt: -1 });

    // Get current live session
    const currentSession = sessions.find(session => session.status === 'LIVE');

    // Get past sessions (ended sessions)
    const pastSessions = sessions.filter(session => session.status === 'ENDED');

    // Calculate statistics
    const sessionIds = sessions.map(session => session._id);
    
    const [totalQuestions, totalTips, totalTipsAmount] = await Promise.all([
      Question.countDocuments({ sessionId: { $in: sessionIds } }),
      Tip.countDocuments({ sessionId: { $in: sessionIds } }),
      Tip.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get stats for current session if exists
    let currentSessionStats = null;
    if (currentSession) {
      const [currentQuestions, currentTips] = await Promise.all([
        Question.countDocuments({ sessionId: currentSession._id }),
        Tip.countDocuments({ sessionId: currentSession._id })
      ]);
      
      currentSessionStats = {
        totalQuestions: currentQuestions,
        totalTips: currentTips
      };
    }

    // Get stats for each past session
    const pastSessionsWithStats = await Promise.all(
      pastSessions.map(async (session) => {
        const [questionCount, tipCount] = await Promise.all([
          Question.countDocuments({ sessionId: session._id }),
          Tip.countDocuments({ sessionId: session._id })
        ]);
        
        return {
          ...session.toObject(),
          stats: {
            totalQuestions: questionCount,
            totalTips: tipCount
          }
        };
      })
    );

    const profileData = {
      user: {
        fid: user.fid,
        username: user.username,
        pfpUrl: user.pfpUrl,
        createdAt: user.createdAt
      },
      currentSession: currentSession ? {
        ...currentSession.toObject(),
        stats: currentSessionStats
      } : null,
      pastSessions: pastSessionsWithStats,
      stats: {
        totalSessions: sessions.length,
        totalQuestions,
        totalTips: totalTipsAmount.length > 0 ? totalTipsAmount[0].total : 0,
        liveSessions: sessions.filter(s => s.status === 'LIVE').length,
        endedSessions: sessions.filter(s => s.status === 'ENDED').length
      }
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
