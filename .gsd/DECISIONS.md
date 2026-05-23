# DECISIONS.md — PlaySphere AI

> Architecture Decision Records (ADRs)

---

## ADR-001: Replace Gemini with Groq API (hosted Llama 3.1)

**Date**: 2026-05-24
**Status**: Accepted (revised from local Ollama)

**Context**: The Gemini API key was working but the user wants open-source LLM models. Local Ollama was initially considered but rejected — it requires `ollama install`, `ollama serve`, and downloading ~2GB model weights. This makes the app un-deployable on Vercel and fragile during demo/judging.

**Decision**: Use **Groq API** with `llama-3.1-8b-instant` model. Groq offers:
- Free tier with generous rate limits
- Ultra-fast inference (< 1s typical latency)
- OpenAI-compatible `/chat/completions` endpoint
- Cloud-hosted — zero local setup required
- Vercel-compatible environment variable configuration

**Configuration**:
```env
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=<user-provided>
LLM_MODEL=llama-3.1-8b-instant
```

**Consequences**: Requires a Groq API key (free at console.groq.com). Rate limits apply on free tier but are generous for demo use.

---

## ADR-002: RAG-style venue prompting

**Date**: 2026-05-23
**Status**: Accepted

**Context**: The AI Concierge must recommend real venues from the database, never hallucinate.

**Decision**: Always query Firestore first, build venue context JSON, inject into system prompt before sending to Ollama. This is a retrieval-augmented generation pattern without a vector database.

**Consequences**: Slightly higher latency (Firestore query + Ollama call), but responses are always grounded in real data.

---

## ADR-003: Remove admin system

**Date**: 2026-05-23
**Status**: Accepted

**Context**: The admin system (`/admin` route, venue CRUD) is not core to the platform's value proposition and adds complexity.

**Decision**: Delete the admin system entirely. Replace with AI Venue Discovery insight cards that show analytically interesting patterns (underserved areas, venue gaps).

**Consequences**: Venues must be managed via Firestore console directly or the seed endpoint.

---

## ADR-004: Firebase cookie auth fix

**Date**: 2026-05-23
**Status**: Accepted

**Context**: The `Secure` cookie flag causes the auth token cookie to be silently rejected on `http://localhost`, causing logout on every refresh.

**Decision**: Conditionally set `Secure` only when `window.location.protocol === 'https:'`. Use `SameSite=Lax` always.

**Consequences**: Auth works on localhost during development. Production deployment on HTTPS gets the Secure flag automatically.
