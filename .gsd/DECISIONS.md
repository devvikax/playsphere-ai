# DECISIONS.md — PlaySphere AI

> Architecture Decision Records (ADRs)

---

## ADR-001: Replace Gemini with Ollama

**Date**: 2026-05-23
**Status**: Accepted

**Context**: The Gemini API key was working but the user wants to switch to Ollama for local inference. The Globant Enterprise AI (saia.ai) token was tested extensively — all auth combinations return 401. Ollama is the correct replacement.

**Decision**: Use Ollama local inference at `http://localhost:11434`. Model: `llama3.1:8b` (default), configurable via `OLLAMA_MODEL` env var.

**Consequences**: AI features require Ollama running locally. Graceful degradation must be implemented for when Ollama is not available.

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
