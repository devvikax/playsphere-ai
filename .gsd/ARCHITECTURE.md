# ARCHITECTURE.md — PlaySphere AI System Design

> **Version**: 1.0 | **Status**: Draft

---

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   PlaySphere AI                      │
│           AI-Powered Sports Discovery               │
└─────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌─────▼────┐    ┌─────▼─────┐
    │ Next.js │     │ Firebase │    │  External  │
    │Frontend │     │  Backend │    │   APIs     │
    └────┬────┘     └─────┬────┘    └─────┬─────┘
         │                │                │
    ┌────▼────┐     ┌─────▼────┐    ┌─────▼─────┐
    │  Pages  │     │Firestore │    │  Gemini   │
    │  /app   │     │  +Auth   │    │  + Maps   │
    └─────────┘     └──────────┘    └───────────┘
```

---

## Folder Structure

```
playsphere-ai/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Landing page
│   ├── venues/
│   │   ├── page.tsx              # Venue discovery / search
│   │   └── [id]/page.tsx         # Individual venue detail
│   ├── booking/
│   │   └── [venueId]/page.tsx    # Booking flow
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── api/
│       ├── ai/concierge/route.ts  # Gemini AI Concierge endpoint
│       ├── ai/buddy/route.ts      # AI Sports Buddy endpoint
│       └── venues/route.ts        # Venues CRUD
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base components (Button, Card, Input...)
│   ├── layout/                   # Header, Footer, Nav
│   ├── venue/                    # VenueCard, VenueGrid, VenueFilter
│   ├── map/                      # MapView, VenuePin
│   ├── ai/                       # AIConcierge, SportsBuddy panels
│   ├── booking/                  # BookingForm, SlotPicker, BookingCard
│   └── auth/                     # AuthForm, GoogleSignIn
│
├── lib/                          # Utility functions
│   ├── firebase/
│   │   ├── config.ts             # Firebase initialization
│   │   ├── auth.ts               # Auth helpers
│   │   ├── firestore.ts          # Firestore helpers
│   │   └── seed.ts               # Seed data script
│   ├── gemini.ts                 # Gemini API client
│   ├── maps.ts                   # Maps utilities
│   ├── pricing.ts                # Peak pricing logic
│   └── utils.ts                  # General utilities
│
├── data/
│   └── venues.ts                 # Static venue seed data
│
├── types/
│   └── index.ts                  # TypeScript interfaces
│
├── middleware.ts                 # Route protection
├── .env.local                    # Environment variables
├── .env.example                  # Template
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## Data Models

### Venue (Firestore: `venues`)

```typescript
interface Venue {
  id: string;
  name: string;
  sport: 'badminton' | 'football' | 'swimming' | 'kabaddi';
  area: string;                   // e.g. "Gomti Nagar"
  address: string;
  coordinates: { lat: number; lng: number };
  price: number;                  // base price per hour in INR
  rating: number;                 // 1–5
  amenities: string[];            // ["AC", "Parking", "Changing Room"]
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  timings: { open: string; close: string };
  description: string;
  imageUrl: string;
  category: string;
  peakPricing: { morning: number; afternoon: number; evening: number };
  available: boolean;
  createdAt: Timestamp;
}
```

### Booking (Firestore: `bookings`)

```typescript
interface Booking {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  sport: string;
  date: string;
  slot: string;                   // e.g. "06:00–07:00"
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}
```

### User Profile (Firestore: `users`)

```typescript
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  savedVenues: string[];
  role: 'user' | 'admin';
  createdAt: Timestamp;
}
```

---

## AI Architecture

### Gemini Concierge Flow

```
User Input (natural language)
        │
        ▼
  /api/ai/concierge
        │
        ▼
  Parse intent with Gemini (sport, area, budget, skill)
        │
        ▼
  Fetch matching venues from Firestore
        │
        ▼
  Send venues + user query to Gemini
        │
        ▼
  Gemini returns: top recommendation + reasoning
        │
        ▼
  Display to user with venue card + explanation
```

---

## Authentication Flow

- Firebase Auth with Google Provider + Email/Password
- `middleware.ts` protects `/dashboard`, `/booking/*`, `/admin`
- Admin check via Firestore `users/{uid}.role === 'admin'`

---

## Peak Pricing Logic

| Time Slot | Label | Multiplier |
|-----------|-------|------------|
| 05:00–08:00 | Morning | 1.0x |
| 11:00–16:00 | Afternoon | 0.85x (discount) |
| 17:00–22:00 | Evening (Peak) | 1.3x |
| Weekend | Any | +₹100–300 |

---

## Deployment

- **Platform**: Vercel
- **Environment Variables**: Set in Vercel dashboard
- **Firebase Rules**: Configured for authenticated access
- **Domain**: `playsphere-ai.vercel.app` (or custom)
