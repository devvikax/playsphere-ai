# PlaySphere AI — Python Backend

This is the Python backend for PlaySphere AI, built with **Django + FastAPI**. It replaces the Next.js TypeScript route handlers while keeping the Next.js frontend intact.

## Architecture

```
Vercel (Next.js frontend) → HTTP proxy → Railway (Python backend) → Firestore
```

## Tech Stack

| Layer | Technology |
|---|---|
| HTTP Framework | FastAPI + uvicorn |
| Settings / CLI | Django |
| Firebase | firebase-admin (Python) |
| HTTP Client | httpx (async) |
| Data Models | Pydantic v2 |

---

## Local Development Setup

### 1. Prerequisites

- Python 3.11+
- Firebase service account key (download from Firebase Console → Project Settings → Service Accounts)

### 2. Install dependencies

```bash
cd python_backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values:
# - FIREBASE_SERVICE_ACCOUNT_PATH (point to your downloaded serviceAccountKey.json)
# - FIREBASE_PROJECT_ID
# - LLM_API_KEY (Groq API key)
```

### 4. Run migrations (Django internals only)

```bash
python manage.py migrate
```

### 5. Start the server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 6. Start Next.js frontend (separate terminal)

```bash
cd ../frontend
npm run dev
```

Make sure your `frontend/.env.local` has:
```
PYTHON_BACKEND_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/ai/concierge` | AI Concierge — venue search & booking |
| POST | `/api/ai/discover` | Venue Discovery insights |
| POST | `/api/admin/discover-infrastructure` | Run infrastructure discovery scan (admin only) |

---

## Management Commands

### Run full test suite

```bash
python manage.py run_test_suite
```

This runs the PS-25 Alignment Verification Suite — equivalent of the old `/api/test-verification` Next.js route.

---

## Production Deployment (Railway)

1. Create a new Railway project
2. Connect your GitHub repo (or push from CLI)
3. Set the root directory to `python_backend/`
4. Set all environment variables from `.env.example`
5. Railway will auto-detect `Procfile` and start `uvicorn`

Then in your Vercel project, add:
```
PYTHON_BACKEND_URL=https://your-railway-app.up.railway.app
```

---

## Project Structure

```
├── core/                   # Django settings & management commands
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── management/commands/ # Django management commands
│       └── run_test_suite.py
├── firebase_service/       # Firebase Admin SDK integration
│   ├── client.py           # SDK initialization
│   └── firestore.py        # All Firestore CRUD operations
├── shared/                 # Shared utilities
│   ├── types.py            # Pydantic models
│   ├── pricing.py          # Slot generation, peak pricing
│   └── ticket.py           # Ticket ID generator
├── ai/                     # AI layer
│   ├── llm.py              # LLM API client (httpx)
│   ├── ranking.py          # Weighted venue ranking
│   ├── concierge.py        # AI Concierge handler
│   ├── discover.py         # Discovery insights
│   ├── osm_discovery.py    # OpenStreetMap Overpass API
│   └── infrastructure_discovery.py
├── api/routes/             # FastAPI routers
│   ├── concierge.py        # POST /api/ai/concierge
│   ├── discover.py         # POST /api/ai/discover
│   └── admin.py            # POST /api/admin/discover-infrastructure
├── main.py                 # FastAPI app entry point
├── manage.py               # Django CLI
├── requirements.txt
├── Procfile                # Railway deployment
└── railway.toml            # Railway config
```
