import connectToDatabase from './mongodb';
import { Session, Question, Tip, ArchivedSessionStats, ISession, IQuestion, ITip } from './models';

export async function archiveSession(sessionId: string): Promise<void> {
  await connectToDatabase();
  
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status === 'ENDED') {
    throw new Error('Session is already ended');
  }
  
  // Get session stats
  const questions = await Question.find({ sessionId });
  const tips = await Tip.find({ sessionId });
  
  const totalTips = tips.reduce((sum: number, tip: ITip) => sum + tip.amount, 0);
  const uniqueParticipants = new Set([
    ...questions.map((q: IQuestion) => q.askerFid),
    ...tips.map((t: ITip) => t.senderFid)
  ]);
  
  // Create archived stats
  const archivedStats = new ArchivedSessionStats({
    sessionId,
    totalTips,
    totalQuestions: questions.length,
    totalParticipants: uniqueParticipants.size,
  });
  
  // Update session status and save archived stats
  session.status = 'ENDED';
  
  await Promise.all([
    session.save(),
    archivedStats.save()
  ]);
}

export async function getSessionStats(sessionId: string) {
  await connectToDatabase();
  
  const [session, questions, tips] = await Promise.all([
    Session.findById(sessionId),
    Question.find({ sessionId }),
    Tip.find({ sessionId })
  ]);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  const totalTips = tips.reduce((sum: number, tip: ITip) => sum + tip.amount, 0);
  const uniqueParticipants = new Set([
    ...questions.map((q: IQuestion) => q.askerFid),
    ...tips.map((t: ITip) => t.senderFid)
  ]);
  
  return {
    session,
    stats: {
      totalTips,
      totalQuestions: questions.length,
      totalParticipants: uniqueParticipants.size,
      answeredQuestions: questions.filter((q: IQuestion) => q.answer).length,
      averageTipAmount: tips.length > 0 ? totalTips / tips.length : 0,
    }
  };
}

export async function checkExpiredSessions(): Promise<void> {
  await connectToDatabase();
  
  const expiredSessions = await Session.find({
    status: 'LIVE',
    endsAt: { $lt: new Date() }
  });
  
  for (const session of expiredSessions) {
    await archiveSession(session._id.toString());
  }
}
