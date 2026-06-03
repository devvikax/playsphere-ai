import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST() {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/ai/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Discovery proxy failed:', response.status);
      return NextResponse.json({ insights: [] }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/ai/discover] Proxy error:', error);
    return NextResponse.json({ insights: [] }, { status: 500 });
  }
}
