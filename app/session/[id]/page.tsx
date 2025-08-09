"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import TippingModal from "@/components/tipping-modal";
import { ArrowLeft, MessageCircle, Send, Share2 } from "lucide-react";
import sdk from "@farcaster/miniapp-sdk";
import { useUserProfiles } from "@/hooks/useUserProfile";
import { APP_URL } from "@/lib/constants";

interface Session {
  _id: string;
  creatorFid: string;
  title: string;
  description: string;
  status: "LIVE" | "ENDED";
  createdAt: string;
  endsAt: string;
}

interface Question {
  _id: string;
  sessionId: string;
  askerFid: string;
  content: string;
  answer?: string;
  createdAt: string;
}

interface Tip {
  _id: string;
  sessionId: string;
  senderFid: string;
  amount: number;
  txHash: string;
  createdAt: string;
}

interface SessionStats {
  totalTips: number;
  totalQuestions: number;
  totalParticipants: number;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [answersInput, setAnswersInput] = useState<{ [key: string]: string }>(
    {}
  );
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [currentUserFid, setCurrentUserFid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get all unique FIDs for user lookup
  const allFids = React.useMemo(() => {
    const fids = new Set<string>();

    // Add session creator FID
    if (session?.creatorFid) {
      fids.add(session.creatorFid);
    }

    // Add question asker FIDs
    questions.forEach((q) => fids.add(q.askerFid));

    // Add tip sender FIDs
    tips.forEach((t) => fids.add(t.senderFid));

    return Array.from(fids);
  }, [session?.creatorFid, questions, tips]);

  // Fetch user profiles for all FIDs
  const { users: userProfiles } = useUserProfiles(allFids);

  // Initialize user context
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const context = await sdk.context;
        const userFid = context?.user?.fid?.toString();
        const username = context?.user?.username;
        const pfpUrl = context?.user?.pfpUrl;

        if (userFid && username) {
          setCurrentUserFid(userFid);

          // Create user if not exists
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid: userFid, username, pfpUrl }),
          }).catch(() => {
            // User might already exist
          });
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initializeUser();
  }, []);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          throw new Error("Session not found");
        }

        const data = await response.json();
        setSession(data.session);
        setQuestions(data.questions);
        setTips(data.tips);
        setStats(data.stats);
      } catch (error) {
        console.error("Error loading session:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load session"
        );
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const isHost = session?.creatorFid === currentUserFid;

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !currentUserFid) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          askerFid: currentUserFid,
          content: newQuestion.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit question");
      }

      const { question } = await response.json();
      setQuestions((prev) => [question, ...prev]);
      setNewQuestion("");
    } catch (error) {
      console.error("Error asking question:", error);
      alert(
        error instanceof Error ? error.message : "Failed to submit question"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    const answer = answersInput[questionId];
    if (!answer?.trim() || !currentUserFid) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: answer.trim(),
          creatorFid: currentUserFid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit answer");
      }

      const { question } = await response.json();
      setQuestions((prev) =>
        prev.map((q) => (q._id === questionId ? question : q))
      );
      setAnswersInput((prev) => ({ ...prev, [questionId]: "" }));
    } catch (error) {
      console.error("Error answering question:", error);
      alert(error instanceof Error ? error.message : "Failed to submit answer");
    }
  };

  // Handle share to Farcaster
  const handleShareToFarcaster = () => {
    const shareText = `Just joined an AMA session: ${session?.title} by @${
      userProfiles.get(session?.creatorFid!)?.username || "Unknown"
    }`;
    if (!sessionId) return;

    // Open Farcaster share
    sdk.actions.composeCast({
      text: shareText,
      embeds: [`${APP_URL}/share/${sessionId}`], // Use current page URL as embed
    });
  };

  const handleEndSession = async () => {
    if (!currentUserFid || !isHost) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to end session");
      }

      const { session: updatedSession } = await response.json();
      setSession(updatedSession);
    } catch (error) {
      console.error("Error ending session:", error);
      alert(error instanceof Error ? error.message : "Failed to end session");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Session not found"}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === "LIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {session.status === "LIVE" ? "LIVE" : "ENDED"}
              </span>
              {isHost && session.status === "LIVE" && (
                <Button
                  onClick={handleEndSession}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  End Session
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!isHost && (
                <Button
                  onClick={() => setShowTippingModal(true)}
                  size={"sm"}
                  className="bg-gradient-to-l from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                >
                  💰 Send Tip
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-black"
                onClick={handleShareToFarcaster}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-black mb-2">
            {session.title}
          </h1>
          {session.description && (
            <p className="text-gray-600 mb-2">{session.description}</p>
          )}

          {/* Creator info */}
          {session.creatorFid && (
            <p className="text-sm text-gray-500 mb-4">
              Hosted by @
              {userProfiles.get(session.creatorFid)?.username ||
                `User ${session.creatorFid}`}
            </p>
          )}

          {stats && (
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
              <span>{stats.totalQuestions} questions</span>
              <span>Total Tips: ${stats.totalTips}</span>
              <span>{stats.totalParticipants} participants</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ask Question Form */}
            {session.status === "LIVE" && currentUserFid && !isHost && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-4">
                    Ask a Question
                  </h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="What would you like to know?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleAskQuestion}
                      disabled={isSubmitting || !newQuestion.trim()}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Ask Question"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    {session.status === "ENDED" ? (
                      <p>No Questions</p>
                    ) : (
                      <p>No questions yet. Be the first to ask!</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                questions.map((question) => (
                  <Card key={question._id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-black font-medium">
                            {question.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {userProfiles.get(question.askerFid)?.pfpUrl ? (
                              <img
                                src={
                                  userProfiles.get(question.askerFid)?.pfpUrl
                                }
                                alt={
                                  userProfiles.get(question.askerFid)?.username
                                }
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {(
                                  userProfiles.get(question.askerFid)
                                    ?.username || `U${question.askerFid}`
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                            <p className="text-sm text-gray-500">
                              Asked by @
                              {userProfiles.get(question.askerFid)?.username ||
                                `User ${question.askerFid}`}{" "}
                              • {new Date(question.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {question.answer ? (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-purple-900">{question.answer}</p>
                          </div>
                        ) : isHost && session.status === "LIVE" ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your answer..."
                              value={answersInput[question._id] || ""}
                              onChange={(e) =>
                                setAnswersInput((prev) => ({
                                  ...prev,
                                  [question._id]: e.target.value,
                                }))
                              }
                              className="resize-none"
                              rows={2}
                            />
                            <Button
                              onClick={() => handleAnswerQuestion(question._id)}
                              disabled={!answersInput[question._id]?.trim()}
                              size="sm"
                            >
                              Submit Answer
                            </Button>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            Waiting for answer...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tip Button */}
            {!isHost && (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-black mb-4">
                    Support the Creator
                  </h3>
                  <Button
                    onClick={() => setShowTippingModal(true)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                  >
                    💰 Send Tip
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Tips */}
            {tips.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-black mb-4">Recent Tips</h3>
                  <div className="space-y-3">
                    {tips.slice(0, 5).map((tip) => {
                      const tipper = userProfiles.get(tip.senderFid);
                      return (
                        <div
                          key={tip._id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {tipper?.pfpUrl ? (
                            <img
                              src={tipper.pfpUrl}
                              alt={tipper.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {(tipper?.username || `U${tip.senderFid}`)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-600">
                            <span className="font-medium">
                              @{tipper?.username || `User ${tip.senderFid}`}
                            </span>{" "}
                            just tipped{" "}
                            <span className="font-medium text-green-600">
                              ${tip.amount}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Tipping Modal */}
      <TippingModal
        isOpen={showTippingModal}
        onClose={() => setShowTippingModal(false)}
        sessionId={sessionId}
        creatorFid={session?.creatorFid}
        creatorUsername={
          session?.creatorFid
            ? userProfiles.get(session.creatorFid)?.username
            : undefined
        }
        onTipSuccess={(tip) => {
          setTips((prev) => [tip, ...prev]);
          if (stats) {
            setStats((prev) =>
              prev
                ? {
                    ...prev,
                    totalTips: prev.totalTips + Number(tip.amount),
                  }
                : null
            );
          }
        }}
      />
    </div>
  );
}
