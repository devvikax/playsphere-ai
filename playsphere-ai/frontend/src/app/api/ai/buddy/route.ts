import { NextRequest, NextResponse } from 'next/server';
import { handleBuddyRequest } from '@/backend/ai/buddy';

export async function POST(req: NextRequest) {
  try {
    const { message, sport, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await handleBuddyRequest(message, sport, history);
    return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error('Sports Buddy API error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable.' },
      { status: 500 }
    );
  }
}
