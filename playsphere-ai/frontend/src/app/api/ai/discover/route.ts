import { NextResponse } from 'next/server';
import { handleDiscoverRequest, getStaticFallbackInsights } from '@/backend/ai/discover';

export async function POST() {
  try {
    const insights = await handleDiscoverRequest();
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Discovery API Error:', error);
    return NextResponse.json(
      { insights: getStaticFallbackInsights() },
      { status: 500 }
    );
  }
}
