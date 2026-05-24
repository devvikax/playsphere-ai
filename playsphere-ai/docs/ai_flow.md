# AI Systems & Prompt Flows Guide

PlaySphere AI integrates Gemini LLM capability directly with real-time database grounding. This document details the prompts, grounding strategies, and schemas used.

---

## 🤖 AI Models and Providers

We use **Google Gemini** as our primary language model. The client initialization is defined in `backend/ai/llm.ts`, referencing the user's environment variable `NEXT_PUBLIC_GEMINI_API_KEY`. 

---

## 🛠️ Grounded AI Services

To avoid hallucinations, all AI services query **Firestore** at execution time (or fall back to static seed data if Firestore is unreachable). The retrieved data is injected into the LLM system prompt dynamically.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ User UI Request │ ─────>│   Next.js API   │ ─────>│  AI Service     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Gemini LLM    │ <─────│ Grounded Prompt │ <─────│ Firestore Query │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 💬 1. Sports Concierge Assistant (`backend/ai/concierge.ts`)

The Concierge answers general queries about sports in Lucknow, filters venues by pricing/location, and assists with availability.

* **Target API**: `/api/ai/concierge`
* **Real-time Grounding**: Fetches all approved venues (`getAllVenues()`) and maps relevant properties (`name`, `sport`, `area`, `price`, `rating`, `timings`, `amenities`).
* **Prompt Rule Highlights**:
  * Cannot recommend any venue not present in the grounding database (strict anti-hallucination constraint).
  * Automatically calculates pricing modifiers: Afternoon (11 AM - 4 PM) saves 15%, evening (5 PM - 10 PM) is 30% more expensive.
  * Ensures formatting has a clear structure: Acknowledgment, recommendations (1-3 max), pricing insights, next step.

---

## 🏸 2. Sports Buddy Mentor (`backend/ai/buddy.ts`)

The Sports Buddy acts as an encouraging mentor, assisting beginners with training advice, hydration, and suggesting venues fitting their skill level.

* **Target API**: `/api/ai/buddy`
* **Real-time Grounding**: Dynamically fetches and filters active venues by the user's selected sport (`sport`).
* **Prompt Rule Highlights**:
  * Mentors beginners (recommends safety, warm-ups, and budget slots).
  * Guides intermediates towards competitive play and drills.
  * Encourages group match-making/turf-sharing.
  * Restricts recommendations to the current sport-specific venue list.

---

## 📊 3. Discover Insights Generator (`backend/ai/discover.ts`)

Analyzes the overall venue landscape in Lucknow, performing server-side analytics (such as count distributions by area/sport, price averages) and feeds these summaries into the LLM to get structured JSON recommendations.

* **Target API**: `/api/ai/discover`
* **Grounding Data**:
  * Total venue counts
  * Area counts (Gomti Nagar, Aliganj, Hazratganj, etc.)
  * Sport counts (Badminton, Football, Swimming, Akhara)
  * Average prices per area
* **Expected Output JSON Schema**:
  ```typescript
  interface Insight {
    type: 'gap' | 'opportunity' | 'trend' | 'value';
    title: string;       // max 4 words
    description: string; // max 2 sentences with statistics
    area?: string;
    sport?: string;
    emoji: string;
    urgency: 'high' | 'medium' | 'low';
  }
  ```
* **Fallback Strategy**: If parsing the JSON response from Gemini fails, the backend service catches the exception and returns predefined seed insights (`getStaticFallbackInsights()`), ensuring the user never sees a broken page.
