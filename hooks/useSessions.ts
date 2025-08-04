import { useState, useEffect } from 'react';
import sdk from "@farcaster/miniapp-sdk";

export interface Session {
  _id: string;
  creatorFid: string;
  title: string;
  description: string;
  status: 'LIVE' | 'ENDED';
  createdAt: string;
  updatedAt: string;
  stats?: SessionStats;
}

export interface SessionStats {
  totalTips: number;
  totalQuestions: number;
  totalParticipants: number;
}

export interface CreateSessionData {
  title: string;
  description: string;
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (status?: 'LIVE' | 'ENDED', creatorFid?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (creatorFid) params.append('creatorFid', creatorFid);
      
      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
      
      // Fetch stats for each session
      const sessionsWithStats = await Promise.all(
        data.sessions.map(async (session: Session) => {
          try {
            const statsResponse = await fetch(`/api/sessions/${session._id}`);
            const statsData = await statsResponse.json();
            return {
              ...session,
              stats: statsData.stats || { totalTips: 0, totalQuestions: 0, totalParticipants: 0 }
            };
          } catch {
            return {
              ...session,
              stats: { totalTips: 0, totalQuestions: 0, totalParticipants: 0 }
            };
          }
        })
      );
      
      setSessions(sessionsWithStats);
      return sessionsWithStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: CreateSessionData) => {
    try {
      setError(null);
      
      const response = await sdk.quickAuth.fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }
      
      // Refresh sessions after creating
      await fetchSessions();
      
      return data.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      setError(null);
      
      const response = await sdk.quickAuth.fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ENDED' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to end session');
      }
      
      // Refresh sessions after ending
      await fetchSessions();
      
      return data.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw err;
    }
  };

  const getSessionDetails = async (sessionId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session details');
      }
      
      return {
        session: data.session,
        questions: data.questions,
        tips: data.tips,
        stats: data.stats as SessionStats,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session details';
      setError(errorMessage);
      throw err;
    }
  };

  // Auto-fetch live sessions on mount
  useEffect(() => {
    fetchSessions('LIVE');
  }, []);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    endSession,
    getSessionDetails,
  };
}
