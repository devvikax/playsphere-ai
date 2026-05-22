# DECISIONS.md — Architecture Decision Records

> ADR log for PlaySphere AI

---

## ADR-001: Frontend Framework — Next.js with App Router

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Use Next.js 14+ with App Router (not Pages Router).

**Reasoning**:
- Server components for SEO-critical landing page
- API routes for Gemini proxy (keeps API key server-side)
- Vercel-native deployment
- Built-in middleware for route protection

---

## ADR-002: Styling — Tailwind CSS

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Tailwind CSS for all styling.

**Reasoning**: Hackathon speed + design system consistency. No custom CSS overhead.

---

## ADR-003: Database — Firebase Firestore

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Firebase Firestore (NoSQL) for venues, bookings, users.

**Reasoning**: Real-time, serverless, no infrastructure management. Firebase Auth pairs naturally.

---

## ADR-004: AI — Gemini 2.5 Flash

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Google Gemini 2.5 Flash via REST API through Next.js API routes.

**Reasoning**: Team already has API key. Best model for structured function-calling with venue data.

---

## ADR-005: Maps — Google Maps JavaScript API

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Google Maps JS API with `@googlemaps/react-wrapper` or `@react-google-maps/api`.

**Reasoning**: Required by spec. Best integration with Lucknow location data.

---

## ADR-006: Project Directory

**Date**: 2026-05-22
**Status**: Accepted

**Decision**: Create PlaySphere AI as `/playsphere-ai` subdirectory within the existing workspace.

**Reasoning**: Existing `.py` files in root are from a previous experiment and should not be mixed with the Next.js project.
