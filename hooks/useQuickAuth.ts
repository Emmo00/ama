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
  const [state, setState] = useState<QuickAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Use the Farcaster SDK's Quick Auth to make authenticated requests
        const response = await sdk.quickAuth.fetch('/api/auth/me', {
          method: 'GET',
        });

        if (response.ok) {
          const userData = await response.json();
          setState({
            user: userData,
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setState({
            user: null,
            isLoading: false,
            error: errorData.message || 'Authentication failed',
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Quick Auth error:', error);
        setState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
          isAuthenticated: false,
        });
      }
    };

    authenticateUser();
  }, []);

  return state;
}
