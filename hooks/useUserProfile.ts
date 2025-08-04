import { useState, useEffect } from 'react';

export interface UserProfile {
  fid: string;
  username: string;
  pfpUrl?: string;
}

// Cache to store user profiles to avoid duplicate requests
const userCache = new Map<string, UserProfile>();

export function useUserProfile(fid: string | null) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fid) {
      setUser(null);
      return;
    }

    // Check cache first
    if (userCache.has(fid)) {
      setUser(userCache.get(fid) || null);
      return;
    }

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/users?fid=${fid}`);
        
        if (!response.ok) {
          throw new Error('User not found');
        }

        const data = await response.json();
        const userProfile = data.user;
        
        // Cache the result
        userCache.set(fid, userProfile);
        setUser(userProfile);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [fid]);

  return { user, isLoading, error };
}

export function useUserProfiles(fids: string[]) {
  const [users, setUsers] = useState<Map<string, UserProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fids.length === 0) {
      setUsers(new Map());
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check which users are not in cache
        const uncachedFids = fids.filter(fid => !userCache.has(fid));
        
        // Start with cached users
        const userMap = new Map<string, UserProfile>();
        fids.forEach(fid => {
          if (userCache.has(fid)) {
            userMap.set(fid, userCache.get(fid)!);
          }
        });

        // Fetch uncached users
        if (uncachedFids.length > 0) {
          const promises = uncachedFids.map(async (fid) => {
            try {
              const response = await fetch(`/api/users?fid=${fid}`);
              if (response.ok) {
                const data = await response.json();
                return { fid, user: data.user };
              }
              return { fid, user: null };
            } catch {
              return { fid, user: null };
            }
          });

          const results = await Promise.all(promises);
          
          results.forEach(({ fid, user }) => {
            if (user) {
              userCache.set(fid, user);
              userMap.set(fid, user);
            } else {
              // Set a fallback user for failed requests
              const fallbackUser = { fid, username: `User ${fid}`, pfpUrl: undefined };
              userMap.set(fid, fallbackUser);
            }
          });
        }

        setUsers(userMap);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [fids.join(',')]); // Use join to create a stable dependency

  return { users, isLoading, error };
}
