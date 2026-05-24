# Phase 6: Maps + Discovery + Venue Marketplace Verification

> **Status**: ⬜ Not Started  
> **Objective**: Verify Google Maps loading, markers, InfoWindow custom dark styles, view selectors, and fallback logic.

---

## Context

We need to inspect and confirm:
1. Google Maps loads correctly on both desktop and mobile viewports.
2. Venue pins show up on the map.
3. Clicking a pin opens a custom dark styling InfoWindow popup with venue details (no white styling flashes).
4. Venue search filters (sport, area, price range, skill level) sync with map markers and list cards.
5. AI Discovery Insights API route parses Firestore statistics and outputs 3 dynamic insights with no markdown formatting.

---

## Files to Inspect & Verify

### [INSPECT] [components/venue/VenueMap.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/components/venue/VenueMap.tsx)
- Check marker render logic and InfoWindow layout.

### [INSPECT] [app/api/ai/discover/route.ts](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/app/api/ai/discover/route.ts)
- Confirm statistical metrics parsing and LLM system context.

---

## Verification Steps

- [ ] Verify maps load and render markers properly.
- [ ] Confirm custom dark InfoWindows display clean styles.
- [ ] Test discovery insight JSON completions.
