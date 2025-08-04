import { NextRequest } from 'next/server'
import connectToDatabase from '../../../lib/mongodb'
import { User } from '../../../lib/models'
import { withQuickAuth } from '../../../lib/quickAuth'

interface QuickAuthUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

// GET /api/users - List users with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const fid = searchParams.get('fid')
    const username = searchParams.get('username')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = {}
    
    if (fid) {
      query = { fid }
    } else if (username) {
      query = { username: { $regex: username, $options: 'i' } }
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('fid username pfpUrl createdAt')

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch users' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// POST /api/users - Create or update user (protected with Quick Auth)
export const POST = withQuickAuth(async (quickAuthUser: QuickAuthUser, request: NextRequest) => {
  try {
    await connectToDatabase()

    // Extract user data from Quick Auth user
    const userData = {
      fid: quickAuthUser.fid.toString(),
      username: quickAuthUser.username || `user-${quickAuthUser.fid}`,
      pfpUrl: quickAuthUser.pfpUrl,
    }

    // Find existing user or create new one
    let user = await User.findOne({ fid: userData.fid })

    if (user) {
      // Update existing user with latest info
      let updated = false
      if (userData.username && user.username !== userData.username) {
        user.username = userData.username
        updated = true
      }
      if (userData.pfpUrl && user.pfpUrl !== userData.pfpUrl) {
        user.pfpUrl = userData.pfpUrl
        updated = true
      }
      if (updated) {
        await user.save()
      }
    } else {
      // Create new user
      user = new User(userData)
      await user.save()
    }

    return new Response(
      JSON.stringify({
        fid: user.fid,
        username: user.username,
        pfpUrl: user.pfpUrl,
        createdAt: user.createdAt,
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create/update user' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
