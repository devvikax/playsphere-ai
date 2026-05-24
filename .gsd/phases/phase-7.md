# Phase 7: Bug Fixes + QA + Stability Sweeps

> **Status**: ⬜ Not Started  
> **Objective**: Sweep out remaining bugs, resolve scroll-hijack issues, check 404 router assets, and audit Firestore rules/env properties.

---

## Context

We need to inspect and confirm:
1. Chat container element scrolling does not hijack body/page scrolling on mobile or desktop viewports.
2. Branded 404 page is functional.
3. Saved Venues tab operates correctly in Player Dashboard.
4. `.env.local` is gitignored and does not expose secrets to client code.
5. `firestore.rules` enforces role verification correctly (public read for venues, owner-restricted writes, player-restricted bookings).

---

## Files to Inspect & Verify

### [INSPECT] [app/globals.css](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/app/globals.css)
- Confirm scroll hide utility and body height rules.

### [INSPECT] [firestore.rules](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/firestore.rules)
- Verify rule definitions protect collection pathways.

---

## Verification Steps

- [ ] Confirm chat container scrolling does not alter body coordinates.
- [ ] Verify 404 page routing triggers.
- [ ] Audit security rule pathways.
