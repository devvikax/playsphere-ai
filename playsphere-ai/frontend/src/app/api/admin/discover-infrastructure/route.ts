import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  // Forward the Authorization header from the client (Firebase ID token)
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Missing or invalid credentials.' },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/admin/discover-infrastructure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader, // Forward the Firebase ID token
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: data?.detail || 'Please wait before running another scan.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: data?.detail || 'Discovery scan failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[/api/admin/discover-infrastructure] Proxy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Discovery scan failed.' },
      { status: 500 }
    );
  }
}
