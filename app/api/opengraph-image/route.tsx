import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getNeynarUser } from "@/lib/neynar";
import connectToDatabase from '@/lib/mongodb';
import { Session } from '@/lib/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionid');
  const fid = searchParams.get('fid');

  let session = null;
  let creator = null;

  // If sessionId is provided, fetch session data
  if (sessionId) {
    try {
      await connectToDatabase();
      
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        session = await Session.findById(sessionId);
        if (session?.creatorFid) {
          creator = await getNeynarUser(Number(session.creatorFid));
        }
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  }

  // If fid is provided (for user profile), fetch user data
  const user = fid ? await getNeynarUser(Number(fid)) : null;

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        position: 'relative'
      }}>
        {session ? (
          // Session Card Layout
          <div style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            background: 'linear-gradient(135deg, #9333ea 0%, #2563eb 50%, #06b6d4 100%)',
            position: 'relative'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)',
              backgroundSize: '50px 50px'
            }} />
            
            {/* Content Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              padding: '64px',
              position: 'relative',
              zIndex: 10
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '48px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '12px',
                  paddingBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#4ade80',
                    borderRadius: '50%',
                    marginRight: '12px'
                  }} />
                  <span style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    {session.status === 'LIVE' ? 'LIVE AMA' : 'AMA SESSION'}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center'
              }}>
                {/* Creator Profile */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginRight: '64px'
                }}>
                  {creator?.pfp_url ? (
                    <div style={{
                      display: 'flex',
                      width: '192px',
                      height: '192px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '6px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      marginBottom: '24px'
                    }}>
                      <img 
                        src={creator.pfp_url} 
                        alt="Creator" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} 
                      />
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      width: '192px',
                      height: '192px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '6px solid rgba(255, 255, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px'
                    }}>
                      <span style={{
                        fontSize: '72px',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {(creator?.display_name || creator?.username || 'U')?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '20px',
                      marginBottom: '8px'
                    }}>
                      Hosted by
                    </span>
                    <span style={{
                      color: 'white',
                      fontSize: '36px',
                      fontWeight: '600'
                    }}>
                      @{creator?.username || `User ${session.creatorFid}`}
                    </span>
                  </div>
                </div>

                {/* Session Info */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}>
                  <h1 style={{
                    color: 'white',
                    fontSize: '72px',
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                    marginBottom: '32px',
                    maxWidth: '800px'
                  }}>
                    {session.title}
                  </h1>
                  
                  {session.description && (
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '36px',
                      lineHeight: 1.5,
                      maxWidth: '800px',
                      marginBottom: '32px'
                    }}>
                      {session.description.length > 150 
                        ? `${session.description.substring(0, 150)}...` 
                        : session.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '24px',
                      paddingLeft: '32px',
                      paddingRight: '32px',
                      paddingTop: '16px',
                      paddingBottom: '16px'
                    }}>
                      <span style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '24px'
                      }}>
                        Ask questions • Share insights • Tip creators
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fallback User Profile Layout
          <div style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, #9333ea 0%, #2563eb 50%, #06b6d4 100%)'
          }}>
            {user?.pfp_url && (
              <div style={{
                display: 'flex',
                width: '384px',
                height: '384px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '32px',
                border: '8px solid white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}>
                <img 
                  src={user.pfp_url} 
                  alt="Profile" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
              </div>
            )}
            <h1 style={{
              fontSize: '96px',
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {user?.display_name ? `Hello from ${user.display_name ?? user.username}!` : 'Welcome to AMA!'}
            </h1>
            <p style={{
              fontSize: '60px',
              marginTop: '16px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Ask • Answer • Tip
            </p>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}