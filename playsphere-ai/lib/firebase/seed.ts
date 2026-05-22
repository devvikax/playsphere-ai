import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { LUCKNOW_VENUES } from '@/data/venues';

/**
 * Seeds the Firestore database with Lucknow venue data.
 * Run this once to populate your Firebase project.
 * Usage: import and call seedFirestore() from a server-side script or admin page.
 */
export async function seedFirestore(): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  console.log(`Seeding ${LUCKNOW_VENUES.length} venues to Firestore...`);

  for (const venue of LUCKNOW_VENUES) {
    try {
      await addDoc(collection(db, 'venues'), {
        ...venue,
        createdAt: serverTimestamp(),
      });
      success++;
      console.log(`✓ Seeded: ${venue.name}`);
    } catch (error) {
      console.error(`✗ Failed: ${venue.name}`, error);
      errors++;
    }
  }

  console.log(`\nSeeding complete: ${success} success, ${errors} errors`);
  return { success, errors };
}
