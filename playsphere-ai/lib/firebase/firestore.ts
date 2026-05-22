import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import { Venue, Booking, UserProfile, VenueFilters } from '@/types';

// ── VENUES ──────────────────────────────────────────────────────────────────

export async function getAllVenues(): Promise<Venue[]> {
  const snap = await getDocs(collection(db, 'venues'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const snap = await getDoc(doc(db, 'venues', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Venue) : null;
}

export async function getFilteredVenues(filters: VenueFilters): Promise<Venue[]> {
  let q = query(collection(db, 'venues'));

  if (filters.sport) {
    q = query(q, where('sport', '==', filters.sport));
  }
  if (filters.area) {
    q = query(q, where('area', '==', filters.area));
  }
  if (filters.skillLevel) {
    q = query(q, where('skillLevel', 'in', [filters.skillLevel, 'all']));
  }

  const snap = await getDocs(q);
  let venues = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));

  // Client-side filters for fields not supported by Firestore compound queries
  if (filters.maxPrice) {
    venues = venues.filter((v) => v.price <= filters.maxPrice!);
  }
  if (filters.minPrice) {
    venues = venues.filter((v) => v.price >= filters.minPrice!);
  }
  if (filters.minRating) {
    venues = venues.filter((v) => v.rating >= filters.minRating!);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    venues = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
    );
  }

  return venues;
}

export async function addVenue(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'venues'), {
    ...venue,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateVenue(id: string, data: Partial<Venue>): Promise<void> {
  await updateDoc(doc(db, 'venues', id), data);
}

export async function deleteVenue(id: string): Promise<void> {
  await deleteDoc(doc(db, 'venues', id));
}

// ── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...booking,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
}

// ── SAVED VENUES ─────────────────────────────────────────────────────────────

export async function toggleSavedVenue(userId: string, venueId: string, isSaved: boolean): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    savedVenues: isSaved ? arrayRemove(venueId) : arrayUnion(venueId),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
