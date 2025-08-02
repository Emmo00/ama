"use client"

import type React from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import TippingModal from "~/components/tipping-modal"
import { ArrowLeft, MessageCircle, Send, Share2 } from "lucide-react" // Import Share2 icon
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"

// Mock data for the session
const sessionData = {
  id: "1",
  title: "Building the Future of Web3",
  host: {
    username: "vitalik.eth",
    displayName: "Vitalik Buterin",
    avatar: "V",
  },
  isHost: true, // Change this to see the host view with End Session button
  questions: [
    {
      id: "1",
      question: "What do you think is the biggest challenge facing Ethereum in 2024?",
      author: "alice.eth",
      timestamp: "2 minutes ago",
      answer:
        "Scalability remains our top priority. We're making great progress with rollups and sharding, but there's still work to be done make Ethereum accessible everyone.",
    },
    {
      id: "2",
      question: "How do you see the relationship between AI and blockchain evolving?",
      author: "bob.crypto",
      timestamp: "5 minutes ago",
      answer: "",
    },
    {
      id: "3",
      question: "What advice would you give to developers just starting in Web3?",
      author: "charlie.dev",
      timestamp: "8 minutes ago",
      answer:
        "Start by understanding the fundamentals - cryptography, consensus mechanisms, and smart contract security. Build small projects learn from community.",
    },
    {
      id: "4",
      question: "Do you think we'll see mainstream adoption of crypto payments in the next 5 years?",
      author: "diana.eth",
      timestamp: "12 minutes ago",
      answer: "",
    },
  ],
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const paramsHook = useParams()
  const id = paramsHook.id as string
  const [newQuestion, setNewQuestion] = useState("")
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTippingModal, setShowTippingModal] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setNewQuestion("")
    setIsSubmitting(false)
  }

  const handleAnswerSubmit = async (questionId: string) => {
    const answer = answers[questionId]
    if (!answer?.trim()) return

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setAnswers({ ...answers, [questionId]: "" })
  }

  const handleEndSession = async () => {
    // Simulate API call to end session
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSessionEnded(true)
  }

  const handleShareSession = () => {
    // In a real app, you would implement actual sharing logic here
    // e.g., using navigator.share() or copying the URL to clipboard
    const sessionUrl = window.location.href
    console.log(`Sharing session: ${sessionUrl}`)
    alert(`Link copied to clipboard! (Simulated) \n${sessionUrl}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                {!sessionEnded ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mr-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-800 mr-4">
                    ENDED
                  </span>
                )}
                <div className="flex items-center text-gray-500">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {sessionData.questions.length} questions
                </div>
              </div>

              <h1 className="text-3xl font-bold text-black mb-4">{sessionData.title}</h1>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4">
                  {sessionData.host.avatar}
                </div>
                <div>
                  <p className="font-semibold text-black">{sessionData.host.displayName}</p>
                  <p className="text-gray-600">@{sessionData.host.username}</p>
                </div>
              </div>
            </div>

          </div>
            <div className="flex gap-3 my-4">
              {sessionData.isHost && !sessionEnded && (
                <Button
                  onClick={handleEndSession}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-transparent"
                >
                  End Session
                </Button>
              )}
              <Button
                onClick={handleShareSession}
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share AMA
              </Button>
              <Button
                onClick={() => setShowTippingModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                💸 Tip Creator
              </Button>
            </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6 mb-8">
          {sessionData.questions.map((q) => (
            <Card key={q.id} className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-black">@{q.author}</span>
                    <span className="text-sm text-gray-500">{q.timestamp}</span>
                  </div>
                  <p className="text-gray-800 text-lg">{q.question}</p>
                </div>

                {q.answer ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-gradient-to-b from-purple-500 to-pink-500">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
                        {sessionData.host.avatar}
                      </div>
                      <span className="font-medium text-black">@{sessionData.host.username}</span>
                    </div>
                    <p className="text-gray-800">{q.answer}</p>
                  </div>
                ) : sessionData.isHost ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleAnswerSubmit(q.id)}
                      disabled={!answers[q.id]?.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 italic">Waiting for answer...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ask Question Form (for non-hosts) */}
        {!sessionData.isHost && !sessionEnded && (
          <Card className="border border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleQuestionSubmit}>
                <div className="mb-4">
                  <Textarea
                    placeholder="Ask your question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:border-purple-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!newQuestion.trim() || isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Question
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {sessionEnded && (
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Ended</h3>
              <p className="text-gray-600">This AMA session has been ended by the host. Thank you for participating!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tipping Modal */}
      <TippingModal
        isOpen={showTippingModal}
        onClose={() => setShowTippingModal(false)}
        creatorName={sessionData.host.displayName}
      />
    </div>
  )
}
