import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60s for LLM calls

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Proxy to Python FastAPI backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/ai/concierge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message,
        history: body.history ?? [],
        mode: body.mode ?? 'discovery',
      }),
      signal: AbortSignal.timeout(57000), // 57s — slightly under Vercel's 60s limit
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      const detail = errorData?.detail || errorData?.error || 'AI service error';
      const isRateLimit = response.status === 429;
      return NextResponse.json(
        { error: isRateLimit ? 'AI service is busy right now. Please try again in a few seconds.' : `AI service error: ${detail}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[/api/ai/concierge] Proxy error:', msg);

    const isTimeout = msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('abort');
    const isRateLimit = msg.toLowerCase().includes('429') || msg.toLowerCase().includes('rate limit');

    return NextResponse.json(
      {
        error: isTimeout
          ? 'AI response timed out. Please try again in a moment.'
          : isRateLimit
          ? 'AI service is busy right now. Please try again in a few seconds.'
          : `AI service error: ${msg}`,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
