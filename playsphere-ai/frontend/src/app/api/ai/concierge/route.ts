import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry, handleProxyError } from '../../proxyHelper';

export const maxDuration = 60; // Allow up to 60s for LLM calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Proxy to Python FastAPI backend using retry helper
    const response = await fetchWithRetry('/api/ai/concierge', {
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
    return handleProxyError(error, '/api/ai/concierge');
  }
}
