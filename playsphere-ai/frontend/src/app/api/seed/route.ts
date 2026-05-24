import { NextResponse } from 'next/server';
import { seedFirestore } from '@/backend/firebase/seed';

// Simple API route to trigger seeding since running ts-node locally can be a pain
// Protect this in production! For hackathon MVP, we leave it accessible for easy setup.
export async function GET() {
  try {
    const result = await seedFirestore();
    return NextResponse.json({
      message: 'Seed completed successfully',
      result,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
