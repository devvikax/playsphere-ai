import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * Perform a fetch to the Python backend with automatic retry on connection failures.
 */
export async function fetchWithRetry(
  path: string,
  options: RequestInit = {},
  retries = 3,
  delay = 500
): Promise<Response> {
  const url = `${PYTHON_BACKEND_URL}${path}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err: any) {
      const isConnectionRefused =
        err.code === 'ECONNREFUSED' ||
        err.message?.toLowerCase().includes('fetch failed') ||
        err.message?.toLowerCase().includes('refused');
      
      if (isConnectionRefused && attempt < retries) {
        console.warn(`[Proxy] Attempt ${attempt} failed for ${path}, retrying in ${delay * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Connection failed after max retries');
}

/**
 * Handle errors thrown by the proxy, returning appropriate HTTP status codes and user-friendly messages.
 */
export function handleProxyError(error: any, contextName: string) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[${contextName}] Proxy error:`, msg);

  const isConnectionRefused =
    msg.toLowerCase().includes('refused') ||
    msg.toLowerCase().includes('fetch failed') ||
    msg.toLowerCase().includes('failed after max retries');

  const isTimeout =
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('timed out') ||
    msg.toLowerCase().includes('abort');

  if (isConnectionRefused) {
    return NextResponse.json(
      {
        error: 'The AI backend service is starting up or temporarily offline. Please wait a few seconds and try again.',
      },
      { status: 503 } // Service Unavailable
    );
  }

  if (isTimeout) {
    return NextResponse.json(
      { error: 'The request timed out. Please try again.' },
      { status: 504 } // Gateway Timeout
    );
  }

  return NextResponse.json(
    { error: `AI service error: ${msg}` },
    { status: 500 }
  );
}
