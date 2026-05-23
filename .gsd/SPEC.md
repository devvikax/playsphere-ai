# SPEC.md — PlaySphere AI

> **Status**: `FINALIZED`
> **Type**: Brownfield — Repair, Migration, Enhancement
> **Team**: DeepStack | APL Qualifiers 2026

---

## Vision

PlaySphere AI is a premium, hackathon-ready, AI-powered sports infrastructure discovery and booking platform for Lucknow. It combines real-time venue discovery, natural language AI assistance via Ollama, interactive maps, smart booking, and an intelligent AI sports concierge — all in a polished Neo-brutalist sports-tech UI. The platform must be stable, demo-ready, and startup-quality by the end of this engagement.

---

## Goals

1. **Migrate AI from Gemini to Ollama** — Complete removal of `@google/generative-ai`, replace with modular Ollama integration using server-side API routes and environment-variable configuration.
2. **Fix all critical UX bugs** — Resolve chat scroll hijacking, auth session loss on refresh, broken dashboard bookings, and broken booking flows.
3. **Remove admin system, add AI Venue Discovery** — Replace manual `/admin` management with an AI-powered insight layer showing venue gaps, underrepresented areas, and discovery cards.
4. **Full-stack QA pass** — Repair every broken button, dead link, placeholder, and unstable workflow across the entire application.
5. **Demo-ready polish** — Ensure the app feels startup-quality: smooth animations, loading states, error handling, real-time data, and mobile responsiveness.

---

## Non-Goals (Out of Scope)

- Payment gateway integration (booking is simulated)
- Real venue owner portal
- Real-time multi-user slot conflict resolution
- iOS / Android native apps
- Deployment to Vercel (out of scope unless bonus time)

---

## Users

- **Sports players in Lucknow** browsing, filtering, and booking sports venues
- **Beginners** seeking guided AI recommendations (Sports Buddy)
- **Hackathon judges** evaluating demo flow, AI integration, technical completeness, and presentation quality

---

## Constraints

- **Ollama must run locally** at `http://localhost:11434` — no remote Ollama endpoints
- **No `@google/generative-ai` SDK** — must be completely removed
- **Firebase Firestore** must remain as the database — no migration
- **Next.js App Router** architecture must be preserved — no pages-dir migration
- **Neo-brutalist UI** must be preserved — no design-system overhaul
- **All AI logic must remain server-side** — no client-side model calls

---

## Success Criteria

- [ ] Ollama integration works: AI Concierge and Sports Buddy both respond via `llama3.1:8b` through `/api/ai/concierge` and `/api/ai/buddy`
- [ ] Chat scroll bug eliminated: only the chat container scrolls, not the page
- [ ] Auth persistence: users stay logged in after refresh, navigation, and tab reopen
- [ ] Dashboard bookings: real-time Firestore data loads and displays correctly
- [ ] Booking flow: create → confirm → appear in dashboard → cancel → update in real time
- [ ] Admin routes deleted; AI Venue Discovery insight cards replace them
- [ ] Zero broken pages, buttons, or dead-end flows in the demo path
- [ ] `npm run build` passes with zero errors
