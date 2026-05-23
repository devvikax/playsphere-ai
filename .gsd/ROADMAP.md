# ROADMAP.md — PlaySphere AI

> **Current Phase**: Phase 1
> **Milestone**: v2.0 — Demo-Ready Release

---

## Must-Haves (from SPEC)

- [ ] Gemini completely removed, Ollama fully integrated
- [ ] Chat scroll bug fixed
- [ ] Auth session persistence working
- [ ] Dashboard bookings showing real Firestore data
- [ ] Booking flow end-to-end working
- [ ] Admin system deleted, AI Venue Discovery added
- [ ] Build passes with zero errors

---

## Phases

### Phase 1: Ollama AI Migration
**Status**: ⬜ Not Started
**Objective**: Completely remove Gemini SDK and replace with modular Ollama integration. All AI features (Concierge, Sports Buddy, Alt Venue) must work via Ollama. Server-side only. Environment-variable driven.

**Tasks**:
- Remove `@google/generative-ai` from `package.json` and all imports
- Remove `GEMINI_API_KEY` from `.env.local`
- Add `OLLAMA_BASE_URL` and `OLLAMA_MODEL` to `.env.local`
- Create `lib/ai/ollama.ts` — core Ollama fetch wrapper with timeout, retry, streaming support
- Rewrite `app/api/ai/concierge/route.ts` to use Ollama with RAG-style Firestore venue context
- Rewrite `app/api/ai/buddy/route.ts` to use Ollama
- Add graceful error handling (AI unavailable message when Ollama is down)
- Update all UI text from "Gemini" to "Ollama" / "AI Powered"
- Delete test scripts: `test_saia.js`, `test_local.js`, `test_geai_headers.js`, `read_logs.js`

---

### Phase 2: Critical Bug Fixes
**Status**: ⬜ Not Started
**Objective**: Fix the chat scroll hijack bug and the auth session loss bug.

**Tasks**:
- Fix `AIConciergePreview.tsx` scroll: use `scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight` instead of `scrollIntoView`
- Fix `AuthProvider.tsx`: remove `Secure` flag from cookie on HTTP (localhost), add token refresh listener
- Fix login/signup pages: add `<Suspense>` wrapper for `useSearchParams`, add redirect if already logged in
- Fix middleware: ensure cookie is read correctly and auth state is preserved

---

### Phase 3: Dashboard & Booking Repair
**Status**: ⬜ Not Started
**Objective**: Make the dashboard show real data using real-time Firestore listeners. Fix booking creation, cancellation, and sync.

**Tasks**:
- Replace `getUserBookings` one-time fetch with real-time `onSnapshot` listener in dashboard
- Fix booking creation in `app/venues/[id]/page.tsx` — verify Firestore write and redirect to dashboard
- Fix booking cancellation state sync
- Add optimistic UI updates for booking actions
- Remove "Toggle Role (Demo)" button from profile (admin system being removed)
- Add real-time booking count to stats cards

---

### Phase 4: Admin Removal + AI Venue Discovery
**Status**: ⬜ Not Started
**Objective**: Delete admin system. Add AI-powered venue discovery insight cards using map context and Firestore distribution analysis.

**Tasks**:
- Delete `app/admin/` directory entirely
- Remove all admin-related imports, links from Navbar, and Firestore admin functions
- Remove `updateUserRole` from `firestore.ts`
- Remove admin middleware check
- Create `app/api/ai/discover/route.ts` — Ollama-powered endpoint that analyzes venue distribution and returns discovery insights
- Create `components/ai/VenueDiscoveryInsights.tsx` — card-based insight UI showing underrepresented areas
- Add discovery insights to the landing page and venues page

---

### Phase 5: QA Polish & Build Verification
**Status**: ⬜ Not Started
**Objective**: Full project-wide QA. Fix everything that's broken. Verify `npm run build` passes.

**Tasks**:
- Audit all pages for broken buttons, dead links, placeholder text
- Fix mobile responsiveness issues
- Ensure loading states everywhere (skeletons or spinners)
- Add typing animation to AI responses
- Verify Google Maps integration works
- Fix Footer "Powered by Google Gemini" text
- Fix landing page "Powered by Gemini 2.5" references
- Run `npm run build` and fix all TypeScript/ESLint errors
- Clean up test files from project root
