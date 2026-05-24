# Phase 3: Owner System & Venue Management Verification

> **Status**: ⬜ Not Started  
> **Objective**: Verify Owner dashboard pending approval guard state blocker screen, approved state workspace tabs, and full venue CRUD operations.

---

## Context

We need to inspect and confirm:
1. When an owner is registered, if `approvalStatus` is not `'approved'`, they are blocked by the "Pending Approval" blocker UI screen on `/owner`.
2. Once approved, the owner gains access to:
   - Overview stats
   - My Venues CRUD list
   - Add Venue form
   - Bookings tab (real-time owner bookings log)
   - Analytics (revenue distribution)
3. Adding a venue correctly stores the current owner's UID in the `ownerId` field, sets `source: 'owner'`, and defines pricing ranges.

---

## Files to Inspect & Verify

### [INSPECT] [app/owner/page.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/app/owner/page.tsx)
- Confirm pending blocker UI.
- Verify tabs render lists correctly.

### [INSPECT] [components/owner/VenueForm.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/components/owner/VenueForm.tsx)
- Check validations for forms, coordinates, timings, and amenities.

---

## Verification Steps

- [ ] Verify pending owner blocker view locks out tabs.
- [ ] Confirm venue addition commits to Firestore with owner UID references.
- [ ] Test toggling availability and deleting entries from list.
