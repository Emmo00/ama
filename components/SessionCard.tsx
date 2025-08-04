import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { MessageCircle, User, Clock, DollarSign } from "lucide-react";
import { Session, SessionStats } from "../hooks/useSessions";
import Link from "next/link";

interface SessionCardProps {
  session: Session;
  stats?: SessionStats;
  isOwner?: boolean;
  onEndSession?: (sessionId: string) => void;
}

export function SessionCard({ session, stats, isOwner, onEndSession }: SessionCardProps) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                {session.creator ? (
                  <>
                    {session.creator.pfpUrl ? (
                      <img 
                        src={session.creator.pfpUrl} 
                        alt={session.creator.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {session.creator.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-gray-600">@{session.creator.username}</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">FID {session.creatorFid}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${session.status === 'LIVE' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className={`text-xs font-medium ${session.status === 'LIVE' ? 'text-green-600' : 'text-gray-500'}`}>
                  {session.status}
                </span>
              </div>
            </div>
            <CardTitle className="text-lg font-semibold leading-tight mb-2">
              {session.title}
            </CardTitle>
            <p className="text-gray-600 text-sm line-clamp-2">
              {session.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stats && (
              <>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{stats.totalQuestions}</span>
                </div>
                {stats.totalTips > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{stats.totalTips}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{formatTimeAgo(session.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isOwner && session.status === 'LIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEndSession?.(session._id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                End Session
              </Button>
            )}
            <Link href={`/session/${session._id}`}>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {session.status === 'LIVE' ? 'Join' : 'View'}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
