# Phase 5: QA Polish & Build Verification

> **Status**: ✅ Completed
> **Objective**: Full project-wide QA audit. Fix every broken button, dead link, placeholder, and unstable workflow. Ensure `npm run build` passes with zero errors.

---

## QA Audit Checklist

### 🔐 Authentication Flow
- [ ] Email signup → profile created in Firestore → redirect to dashboard
- [ ] Email login → redirect to dashboard
- [ ] Google login → redirect to dashboard
- [ ] Invalid email → clear error message shown
- [ ] Wrong password → clear error message shown
- [ ] Already logged in → visiting /auth/login redirects to /dashboard
- [ ] Logout → cookie cleared → redirect to home
- [ ] Refresh dashboard → stays logged in (Phase 2 fix verified)

### 🗺️ Landing Page (`/`)
- [ ] Hero section loads cleanly
- [ ] AI Concierge preview works
- [ ] Sports categories link to `/venues?sport=X`
- [ ] Featured venues section populates
- [ ] "Book Now" CTAs navigate correctly
- [ ] No "Gemini" text references remain
- [ ] AI Discovery insights section shows (Phase 4)
- [ ] Google Maps section renders (no API key error)
- [ ] Footer updated ("Powered by Llama 3.1")

### 🏟️ Venues Page (`/venues`)
- [ ] Grid view shows all venues
- [ ] Search works correctly
- [ ] Sport filter works
- [ ] Area filter works
- [ ] Skill level filter works
- [ ] Price slider works
- [ ] Reset filters works
- [ ] Map view renders with venue pins
- [ ] AI concierge tab opens and works
- [ ] Empty state shown when no venues match filters
- [ ] Discovery insights panel shows (Phase 4)

### 🏟️ Venue Detail (`/venues/[id]`)
- [ ] Venue details load correctly
- [ ] Slot picker renders
- [ ] Already-booked slots shown as unavailable
- [ ] Date picker works
- [ ] Sport-specific pricing shown
- [ ] "Book Slot" button works when logged in
- [ ] "Book Slot" redirects to login when not logged in
- [ ] Booking confirmation feedback shown
- [ ] Redirect to dashboard after booking

### 📊 Dashboard (`/dashboard`)
- [ ] Bookings tab: real-time data (Phase 3 fix verified)
- [ ] Upcoming bookings shown with correct status badge
- [ ] History tab shows completed/cancelled bookings
- [ ] Cancel button works and updates in real time
- [ ] Saved venues tab shows bookmarked venues
- [ ] AI Concierge tab works (scroll fix verified, Phase 2)
- [ ] Profile tab shows user info, total bookings, saved count
- [ ] No admin toggle visible

### 🤖 AI Features
- [ ] Concierge: "beginner badminton near Gomti Nagar" → relevant venues returned
- [ ] Concierge: "football turf under ₹1000" → relevant results
- [ ] Concierge: conversation history maintained across messages
- [ ] Sports Buddy: gives beginner sports guidance
- [ ] Discovery insights: 3-4 cards loaded on landing and venues page
- [ ] Graceful error when LLM API is unavailable

### 📱 Mobile Responsiveness
- [ ] Navbar hamburger menu works on mobile
- [ ] Venue cards responsive on small screens
- [ ] AI chat usable on mobile
- [ ] Dashboard tabs scroll horizontally on mobile
- [ ] Booking slot picker usable on mobile
- [ ] Forms (login, signup) usable on mobile

---

## Build Verification

### Run Build
```bash
cd playsphere-ai
npm run build
```

### Common TypeScript Errors to Fix
- Unused imports (ESLint no-unused-vars)
- `any` types where specific types exist
- Missing `Suspense` wrappers on `useSearchParams()` pages
- Missing `"use client"` directives on interactive components
- Missing `key` props on mapped elements

### Performance Checks
- [ ] No large client-side bundles (check Next.js build output)
- [ ] Images use proper `alt` attributes
- [ ] No `console.error` / `console.log` left in production paths

---

## Final Cleanup

### Files to Delete (if not done in Phase 1)
- `playsphere-ai/test_saia.js`
- `playsphere-ai/test_local.js`
- `playsphere-ai/test_geai_headers.js`
- `playsphere-ai/read_logs.js`

### Text Updates
| Location | Old Text | New Text |
|----------|----------|----------|
| `AIConciergePreview.tsx` | "Powered by Gemini 2.5" | "Powered by Llama 3.1" |
| `Footer.tsx` | "Google Gemini 2.5" | "Llama 3.1 via Groq" |
| `app/page.tsx` | "Gemini understands..." | "AI understands..." |
| `app/page.tsx` | "Powered by Gemini 2.5" | "Powered by Llama 3.1" |

---

## Verification Sign-off

- [ ] Full demo flow completed without errors: land → search → venue → book → dashboard
- [ ] AI responds in under 5 seconds end-to-end
- [ ] No console errors in browser DevTools
- [ ] `npm run build` — zero TypeScript/ESLint errors
- [ ] Build size within acceptable range (< 5MB first load JS)
