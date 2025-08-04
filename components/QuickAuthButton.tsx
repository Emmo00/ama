"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import sdk from "@farcaster/miniapp-sdk";

interface QuickAuthButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function QuickAuthButton({ 
  onSuccess, 
  onError, 
  className,
  children = "Connect with Farcaster"
}: QuickAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      
      // Use Quick Auth to authenticate
      const response = await sdk.quickAuth.fetch('/api/auth/me', {
        method: 'GET',
      });

      if (response.ok) {
        const userData = await response.json();
        onSuccess?.(userData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        onError?.(errorData.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Quick Auth error:', error);
      onError?.(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleAuth}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Connecting...' : children}
    </Button>
  );
}
