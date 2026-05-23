# STATE.md — PlaySphere AI

> **Last Updated**: 2026-05-23
> **Current Phase**: 1
> **Overall Status**: 🔴 In Progress

---

## Active Context

- Working in: `c:/Users/vikas/OneDrive/Desktop/Project_05_APL/playsphere-ai/`
- Dev server: Running on `http://localhost:3000`
- Stack: Next.js 16.2.6, React 19, Tailwind CSS v4, Firebase v12, Lucide-React

## Completed

- ✅ GSD framework installed
- ✅ `.gsd/` initialized with SPEC, ROADMAP, STATE, DECISIONS, JOURNAL
- ✅ Codebase fully audited — architecture mapped

## Key Findings from Audit

### Auth Bug (Root Cause)
- `AuthProvider.tsx` line 42 sets cookie with `; Secure` flag
- On `http://localhost` (HTTP), browsers reject Secure cookies → cookie is never set
- Middleware checks for `auth-token` cookie → missing → always redirects to login
- Fix: Conditionally set Secure only when `window.location.protocol === 'https:'`

### Chat Scroll Bug (Root Cause)
- `AIConciergePreview.tsx` line 22: `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })`
- `scrollIntoView()` scrolls the **entire page** to bring the div into view
- Fix: Get ref to the messages container div, use `container.scrollTop = container.scrollHeight`

### Dashboard Bookings Bug (Root Cause)
- Dashboard uses a one-shot `getUserBookings().then()` fetch (not a real-time listener)
- If Firestore index is missing for `userId + orderBy(createdAt)`, the query silently fails
- Fix: Replace with `onSnapshot` listener + add Firestore composite index

### Admin System
- `app/admin/page.tsx` exists — must be deleted
- Admin links in Navbar must be removed
- `updateUserRole` in firestore.ts must be removed

### Gemini Removal Required
- `@google/generative-ai` in `package.json` 
- Used in: `app/api/ai/concierge/route.ts`, `app/api/ai/buddy/route.ts`
- References in: `AIConciergePreview.tsx` (text), `Footer.tsx`, `page.tsx` (landing)

## Blockers

- **Groq API key required** before Phase 1 can execute — free at https://console.groq.com
- ~~Local Ollama~~ — **NOT required** (strategy changed to hosted Groq API)

## Environment Variables Needed

```env
# Add to playsphere-ai/.env.local
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=<GROQ_API_KEY_FROM_USER>
LLM_MODEL=llama-3.1-8b-instant

# Remove:
# GEMINI_API_KEY=...
```
