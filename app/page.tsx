"use client";

import { Button } from "~/components/ui/button";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import sdk from "@farcaster/miniapp-sdk";

// Mock data for live AMA sessions
const liveSessions = [
  {
    id: "1",
    title: "Building the Future of Web3",
    host: "vitalik.eth",
    questions: 24,
    isLive: true,
  },
  {
    id: "2",
    title: "Startup Founder Journey",
    host: "pmarca",
    questions: 18,
    isLive: true,
  },
  {
    id: "3",
    title: "AI and the Creative Process",
    host: "sama",
    questions: 31,
    isLive: true,
  },
  {
    id: "4",
    title: "Decentralized Social Networks",
    host: "dwr.eth",
    questions: 12,
    isLive: true,
  },
  {
    id: "5",
    title: "The Art of Product Design",
    host: "figma",
    questions: 8,
    isLive: true,
  },
  {
    id: "6",
    title: "Crypto Trading Strategies",
    host: "cobie",
    questions: 45,
    isLive: true,
  },
];

// Mock user data for the profile icon
const mockCurrentUser = {
  username: "vitalik.eth",
  avatar: "V",
};

export default function HomePage() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  function handleStartAMA() {}

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">AMA</h1>
            <p className="text-gray-600">
              Ask Me Anything sessions on Farcaster
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/create">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Start an AMA
            </Button>
          </Link>
          <Link href={`/profile/${mockCurrentUser.username}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-medium cursor-pointer shadow-md hover:shadow-lg transition-all duration-200">
              {mockCurrentUser.avatar}
            </div>
          </Link>
        </div>

        {/* Live Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveSessions.map((session) => (
            <Link key={session.id} href={`/session/${session.id}`}>
              <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-neutral-200 border-gray-100 dark:border-neutral-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {session.questions}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-black group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-200">
                    {session.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {session.host.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {session.host}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State (if no sessions) */}
        {liveSessions.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No live sessions
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to start an AMA session!
            </p>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Plus className="w-5 h-5 mr-2" />
                Start an AMA
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
