import { useState, useEffect } from 'react';

export interface ProfileUser {
  fid: string;
  username: string;
  pfpUrl?: string;
  createdAt: string;
}

export interface ProfileSession {
  _id: string;
  creatorFid: string;
  title: string;
  description: string;
  status: 'LIVE' | 'ENDED';
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalQuestions: number;
    totalTips: number;
  };
}

export interface ProfileStats {
  totalSessions: number;
  totalQuestions: number;
  totalTips: number;
  liveSessions: number;
  endedSessions: number;
}

export interface ProfileData {
  user: ProfileUser;
  currentSession: ProfileSession | null;
  pastSessions: ProfileSession[];
  stats: ProfileStats;
}

export function useProfile(username: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/profile/${username}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
        setError(errorMessage);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const refreshProfile = async () => {
    if (!username) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/profile/${username}`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh profile';
      setError(errorMessage);
    }
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile
  };
}
