"use client"

import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { ArrowLeft, Calendar, MessageCircle, Clock, User, Loader2, RefreshCw, DollarSign } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useProfile } from "../../../hooks/useProfile"

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { profile, isLoading, error, refreshProfile } = useProfile(username)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-6">{error || 'This user does not exist or has not created any sessions yet.'}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProfile}
              className="flex items-center gap-2 text-black"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Section - User Info */}
        <div className="text-center mb-8">
          {profile.user.pfpUrl ? (
            <img 
              src={profile.user.pfpUrl} 
              alt={profile.user.username}
              className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-4">
              {profile.user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-black mb-1">@{profile.user.username}</h1>
          <p className="text-gray-600 mb-2">FID {profile.user.fid}</p>
          <p className="text-gray-500 text-sm">
            Member since {formatDate(profile.user.createdAt)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{profile.stats.totalSessions}</div>
            <div className="text-xs text-gray-600">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{profile.stats.totalQuestions}</div>
            <div className="text-xs text-gray-600">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-black">${profile.stats.totalTips}</div>
            <div className="text-xs text-gray-600">Tips Received</div>
          </div>
        </div>

        {/* Current Session */}
        {profile.currentSession && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center">🎙️ Live Now</h2>
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </span>
                  <h3 className="font-semibold text-black text-lg mb-2">{profile.currentSession.title}</h3>
                  {profile.currentSession.description && (
                    <p className="text-gray-600 text-sm mb-3">{profile.currentSession.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Started {formatTimeAgo(profile.currentSession.createdAt)}
                    </div>
                    {profile.currentSession.stats && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {profile.currentSession.stats.totalQuestions}
                        </div>
                        {profile.currentSession.stats.totalTips > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {profile.currentSession.stats.totalTips}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Link href={`/session/${profile.currentSession._id}`}>
                    <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                      Join Live Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Past Sessions */}
        {profile.pastSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center">
              � Past Sessions ({profile.pastSessions.length})
            </h2>
            <div className="space-y-3">
              {profile.pastSessions.map((session) => (
                <Card key={session._id} className="border border-gray-100">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-black mb-2">{session.title}</h3>
                    {session.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(session.createdAt)}
                      </div>
                      {session.stats && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {session.stats.totalQuestions}
                          </div>
                          {session.stats.totalTips > 0 && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {session.stats.totalTips}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Link href={`/session/${session._id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Session
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for no sessions */}
        {profile.stats.totalSessions === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-6">
              @{profile.user.username} hasn't hosted any AMA sessions yet.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                Discover Live Sessions
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
