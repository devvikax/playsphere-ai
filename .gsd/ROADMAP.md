# ROADMAP.md — PlaySphere AI

> **Current Phase**: Phase 1
> **Milestone**: v1.0 — Hackathon MVP

---

## Must-Haves (from SPEC)

- [ ] Premium landing page with hero, sports categories, featured venues, AI preview
- [ ] Firebase Authentication (Google + Email/Password)
- [ ] Venue discovery with search, filter, and card grid
- [ ] Google Maps integration with venue pins
- [ ] Gemini AI Concierge (natural language → venue recommendations)
- [ ] AI Sports Buddy (beginner tips + sport guidance)
- [ ] Simulated booking system with Firestore storage
- [ ] User dashboard (upcoming bookings, history, saved venues)
- [ ] Admin dashboard (/admin) — add/edit venues
- [ ] Peak pricing logic (morning/afternoon/evening + weekend)
- [ ] Alternative venue agent (AI suggests fallback when unavailable)
- [ ] Firebase Firestore seed data (Lucknow venues)
- [ ] Vercel deployment ready

---

## Phases

### Phase 1: Foundation & Initial Commit
**Status**: ⬜ Not Started
**Objective**: Set up Next.js project, Tailwind, Firebase config, folder structure, README, and seed data script. First meaningful commit to GitHub.

**Deliverables**:
- Next.js app scaffold with Tailwind CSS
- Firebase config (auth + firestore)
- Folder structure: `/app`, `/components`, `/lib`, `/firebase`, `/data`
- `README.md` (full hackathon-ready)
- Firestore seed data (venues collection)
- `.env.example` with all required keys

---

### Phase 2: Landing Page & Authentication
**Status**: ⬜ Not Started
**Objective**: Premium sports-tech landing page + Firebase Auth flows.

**Deliverables**:
- Hero section (headline, subtext, dual CTAs)
- How it works section
- Popular sports cards
- Featured venues section
- AI concierge preview section
- Maps preview section
- Testimonials / trust section
- Footer
- Google Sign-In + Email/Password auth
- Protected routes middleware

---

### Phase 3: Venue Discovery + Maps
**Status**: ⬜ Not Started
**Objective**: Full venue browsing, search/filter, and Google Maps integration.

**Deliverables**:
- Venue listing page with card grid
- Search + multi-filter (sport, area, budget, skill, amenities, rating)
- Google Maps with venue pins (click → venue card)
- Hybrid map + listing layout
- Distance-based viewing
- Individual venue detail page

---

### Phase 4: AI Concierge + Sports Buddy
**Status**: ⬜ Not Started
**Objective**: Gemini-powered conversational AI features.

**Deliverables**:
- AI Concierge panel (natural language → Firestore filter → recommendation)
- Gemini API integration with structured prompting
- Recommendation with reasoning explanation
- AI Sports Buddy (beginner tips, sport guidance, timing suggestions)
- Alternative venue agent (fallback suggestions when unavailable)
- Peak pricing awareness in recommendations

---

### Phase 5: Booking System + Dashboard
**Status**: ⬜ Not Started
**Objective**: Complete booking flow and user/admin dashboards.

**Deliverables**:
- Booking flow: select venue → pick slot → confirm
- Firestore booking storage
- User dashboard: upcoming, history, saved venues, profile
- Admin dashboard (/admin): add/edit/delete venues
- Cancel booking functionality
- Peak pricing display logic

---

### Phase 6: Polish, Seed Data & Deployment
**Status**: ⬜ Not Started
**Objective**: Final UI polish, complete seed data, and Vercel deployment.

**Deliverables**:
- All animations and micro-interactions finalized
- 20+ Lucknow venues seeded across 4 sports
- Mobile responsiveness verified
- Vercel deployment configured
- Environment variables documented
- Demo flow rehearsed and validated
