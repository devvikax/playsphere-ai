import { NextResponse } from 'next/server';
import { fetchWithRetry, handleProxyError } from '../../proxyHelper';

export async function POST() {
  try {
    const response = await fetchWithRetry('/api/ai/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Discovery proxy failed:', response.status);
      return NextResponse.json({ insights: [] }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    handleProxyError(error, '/api/ai/discover');
    // Graceful fallback: return empty insights so UI widgets render empty states instead of crashing
    return NextResponse.json({ insights: [] });
  }
}
