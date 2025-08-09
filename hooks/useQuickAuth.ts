"use client";

import { useState, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

interface QuickAuthUser {
  fid: string;
  username: string;
  pfpUrl?: string;
  createdAt: string;
}

interface QuickAuthState {
  user: QuickAuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useQuickAuth(): QuickAuthState {
  const [user, setUser] = useState<QuickAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching user data...",);

        // Use the Farcaster SDK's Quick Auth to make authenticated requests
        const response = await sdk.quickAuth.fetch('/api/auth/me');

        console.log("User data fetched:", response);

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsLoading(false);
          setError(null);
          setIsAuthenticated(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setUser(null);
          setIsLoading(false);
          setError(errorData.message || 'Authentication failed');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Quick Auth error:', error);
        setUser(null);
        setIsLoading(false);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setIsAuthenticated(false);
      }
    };

    authenticateUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
  };
}
