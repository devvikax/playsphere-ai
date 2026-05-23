# ARCHITECTURE.md — PlaySphere AI

> **Type**: Brownfield Next.js App Router Application
> **Status**: Mapped 2026-05-23

---

## System Overview

```
Browser (React Client)
    │
    ├── /               Landing page with AI preview, sports categories, map teaser
    ├── /venues          Venue discovery: grid, map, AI filter views
    ├── /venues/[id]     Venue detail + booking slot selector
    ├── /dashboard       User bookings, saved venues, AI concierge, profile
    ├── /auth/login      Email + Google sign-in
    ├── /auth/signup     Email + Google registration
    └── [DELETED] /admin  Manual venue management (being removed)
    
    ↕ API Routes (server-side only)
    ├── /api/ai/concierge   AI venue recommendations (Ollama)
    ├── /api/ai/buddy       Sports Buddy guidance (Ollama)
    ├── /api/ai/discover    [NEW] AI venue discovery insights (Ollama)
    └── /api/seed           Firebase seed endpoint
    
    ↕ External Services
    ├── Firebase Auth       Google + Email/Password sign-in
    ├── Firebase Firestore  venues, bookings, users collections
    ├── Google Maps API     Interactive map with venue pins
    └── Ollama (local)      LLM inference at http://localhost:11434
```

---

## File Structure

```
playsphere-ai/
├── app/
│   ├── globals.css          Neo-brutalist design tokens + CSS variables
│   ├── layout.tsx           Root layout with AuthProvider, Navbar, Footer
│   ├── page.tsx             Landing page (hero, sports categories, AI preview)
│   ├── api/
│   │   ├── ai/
│   │   │   ├── concierge/route.ts   Ollama-powered venue AI
│   │   │   ├── buddy/route.ts       Ollama-powered sports mentor
│   │   │   └── discover/route.ts    [NEW] AI venue discovery insights
│   │   └── seed/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   └── venues/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── ai/
│   │   ├── AIConciergePreview.tsx
│   │   └── VenueDiscoveryInsights.tsx  [NEW]
│   ├── auth/
│   │   └── AuthProvider.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── venue/
│       ├── VenueCard.tsx
│       └── VenueMap.tsx
├── lib/
│   ├── ai/
│   │   └── ollama.ts        [NEW] Core Ollama API wrapper
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── firestore.ts
│   │   └── seed.ts
│   ├── pricing.ts
│   └── utils.ts
├── data/
│   └── venues.ts            Static venue seed data (20+ Lucknow venues)
├── types/
│   └── index.ts
└── middleware.ts             Route protection
```

---

## Data Models

### Venue (Firestore: `venues` collection)
```typescript
{
  id: string
  name: string
  sport: Sport
  area: string
  address: string
  price: number          // per hour in INR
  rating: number         // 1-5
  skillLevel: SkillLevel // beginner | intermediate | advanced | all
  amenities: string[]
  available: boolean
  description: string
  timings: string
  imageUrl: string
  coordinates: { lat: number; lng: number }
}
```

### Booking (Firestore: `bookings` collection)
```typescript
{
  id: string
  userId: string
  venueId: string
  venueName: string
  venueArea: string
  sport: Sport
  date: string           // YYYY-MM-DD
  slot: string           // e.g. "07:00 AM"
  price: number
  status: 'upcoming' | 'completed' | 'cancelled'
  createdAt: Timestamp
}
```

### UserProfile (Firestore: `users` collection)
```typescript
{
  uid: string
  displayName: string
  email: string
  photoURL: string
  role: 'user' | 'admin'  // admin role being removed
  savedVenues: string[]
  createdAt: Timestamp
}
```

---

## AI Architecture (Post-Migration)

```
User Input (Frontend)
    │
    ▼
API Route (Server-side)         ← No AI logic on client
    │
    ├── 1. Query Firestore for venue context (RAG-style)
    ├── 2. Build system prompt with venue data
    ├── 3. Call Ollama HTTP API at OLLAMA_BASE_URL
    │         POST /api/chat
    │         { model: OLLAMA_MODEL, messages: [...] }
    ├── 4. Parse and validate response
    └── 5. Return JSON { response: string } to frontend

lib/ai/ollama.ts (Core Wrapper)
    ├── callOllama(messages, options)
    ├── Handles timeout (30s default)
    ├── Handles connection refused (Ollama not running)
    └── Returns typed response or throws OllamaError
```

---

## Key Design Decisions

1. **Ollama over Gemini**: Local inference, no API key required, works offline
2. **RAG-style prompting**: Always inject Firestore venue data into Ollama context — never hallucinate
3. **Cookie auth**: Firebase ID token stored as cookie for SSR middleware auth checks
4. **Static + dynamic fallback**: Venues page shows local `LUCKNOW_VENUES` if Firestore fetch fails
5. **Neo-brutalism**: Stark borders, flat shadows, boxy elements — preserved unchanged
