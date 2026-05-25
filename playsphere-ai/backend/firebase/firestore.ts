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
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { Venue, Booking, UserProfile, VenueFilters, ApprovalStatus } from '@/shared/types';

// ── VENUES ──────────────────────────────────────────────────────────────────

export async function getAllVenues(): Promise<Venue[]> {
  const snap = await getDocs(collection(db, 'venues'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
}

/** Fetch only available venues from Firestore (public discovery & AI grounding).
 *  Firestore is the single source of truth — no static fallback. */
export async function getApprovedVenues(): Promise<Venue[]> {
  const q = query(
    collection(db, 'venues'),
    where('available', '==', true)
  );
  const snap = await getDocs(q);
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
    const searchQ = filters.searchQuery.toLowerCase();
    venues = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(searchQ) ||
        v.area.toLowerCase().includes(searchQ) ||
        v.description.toLowerCase().includes(searchQ)
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

/** Fetch all venues owned by a specific owner */
export async function getOwnerVenues(ownerId: string): Promise<Venue[]> {
  const q = query(collection(db, 'venues'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
}

/** Real-time listener for owner's venues */
export function subscribeOwnerVenues(ownerId: string, callback: (venues: Venue[]) => void): Unsubscribe {
  const q = query(collection(db, 'venues'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
  });
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

/** Fetch all bookings for a list of venue IDs (for owner dashboard) */
export async function getVenueBookingsForOwner(venueIds: string[]): Promise<Booking[]> {
  if (venueIds.length === 0) return [];
  // Firestore 'in' supports up to 30 items
  const chunks: string[][] = [];
  for (let i = 0; i < venueIds.length; i += 30) {
    chunks.push(venueIds.slice(i, i + 30));
  }
  const results: Booking[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'bookings'),
      where('venueId', 'in', chunk),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  }
  return results;
}

/** Real-time listener for bookings on a set of venue IDs */
export function subscribeVenueBookings(venueIds: string[], callback: (bookings: Booking[]) => void): Unsubscribe {
  if (venueIds.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'bookings'),
    where('venueId', 'in', venueIds.slice(0, 30)),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  });
}

/** Admin: fetch ALL bookings */
export async function getAllBookings(): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
}

// ── SAVED VENUES ─────────────────────────────────────────────────────────────

export async function toggleSavedVenue(userId: string, venueId: string, isSaved: boolean): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    savedVenues: isSaved ? arrayRemove(venueId) : arrayUnion(venueId),
  });
}

/** Fetch venue documents by array of IDs (for saved venues) */
export async function getVenuesByIds(ids: string[]): Promise<Venue[]> {
  if (ids.length === 0) return [];
  const results: Venue[] = [];
  await Promise.all(
    ids.map(async (id) => {
      const snap = await getDoc(doc(db, 'venues', id));
      if (snap.exists()) results.push({ id: snap.id, ...snap.data() } as Venue);
    })
  );
  return results;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getVenueBookings(venueId: string, date: string): Promise<Booking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('venueId', '==', venueId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Booking))
    .filter((b) => b.status !== 'cancelled');
}

export async function checkSlotAvailability(venueId: string, date: string, slot: string): Promise<boolean> {
  const bookings = await getVenueBookings(venueId, date);
  return !bookings.some(b => b.slot === slot);
}

// ── USERS (Admin) ─────────────────────────────────────────────────────────────

/**
 * Admin: fetch all user profiles.
 * CRITICAL FIX: Legacy player docs do NOT store `uid` inside the document body —
 * only in the document path. We always inject uid from d.id to ensure it's populated.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({
    uid: d.id,         // Always inject from document path — never rely on stored uid field
    ...d.data(),
  } as UserProfile));
}

/** Admin: update an owner's approval status */
export async function updateOwnerApproval(uid: string, status: ApprovalStatus): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { approvalStatus: status });
}

/** Get users with a specific role */
export async function getUsersByRole(role: 'player' | 'owner' | 'admin'): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  } as UserProfile));
}

// ── ADMIN REALTIME LISTENERS ──────────────────────────────────────────────────

/**
 * Admin: realtime listener for ALL users.
 * Injects uid from document path so legacy docs without stored uid field still work.
 */
export function subscribeAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    } as UserProfile)));
  }, (err) => {
    console.error('[Admin] Users listener error:', err);
    callback([]);
  });
}

/**
 * Admin: realtime listener for ALL venues.
 */
export function subscribeAllVenues(callback: (venues: Venue[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'venues'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
  }, (err) => {
    console.error('[Admin] Venues listener error:', err);
    callback([]);
  });
}

/**
 * Admin: realtime listener for ALL bookings (ordered by creation desc).
 */
export function subscribeAllBookings(callback: (bookings: Booking[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  }, (err) => {
    console.error('[Admin] Bookings listener error:', err);
    callback([]);
  });
}
