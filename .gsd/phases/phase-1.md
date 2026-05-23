# Phase 1: Hosted LLM AI Migration

> **Status**: ⬜ Not Started
> **Objective**: Replace Gemini with hosted open-source LLM (Groq API). Remove all Gemini dependencies. Build modular AI service layer.

---

## Context

The current app uses `@google/generative-ai` SDK with the Gemini 1.5 Flash model. We need to:
1. Remove Gemini completely
2. Replace with a hosted provider (Groq API) that offers an OpenAI-compatible `/chat/completions` endpoint
3. Keep all AI features working (Concierge, Sports Buddy)
4. Keep AI logic server-side only
5. Use Firestore-grounded prompting so AI never hallucinates venues

**Provider chosen**: **Groq API** — free tier, ultra-fast inference, OpenAI-compatible, supports `llama-3.1-8b-instant`

---

## Environment Variables Required

```env
# .env.local additions
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=<YOUR_GROQ_API_KEY>
LLM_MODEL=llama-3.1-8b-instant
```

> ⚠️ **API KEY REQUIRED** — Get a free Groq key at https://console.groq.com

---

## Files to Change

### [DELETE] Remove Gemini SDK
- Remove `@google/generative-ai` from `package.json`
- Run `npm uninstall @google/generative-ai`

### [NEW] `lib/ai/llm.ts` — Core LLM Service
```typescript
// Unified fetch wrapper for any OpenAI-compatible hosted API
// Reads LLM_API_URL, LLM_API_KEY, LLM_MODEL from env
// Handles timeouts (30s), connection errors, and graceful degradation
// Returns: { content: string } | throws LLMError
```

### [MODIFY] `app/api/ai/concierge/route.ts`
- Remove `GoogleGenerativeAI` import and usage
- Import `callLLM` from `lib/ai/llm.ts`
- Keep Firestore venue context injection (RAG-style)
- Keep system prompt logic, just change the LLM caller

### [MODIFY] `app/api/ai/buddy/route.ts`
- Remove `GoogleGenerativeAI` import and usage
- Import `callLLM` from `lib/ai/llm.ts`
- Keep sports guidance system prompt

### [MODIFY] `.env.local`
- Remove `GEMINI_API_KEY`
- Add `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`

### [MODIFY] `components/ai/AIConciergePreview.tsx`
- Change "Powered by Gemini 2.5" → "Powered by Llama 3.1"

### [MODIFY] `components/layout/Footer.tsx`
- Change "Google Gemini 2.5" → "Llama 3.1 via Groq"

### [MODIFY] `app/page.tsx` (Landing)
- Update all Gemini text references to "Llama 3.1" or "AI Powered"

### [DELETE] Test files in project root
- `test_saia.js`
- `test_local.js`
- `test_geai_headers.js`
- `read_logs.js`

---

## Implementation Plan

### Step 1: Install & configure
```bash
npm uninstall @google/generative-ai
# Update .env.local with Groq credentials
```

### Step 2: Create `lib/ai/llm.ts`
- Export `callLLM(messages: ChatMessage[], options?: LLMOptions): Promise<string>`
- Uses `fetch()` to POST to `LLM_API_URL/chat/completions`
- Authorization: `Bearer LLM_API_KEY`
- Body: `{ model: LLM_MODEL, messages, temperature: 0.7, max_tokens: 1024 }`
- Error handling: timeout abort, connection refused → throw with descriptive message

### Step 3: Rewrite `concierge/route.ts`
- Query Firestore for all venues (same as before)
- Build system prompt with venue JSON context
- Call `callLLM()` with history + system prompt
- Return `{ response: string }`

### Step 4: Rewrite `buddy/route.ts`
- Build sports guidance system prompt
- Call `callLLM()` with user message
- Return `{ response: string }`

### Step 5: Update UI text
- Concierge header: "Powered by Llama 3.1"
- Footer, landing page: remove Gemini references

### Step 6: Delete test files

---

## Verification

- [ ] `npm run build` passes with no Gemini-related errors
- [ ] AI Concierge responds correctly to "beginner badminton near Gomti Nagar"
- [ ] AI Sports Buddy responds to sports questions
- [ ] Groq API latency < 3 seconds for typical queries
- [ ] Error state shown if `LLM_API_KEY` is missing or API is down
