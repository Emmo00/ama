"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Plus, User, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import sdk from "@farcaster/miniapp-sdk";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useSessions } from "@/hooks/useSessions";
import { CreateSessionModal } from "@/components/CreateSessionModal";
import { SessionCard } from "@/components/SessionCard";

export default function Home() {
  const {
    user,
    isLoading: authLoading,
    error: authError,
    isAuthenticated,
  } = useQuickAuth();
  const {
    sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    endSession,
  } = useSessions();
  const [userSessions, setUserSessions] = useState<any[]>([]);

  // Fetch user's sessions when user is authenticated
  useEffect(() => {
    if (user?.fid) {
      fetchSessions(undefined, user.fid.toString())
        .then(setUserSessions)
        .catch(console.error);
    }
  }, [user]);

  const handleSessionCreated = () => {
    // Refresh both live sessions and user sessions
    fetchSessions("LIVE");
    if (user?.fid) {
      fetchSessions(undefined, user.fid.toString())
        .then(setUserSessions)
        .catch(console.error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await endSession(sessionId);
      // Refresh user sessions
      if (user?.fid) {
        fetchSessions(undefined, user.fid.toString())
          .then(setUserSessions)
          .catch(console.error);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  const refreshSessions = () => {
    fetchSessions("LIVE");
  };

  useEffect(() => {
    // Signal that the app is ready once authentication is complete
    if (!authLoading && isAuthenticated) {
      sdk.actions.ready();
    }
  }, [authLoading, isAuthenticated]);

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Farcaster...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-600 mb-4">{authError}</p>
          <p className="text-gray-500 text-sm mb-6">
            This app requires Farcaster authentication. Please make sure you're
            opening this app from a Farcaster client.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start flex-col justify-between mb-12">
            <div className="flex items-center justify-between mb-2 w-full">
              <h1 className="text-4xl font-bold text-black mb-2">AMA</h1>
              <div className="flex items-center gap-4">
                {user && (
                  <Link href={`/profile/${user.username}`}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200">
                      {user.pfpUrl ? (
                        <img
                          src={user.pfpUrl}
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-700 font-medium">
                        {user.username}
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
            <p className="text-gray-600">
              Ask Me Anything sessions on Farcaster
            </p>
        </div>

        {/* User Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <CreateSessionModal onSessionCreated={handleSessionCreated} />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshSessions}
            disabled={sessionsLoading}
            className="flex items-center gap-2 text-black"
          >
            <RefreshCw
              className={`w-4 h-4 ${sessionsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Welcome message for authenticated users */}
        {user && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-purple-900 mb-1">
              Welcome back, {user.username}! 👋
            </h3>
            <p className="text-purple-700">
              Ready to host an AMA or join the conversation?
            </p>
          </div>
        )}

        {/* User's Sessions */}
        {user && userSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Your Sessions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  stats={session.stats}
                  isOwner={true}
                  onEndSession={handleEndSession}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live Sessions */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-4">Live Sessions</h2>

          {sessionsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            </div>
          )}

          {sessionsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">
                Failed to load sessions: {sessionsError}
              </p>
            </div>
          )}

          {!sessionsLoading && !sessionsError && sessions.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Live Sessions
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to start an AMA session!
              </p>
              <CreateSessionModal onSessionCreated={handleSessionCreated} />
            </div>
          )}

          {!sessionsLoading && sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  stats={session.stats}
                  isOwner={user?.fid?.toString() === session.creatorFid}
                  onEndSession={handleEndSession}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock user data for the profile icon
const mockCurrentUser = {
  username: "vitalik.eth",
  avatar: "V",
};
