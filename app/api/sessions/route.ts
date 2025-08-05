import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Session, User, Question, Tip } from "@/lib/models";
import { withQuickAuth } from "@/lib/quickAuth";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const creatorFid = searchParams.get("creatorFid");

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (creatorFid) {
      query.creatorFid = creatorFid;
    }

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Populate user data and basic stats for each session
    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const user = await User.findOne({ fid: session.creatorFid });

        // Get basic stats without detailed questions/tips data
        const [questionCount, totalTipAmount] = await Promise.all([
          Question.countDocuments({ sessionId: session._id }),
          Tip.aggregate([
            { $match: { sessionId: session._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);

        return {
          ...session.toObject(),
          creator: user
            ? {
                fid: user.fid,
                username: user.username,
                pfpUrl: user.pfpUrl,
              }
            : null,
          stats: {
            totalQuestions: questionCount,
            totalTips: totalTipAmount[0]?.total || 0,
            totalParticipants: 0, // We'll calculate this in the detail view for performance
          },
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithUsers });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export const POST = withQuickAuth(async (user: any, request: NextRequest) => {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Missing required fields: title, description" },
        { status: 400 }
      );
    }

    // Check if user already has a live session
    const existingLiveSession = await Session.findOne({
      creatorFid: user.fid,
      status: "LIVE",
    });

    if (existingLiveSession) {
      return NextResponse.json(
        {
          error:
            "You already have a live session. End your current session before creating a new one.",
        },
        { status: 409 }
      );
    }

    const session = new Session({
      creatorFid: user.fid,
      title,
      description,
      status: "LIVE",
    });

    await session.save();

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
});
