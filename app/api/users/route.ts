import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '~/lib/mongodb';
import { User } from '~/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const username = searchParams.get('username');
    
    if (fid) {
      const user = await User.findOne({ fid });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ user });
    }
    
    if (username) {
      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ user });
    }
    
    // If no specific user requested, return recent users
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { fid, username, pfpUrl } = body;
    
    if (!fid || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, username' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ fid });
    if (existingUser) {
      // Update profile picture if provided and different
      if (pfpUrl && existingUser.pfpUrl !== pfpUrl) {
        existingUser.pfpUrl = pfpUrl;
        await existingUser.save();
      }
      return NextResponse.json({ user: existingUser });
    }
    
    const user = new User({
      fid,
      username,
      pfpUrl,
    });
    
    await user.save();
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
