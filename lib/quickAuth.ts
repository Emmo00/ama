import { Errors, createClient } from '@farcaster/quick-auth'
import { NextRequest } from 'next/server'

const client = createClient()

interface QuickAuthUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

/**
 * Verify and decode a Quick Auth JWT token
 */
export async function verifyQuickAuthToken(token: string): Promise<{ sub: number; aud: string }> {
  try {
    const payload = await client.verifyJwt({
      token,
      domain: process.env.NEXTAUTH_URL?.replace('https://', '').replace('http://', '') || 'localhost:3000',
    })

    return payload
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error('Invalid token')
    }
    throw e
  }
}

/**
 * Extract and verify Quick Auth token from request headers
 */
export async function getQuickAuthUser(request: NextRequest): Promise<QuickAuthUser> {
  const authorization = request.headers.get('Authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authorization.split(' ')[1]
  if (!token) {
    throw new Error('No token provided')
  }

  const payload = await verifyQuickAuthToken(token)
  
  // Get additional user info from Neynar if API key is available
  let userInfo: Partial<QuickAuthUser> = {}
  
  if (process.env.NEYNAR_API_KEY) {
    try {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${payload.sub}`, {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const user = data.users?.[0]
        if (user) {
          userInfo = {
            username: user.username,
            displayName: user.display_name,
            pfpUrl: user.pfp_url,
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user info from Neynar:', error)
    }
  }

  return {
    fid: payload.sub,
    ...userInfo,
  }
}

/**
 * Create a Quick Auth protected API route handler
 */
export function withQuickAuth<T extends any[]>(
  handler: (user: QuickAuthUser, request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await getQuickAuthUser(request)
      return await handler(user, request, ...args)
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: error instanceof Error ? error.message : 'Authentication failed' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  }
}
