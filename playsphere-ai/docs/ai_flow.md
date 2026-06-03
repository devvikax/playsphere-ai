# AI Systems & Prompt Flows Guide

PlaySphere AI integrates OpenAI-compatible hosted LLM capability (e.g. Groq) directly with real-time database grounding. This document details the prompts, grounding strategies, and schemas used.

---

## 🤖 AI Models and Providers

We use an **OpenAI-compatible hosted LLM API** (such as Groq running Llama 3) as our primary language model. The client initialization is defined in `backend/ai/llm.py`, referencing environment variables `LLM_API_URL` and `LLM_API_KEY` loaded dynamically from the root `.env` file.

---

## 🛠️ Grounded AI Services

To avoid hallucinations, all AI services query **Firestore** (via `backend/firebase_service/firestore.py`) at execution time. The retrieved data is injected into the LLM system prompt dynamically.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ User UI Request │ ─────>│ Next.js Proxy   │ ─────>│ FastAPI Backend │ ─────>│  AI Service      │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └──────────────────┘
                                                                                       │
                                                                                       ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│       LLM       │ <─────│ Grounded Prompt │ <─────│ Firestore Query │ <─────│ firebase-admin   │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └──────────────────┘
```

---

## 💬 1. Sports Concierge Assistant (`backend/ai/concierge.py`)

The Concierge answers general queries about sports in Lucknow, filters venues by pricing/location, and assists with availability.

* **Target API**: `/api/ai/concierge` (proxied to Python backend endpoint `/api/ai/concierge`)
* **Real-time Grounding**: Fetches all approved venues (`get_all_venues()`) and maps relevant properties (`name`, `sport`, `area`, `price`, `rating`, `timings`, `amenities`).
* **Prompt Rule Highlights**:
  * Cannot recommend any venue not present in the grounding database (strict anti-hallucination constraint).
  * Automatically calculates pricing modifiers: Afternoon (11 AM - 4 PM) saves 15%, evening (5 PM - 10 PM) is 30% more expensive.
  * Ensures formatting has a clear structure: Acknowledgment, recommendations (1-3 max), pricing insights, next step.
  * Supports **AI-assisted booking orchestration** (agentic booking prefill): When a player requests to book a slot, the AI parses the venue and time, verifies availability, and triggers a visual prefilled booking ticket card so the user can easily review and finalize manually.

---

## 🏸 2. PlaySphere AI Concierge Modes (`backend/ai/concierge.py`)

The AI Concierge is a unified conversational agent that offers two internal modes:

* **Discovery Mode**:
  * Helps users search, filter, and compare sports venues in Lucknow.
  * Grounded strictly in live Firestore data (counts, locations, prices, active status).
  * Automatically calculates pricing modifiers based on slot timing (Afternoon 15% discount, Evening 30% peak pricing).
* **Guidance Mode**:
  * Provides basic rules, beginner-friendly instructions, workout timing advice, and gear suggestions.
  * Governed by safety guardrails that block medical, fitness-coaching, or professional fitness plans.

---

## 📊 3. Discover Insights Generator (`backend/ai/discover.py`)

Analyzes the overall venue landscape in Lucknow, performing server-side analytics (such as count distributions by area/sport, price averages) and feeds these summaries into the LLM to get structured JSON recommendations.

* **Target API**: `/api/ai/discover` (proxied to Python backend endpoint `/api/ai/discover`)
* **Grounding Data**:
  * Total venue counts
  * Area counts (Gomti Nagar, Aliganj, Hazratganj, etc.)
  * Sport counts (Badminton, Football, Swimming, Akhara)
  * Average prices per area
* **Expected Output JSON Schema**:

  ```python
  class Insight(BaseModel):
      type: Literal["gap", "opportunity", "trend", "value"]
      title: str        # max 4 words
      description: str  # max 2 sentences with statistics
      area: Optional[str] = None
      sport: Optional[str] = None
      emoji: str
      urgency: Literal["high", "medium", "low"]
  ```

* **Fallback Strategy**: If parsing the JSON response from the LLM fails, the backend service catches the exception and returns predefined seed insights (`get_static_fallback_insights()`), ensuring the user never sees a broken page.

