import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import { Tip, Session, User } from "../../../lib/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const senderFid = searchParams.get("senderFid");

    let query: any = {};

    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return NextResponse.json(
          { error: "Invalid session ID" },
          { status: 400 }
        );
      }
      query.sessionId = sessionId;
    }

    if (senderFid) {
      query.senderFid = senderFid;
    }

    const tips = await Tip.find(query).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { sessionId, senderFid, amount, txHash } = body;

    if (!sessionId || !senderFid || !amount || !txHash) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sessionId, senderFid, amount, txHash",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify user exists
    const user = await User.findOne({ fid: senderFid });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please create user first." },
        { status: 404 }
      );
    }

    // Check if tip with this txHash already exists
    const existingTip = await Tip.findOne({ txHash });
    if (existingTip) {
      return NextResponse.json(
        { error: "Tip with this transaction hash already exists" },
        { status: 409 }
      );
    }

    const tip = new Tip({
      sessionId,
      senderFid,
      amount,
      txHash,
    });

    await tip.save();

    return NextResponse.json({ tip }, { status: 201 });
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { error: "Failed to create tip" },
      { status: 500 }
    );
  }
}
