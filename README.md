# 🏆 PlaySphere AI

> **APL Qualifiers 2026 — Team DeepStack**

An AI-powered sports infrastructure discovery and booking platform for Lucknow.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.5-blue?logo=google)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🎯 Problem Statement

Sports infrastructure in Lucknow is highly fragmented — players struggle to discover, compare, and book courts, turfs, pools, and akharas. There is no intelligent, unified platform that understands user intent and guides them to the right facility at the right time and price.

**PlaySphere AI** solves this with an agentic AI concierge that understands natural language, recommends venues with reasoning, shows them on an interactive map, and enables instant simulated booking.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Concierge** | Natural language venue discovery powered by Gemini 2.5 |
| 🏃 **AI Sports Buddy** | Beginner guidance, tips, timing suggestions |
| 🗺️ **Smart Map View** | Google Maps integration with venue pins and details |
| 🔍 **Smart Discovery** | Filter by sport, area, budget, skill level, amenities |
| 📅 **Booking System** | Simulated slot booking with Firestore history |
| 📊 **User Dashboard** | Upcoming bookings, history, saved venues |
| 🛡️ **Admin Panel** | Add/edit/manage venue listings |
| ⚡ **Peak Pricing** | Smart pricing logic + AI slot recommendations |
| 🔄 **Alt Venue Agent** | AI suggests alternatives when venues are unavailable |

---

## 🏅 Hackathon Scoring

| Criterion | Weight | Our Approach |
|-----------|--------|-------------|
| Innovation & Creativity | 25% | Gemini AI Concierge + Agentic alternatives + Sports Buddy |
| Technical Implementation | 25% | Next.js + Firebase + Gemini + Maps full integration |
| Theme Relevance | 20% | Direct APL sports infrastructure discovery |
| Completeness | 20% | End-to-end working MVP |
| Documentation & Presentation | 10% | This README + architecture docs + demo flow |

---

## 👥 Team DeepStack

| Name | Role | Responsibility |
|------|------|---------------|
| **Suryansh Singh** | Team Leader | Documentation & Demo |
| **Shivam Jaiswal** | Frontend/UI | Next.js, Tailwind, Components |
| **Suyash Verma** | Backend/Database | Firebase, API Routes, Auth |
| **Vikas Patel** | AI Integration | Gemini API, AI Concierge, Sports Buddy |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google + Email/Password)
- **AI**: Google Gemini 2.5 Flash API
- **Maps**: Google Maps JavaScript API
- **Deployment**: Vercel

---

## 🤖 AI Tools Used

| Tool | Purpose |
|------|---------|
| Google Gemini 2.5 Flash | AI Concierge, Sports Buddy, Venue Recommendations |
| Gemini Function Calling | Structured venue data extraction from natural language |
| Gemini Reasoning | Explanation of venue recommendations ("...because it's beginner-friendly") |

---

## 📁 Project Structure

```
playsphere-ai/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── venues/             # Venue discovery
│   ├── booking/            # Booking flow
│   ├── dashboard/          # User dashboard
│   ├── admin/              # Admin panel
│   ├── auth/               # Auth pages
│   └── api/                # API routes (AI, venues)
├── components/             # Reusable UI components
│   ├── ui/                 # Base components
│   ├── venue/              # Venue cards, grid, filters
│   ├── map/                # Google Maps components
│   ├── ai/                 # AI Concierge & Sports Buddy
│   ├── booking/            # Booking components
│   └── auth/               # Auth components
├── lib/                    # Utility functions
│   ├── firebase/           # Firebase config & helpers
│   ├── gemini.ts           # Gemini API client
│   ├── pricing.ts          # Peak pricing logic
│   └── utils.ts            # Utilities
├── data/
│   └── venues.ts           # Seed data (20+ Lucknow venues)
├── types/
│   └── index.ts            # TypeScript interfaces
└── middleware.ts            # Route protection
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Gemini API key
- Google Maps API key

### 1. Clone & Install

```bash
git clone https://github.com/your-team/playsphere-ai.git
cd playsphere-ai/playsphere-ai
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps (NEXT_PUBLIC_ exposes it to browser)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# Gemini (server-side only — no NEXT_PUBLIC_)
GEMINI_API_KEY=your_gemini_key
```

### 3. Seed Firebase

Start the server and visit the seed endpoint to populate the database:

```bash
npm run dev
```

Open [http://localhost:3000/api/seed](http://localhost:3000/api/seed) in your browser.

Open [http://localhost:3000](http://localhost:3000)

---

## 🎬 Demo Flow

1. **Landing** — See the hero, sports categories, featured venues
2. **AI Concierge** — Type: *"Beginner badminton near Gomti Nagar under ₹300"*
3. **View on Map** — See venue pins on Google Maps
4. **Book** — Select slot and confirm booking (simulated)
5. **Dashboard** — See upcoming booking in user dashboard

---

## 📋 Known Limitations

- Booking is simulated (no real payment gateway)
- Slot availability is not connected to real venue systems
- Limited to Lucknow venues only (v1)
- Google Maps requires billing-enabled API key

---

## 📄 License

MIT License — Open source for hackathon purposes.

---

*Built with ❤️ by Team DeepStack for APL Qualifiers 2026*
