# SPEC.md — PlaySphere AI Project Specification

> **Status**: `FINALIZED`
> **Team**: DeepStack | **Hackathon**: APL Qualifiers 2026

---

## Vision

PlaySphere AI is an agentic sports infrastructure discovery and booking platform for Lucknow. It solves the fragmentation in sports facility discovery by combining AI-powered recommendations (via Gemini), real-time maps (Google Maps), and smart booking — all in a polished, startup-quality interface that feels intelligent and conversational.

## Goals

1. **AI Concierge** — Users describe what they want in natural language; Gemini understands intent, filters Firestore data, and recommends the best venues with reasoning.
2. **Smart Discovery** — Filter venues by sport, area, budget, skill level, amenities, and time slot with map and card hybrid UI.
3. **Booking System** — Simulated slot booking with Firebase Firestore, dashboard, and booking history.
4. **Agentic Behavior** — AI suggests alternatives when venues are unavailable, gives beginner tips via AI Sports Buddy, and factors peak pricing logic.
5. **Admin Panel** — Secure `/admin` route to manage venue listings.

## Non-Goals (Out of Scope)

- Real payment gateway integration (Razorpay/Stripe etc.)
- Real-time slot availability API from actual venues
- Native mobile app (web-only MVP)
- Multi-city support beyond Lucknow (v1)

## Users

- **Sports enthusiasts in Lucknow** — casual players looking to book courts/turfs/pools
- **Beginners** — first-time players needing guidance on venues and timing
- **Group bookers** — people organizing sports sessions for friends/teams
- **Admin** — venue managers or hackathon team maintaining listings

## Constraints

- **Timeline**: Hackathon MVP — must be demo-ready
- **Tech**: Next.js + Tailwind CSS + Firebase + Gemini API + Google Maps API
- **Deployment**: Vercel-compatible
- **AI Model**: Gemini 2.5 Flash (already have API key)
- **Database**: Firebase Firestore (no SQL)
- **Auth**: Firebase Authentication (Google + Email/Password)

## Success Criteria

- [ ] Landing page impresses hackathon judges within 5 seconds
- [ ] AI Concierge successfully interprets natural language queries and returns relevant venues
- [ ] Google Maps shows all venues as pins with click-to-view
- [ ] User can complete a booking flow: Search → Select → Book → Dashboard
- [ ] Admin can add/edit venues via secure `/admin` route
- [ ] App is deployed on Vercel and accessible via public URL
- [ ] GitHub repo is public with clean commit history

## Hackathon Scoring Alignment

| Criterion | Weight | Our Approach |
|-----------|--------|-------------|
| Innovation & Creativity | 25% | Gemini AI Concierge + AI Sports Buddy + agentic alternatives |
| Technical Implementation | 25% | Full-stack Next.js, Firebase, Maps, AI integration |
| Theme Relevance | 20% | Direct APL sports infra discovery use case |
| Completeness | 20% | All core flows working end-to-end |
| Documentation & Presentation | 10% | Clean README, architecture docs, demo flow |
