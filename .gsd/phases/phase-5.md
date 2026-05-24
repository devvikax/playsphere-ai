# Phase 5: AI Grounding + Concierge + Buddy Verification

> **Status**: ⬜ Not Started  
> **Objective**: Verify concierge and mentor AI route query structures using live Firestore database connections rather than static mock files.

---

## Context

We need to inspect and confirm:
1. Both AI Concierge (`/api/ai/concierge`) and Sports Buddy (`/api/ai/buddy`) retrieve venues dynamically from Firestore using `getApprovedVenues()`.
2. Static lists are only used as fallback layers.
3. System prompts constrain recommendations strictly to returned Firestore venues to prevent hallucinations.
4. Sports Buddy frontend component functions correctly, parses history threads, and formats responses nicely.

---

## Files to Inspect & Verify

### [INSPECT] [app/api/ai/concierge/route.ts](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/app/api/ai/concierge/route.ts)
- Confirm RAG prompt construction.

### [INSPECT] [components/ai/SportsBuddy.tsx](file:///c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/components/ai/SportsBuddy.tsx)
- Check quick prompts and message rendering.

---

## Verification Steps

- [ ] Verify RAG integration queries Firestore collections.
- [ ] Confirm no hallucinatory venue listings occur on test prompts.
- [ ] Test Sports Buddy frontend chat tabs and history chains.
