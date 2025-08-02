"use client"

import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { ArrowLeft, Calendar, MessageCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock user data with current session
const userData = {
  username: "vitalik.eth",
  displayName: "Vitalik Buterin",
  avatar: "V",
  bio: "Co-founder of Ethereum. Interested in cryptography, mechanism design, and making the world more open decentralized.",
  currentSession: {
    id: "live-1",
    title: "Building the Future of Web3",
    startTime: "5 mins ago",
    questions: 24,
    isLive: true,
  },
  stats: {
    totalSessions: 12,
    totalQuestions: 456,
    totalTips: 1250.5,
  },
  pastSessions: [
    {
      id: "2",
      title: "Ethereum Roadmap 2024",
      date: "Dec 15, 2024",
      questions: 67,
    },
    {
      id: "3",
      title: "Scaling Solutions Deep Dive",
      date: "Dec 10, 2024",
      questions: 43,
    },
    {
      id: "4",
      title: "The Philosophy of Decentralization",
      date: "Dec 5, 2024",
      questions: 89,
    },
    {
      id: "5",
      title: "Proof of Stake Explained",
      date: "Nov 28, 2024",
      questions: 156,
    },
    {
      id: "6",
      title: "DeFi Security Best Practices",
      date: "Nov 20, 2024",
      questions: 92,
    },
  ],
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Link>
        </div>

        {/* Top Section - User Info */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-4">
            {userData.avatar}
          </div>
          <h1 className="text-2xl font-bold text-black mb-1">{userData.displayName}</h1>
          <p className="text-gray-600 mb-4">@{userData.username}</p>
          {userData.bio && <p className="text-gray-700 text-sm leading-relaxed px-2">{userData.bio}</p>}
        </div>

        {/* Current Session */}
        {userData.currentSession && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center">🎙️ Live Now</h2>
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </span>
                  <h3 className="font-semibold text-black text-lg mb-2">{userData.currentSession.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Started {userData.currentSession.startTime}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {userData.currentSession.questions} questions
                    </div>
                  </div>
                </div>
                <Link href={`/session/${userData.currentSession.id}`}>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                    View AMA
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center">📊 Your Stats</h2>
          <div className="space-y-3">
            <Card className="border border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  {userData.stats.totalSessions}
                </div>
                <p className="text-gray-600 text-sm">Total Sessions Hosted</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {userData.stats.totalQuestions}
                </div>
                <p className="text-gray-600 text-sm">Total Questions Received</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-1">
                  ${userData.stats.totalTips.toLocaleString()}
                </div>
                <p className="text-gray-600 text-sm">Total Tips Earned (USDC)</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Past Sessions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center">📚 Past Sessions</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userData.pastSessions.map((session) => (
              <Card key={session.id} className="border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-black mb-2 text-sm leading-tight">{session.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {session.date}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {session.questions} questions
                    </div>
                  </div>
                  <Link href={`/session/${session.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-gray-700 border-gray-200 hover:bg-gray-50 py-2 text-sm bg-transparent"
                    >
                      View Summary
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
