# Phase 3: Dashboard & Booking Repair

> **Status**: ✅ Completed
> **Objective**: Fix the dashboard to show real-time Firestore data. Repair the full booking flow: create → confirm → dashboard → cancel. Remove admin role toggle.

---

## Context

Current issues:
1. **Dashboard bookings empty** — `getUserBookings()` is a one-shot fetch. If Firestore requires a composite index for `userId + orderBy(createdAt)` and the index doesn't exist, the query fails silently.
2. **No real-time sync** — after booking or cancelling, dashboard must be manually refreshed
3. **Booking creation uncertain** — need to verify Firestore write succeeds in `venues/[id]/page.tsx`
4. **Admin role toggle** — must be removed (admin system being deleted in Phase 4)

---

## Fix 1: Real-time Bookings Dashboard

### Current (broken):
```typescript
getUserBookings(user.uid).then((b) => {
  setBookings(b);
  setBookingsLoading(false);
})
```

### Fixed: `app/dashboard/page.tsx`
```typescript
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

useEffect(() => {
  if (!user) return;
  
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snap) => {
    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
    setBookings(bookings);
    setBookingsLoading(false);
  }, (error) => {
    console.error('Bookings listener error:', error);
    setBookingsLoading(false);
  });
  
  return () => unsubscribe();
}, [user]);
```

> **Firestore Index**: The `orderBy('createdAt')` + `where('userId')` combination requires a composite index. Add to `firestore.indexes.json` and deploy, or create it via Firebase console.

---

## Fix 2: Booking Creation Verification

### Check `app/venues/[id]/page.tsx`
- Verify `createBooking()` call succeeds with proper error handling
- After successful booking: show success toast/confirmation modal
- Redirect to `/dashboard` after booking
- Handle duplicate bookings (same slot + same date + same user)

### `lib/firebase/firestore.ts` — add duplicate check
```typescript
export async function checkSlotAvailability(venueId: string, date: string, slot: string): Promise<boolean> {
  const q = query(
    collection(db, 'bookings'),
    where('venueId', '==', venueId),
    where('date', '==', date),
    where('slot', '==', slot),
    where('status', '!=', 'cancelled')
  );
  const snap = await getDocs(q);
  return snap.empty; // true = available
}
```

---

## Fix 3: Real-time Cancellation

### Current (optimistic-only):
```typescript
setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
```

With the `onSnapshot` listener, cancellation will automatically reflect in the UI. The optimistic update becomes a fallback.

---

## Fix 4: Remove Admin Role Toggle

In `app/dashboard/page.tsx`, remove the Profile tab section:
```tsx
// REMOVE THIS ENTIRE BLOCK:
<button onClick={async () => {
  const nextRole = (profile?.role === 'admin' ? 'user' : 'admin');
  await updateUserRole(user.uid, nextRole);
}}>
  Toggle Role (Demo)
</button>
```

Also remove `updateUserRole` import from `@/lib/firebase/firestore`.

---

## Files to Change

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Replace fetch with onSnapshot listener, remove role toggle |
| `app/venues/[id]/page.tsx` | Verify booking creation, add success state, add duplicate check |
| `lib/firebase/firestore.ts` | Add `checkSlotAvailability()`, remove `updateUserRole()` |
| `firestore.indexes.json` | Add composite index for bookings query |

---

## Firestore Composite Index Required

Add to Firebase console or `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Verification

- [ ] Dashboard shows bookings immediately after login
- [ ] Create a booking → it appears in dashboard within 2 seconds (no refresh needed)
- [ ] Cancel a booking → status updates instantly in dashboard
- [ ] Stats cards (Upcoming, Completed, Cancelled, Total Spent) update correctly
- [ ] No admin toggle button visible anywhere in dashboard
- [ ] Empty state (no bookings) shows correctly with CTA to browse venues
