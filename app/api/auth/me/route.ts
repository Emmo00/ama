import { NextRequest } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { User } from '@/lib/models'
import { withQuickAuth } from '@/lib/quickAuth'

interface QuickAuthUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

// GET /api/auth/me - Get current user info
export const GET = withQuickAuth(async (quickAuthUser: QuickAuthUser, request: NextRequest) => {
  try {
    await connectToDatabase()

    // Find or create user in our database
    let user = await User.findOne({ fid: quickAuthUser.fid.toString() })
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        fid: quickAuthUser.fid.toString(),
        username: quickAuthUser.username || `user-${quickAuthUser.fid}`,
        pfpUrl: quickAuthUser.pfpUrl,
      })
      await user.save()
    } else {
      // Update existing user with latest info from Farcaster
      let updated = false
      if (quickAuthUser.username && user.username !== quickAuthUser.username) {
        user.username = quickAuthUser.username
        updated = true
      }
      if (quickAuthUser.pfpUrl && user.pfpUrl !== quickAuthUser.pfpUrl) {
        user.pfpUrl = quickAuthUser.pfpUrl
        updated = true
      }
      if (updated) {
        await user.save()
      }
    }

    return new Response(
      JSON.stringify({
        fid: user.fid,
        username: user.username,
        pfpUrl: user.pfpUrl,
        createdAt: user.createdAt,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to authenticate user'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
