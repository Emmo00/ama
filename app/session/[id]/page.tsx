"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import TippingModal from "~/components/tipping-modal";
import { ArrowLeft, MessageCircle, Send, Share2 } from "lucide-react";
import {
  getSessionDetails,
  getSessionQuestions,
  getQuestionAnswers,
  askQuestion,
  postAnswer,
  endSession,
  tipCreator,
} from "~/onchain/writes"; // adjust path as needed

export default function SessionPage({ params }: { params: { id: string } }) {
  const sessionId = Number(params.id);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const [session, setSession] = useState<{
    creator: string;
    title: string;
    description: string;
    active: boolean;
  } | null>(null);

  const [questions, setQuestions] = useState<
    {
      questionId: number;
      asker: string;
      content: string;
      timestamp: number;
      answer?: string;
    }[]
  >([]);

  const [answersInput, setAnswersInput] = useState<{ [key: number]: string }>(
    {}
  );
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const isHost = session?.creator?.toLowerCase() === address?.toLowerCase();

  // Load session details and questions
  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      const details: any = await getSessionDetails(sessionId);
      setSession({
        creator: details[0],
        title: details[1],
        description: details[2],
        active: details[3],
      });
      setSessionEnded(!details[3]);
    }

    async function fetchQuestions() {
      const qs: any[] = await getSessionQuestions(sessionId);
      const enriched = await Promise.all(
        qs.map(async (q) => {
          const ansRes: any[] = await getQuestionAnswers(q.questionId);
          const firstAnswer = ansRes[0]?.content ?? "";
          return { ...q, answer: firstAnswer };
        })
      );
      setQuestions(enriched);
    }

    fetchSession();
    fetchQuestions();
  }, [sessionId]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }
    setIsSubmitting(true);
    await askQuestion(sessionId, newQuestion);
    setNewQuestion("");
    setIsSubmitting(false);
    await new Promise((r) => setTimeout(r, 1000)); // wait for chain to update
    window.location.reload();
  };

  const handleAnswerSubmit = async (questionId: number) => {
    const answer = answersInput[questionId];
    if (!answer?.trim()) return;
    await postAnswer(sessionId, questionId, answer);
    setAnswersInput({ ...answersInput, [questionId]: "" });
    await new Promise((r) => setTimeout(r, 1000));
    window.location.reload();
  };

  const handleEndSession = async () => {
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }
    await endSession(sessionId);
    alert("Session ended successfully!");
    setSessionEnded(true);
  };

  const handleShareSession = () => {
    const sessionUrl = window.location.href;
    navigator.clipboard.writeText(sessionUrl);
    alert(`Link copied to clipboard!\n${sessionUrl}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        {session && (
          <>
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.active
                      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                      : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800"
                  }`}
                >
                  {session.active ? "LIVE" : "ENDED"}
                </span>
                <div className="flex items-center text-gray-500">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {questions.length} questions
                </div>
              </div>
              <h1 className="text-3xl font-bold text-black mb-2">
                {session.title}
              </h1>
              <p className="text-gray-600 mb-4">{session.description}</p>
            </div>

            <div className="flex justify-end gap-3 mb-6">
              {isHost && session.active && (
                <Button
                  onClick={handleEndSession}
                  variant="outline"
                  className="text-red-600 border-red-200"
                >
                  End Session
                </Button>
              )}
              <Button
                onClick={handleShareSession}
                variant="outline"
                className="text-gray-600 border-gray-200"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share AMA
              </Button>
              {session.active && (
                <Button
                  onClick={() => setShowTippingModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                >
                  💸 Tip Creator
                </Button>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-6 mb-8">
              {questions.map((q) => (
                <Card
                  key={q.questionId}
                  className="border border-gray-100 shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-black">
                          @{q.asker}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(q.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800">{q.content}</p>
                    </div>
                    {q.answer ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
                            {session.creator.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="font-medium text-black">@host</span>
                        </div>
                        <p className="text-gray-800">{q.answer}</p>
                      </div>
                    ) : isHost && session.active ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your answer…"
                          value={answersInput[q.questionId] || ""}
                          onChange={(e) =>
                            setAnswersInput({
                              ...answersInput,
                              [q.questionId]: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleAnswerSubmit(q.questionId)}
                          disabled={!answersInput[q.questionId]?.trim()}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600 italic">
                          Waiting for answer…
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ask question */}
            {!isHost && session.active && (
              <Card className="border border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <form onSubmit={handleQuestionSubmit}>
                    <Textarea
                      placeholder="Ask your question…"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="min-h-[100px]"
                      rows={4}
                    />
                    <div className="flex justify-end mt-4">
                      <Button
                        type="submit"
                        disabled={!newQuestion.trim() || isSubmitting}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      >
                        {isSubmitting ? (
                          "Submitting..."
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {!isSubmitting && "Submit Question"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {sessionEnded && (
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Session Ended
                  </h3>
                  <p className="text-gray-600">
                    This AMA session has ended. Thank you!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <TippingModal
        isOpen={showTippingModal}
        onClose={() => setShowTippingModal(false)}
        creatorName={session?.creator || ""}
      />
    </div>
  );
}
