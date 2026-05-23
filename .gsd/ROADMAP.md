# ROADMAP.md — PlaySphere AI

> **Current Phase**: Phase 1
> **Milestone**: v2.0 — Demo-Ready Release
> **AI Strategy**: Hosted LLM (Groq API / OpenRouter) — no local Ollama required

---

## Must-Haves (from SPEC)

- [ ] Gemini completely removed, hosted LLM fully integrated
- [ ] No local dependencies — fully cloud-API driven
- [ ] Chat scroll bug fixed
- [ ] Auth session persistence working
- [ ] Dashboard bookings showing real Firestore data
- [ ] Booking flow end-to-end working
- [ ] Admin system deleted, AI Venue Discovery added
- [ ] Build passes with zero errors

---

## Phases

### Phase 1: Hosted LLM AI Migration
**Status**: ⬜ Not Started
**Phase File**: `.gsd/phases/phase-1.md`
**Objective**: Replace Gemini with a hosted open-source LLM (Groq API with Llama 3.1 8B). Remove all Gemini dependencies. Implement modular, environment-variable-driven AI service layer. Preserve all AI features with retrieval-grounded Firestore context.

---

### Phase 2: Critical Bug Fixes
**Status**: ⬜ Not Started
**Phase File**: `.gsd/phases/phase-2.md`
**Objective**: Eliminate the chat scroll hijack bug and the auth session loss on refresh. These are the two highest-impact UX bugs.

---

### Phase 3: Dashboard & Booking Repair
**Status**: ⬜ Not Started
**Phase File**: `.gsd/phases/phase-3.md`
**Objective**: Replace one-shot Firestore fetch with real-time listeners. Fix booking creation, cancellation, and dashboard sync. Remove admin role toggle.

---

### Phase 4: Admin Removal + AI Venue Discovery
**Status**: ⬜ Not Started
**Phase File**: `.gsd/phases/phase-4.md`
**Objective**: Delete the entire admin system. Add AI-powered venue discovery insight cards — showing underrepresented areas, venue gaps, and smart recommendations using Firestore distribution analysis.

---

### Phase 5: QA Polish & Build Verification
**Status**: ✅ Complete
**Phase File**: `.gsd/phases/phase-5.md`
**Objective**: Full QA pass across all pages, features, and mobile breakpoints. Fix all broken elements. Verify `npm run build` passes with zero errors.
