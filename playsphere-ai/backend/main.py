"""
PlaySphere AI — Python Backend
FastAPI application entry point.
Django settings are imported so management commands work via manage.py.
"""
import os
import django

# Bootstrap Django settings before anything else
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.concierge import router as concierge_router
from api.routes.discover import router as discover_router
from api.routes.admin import router as admin_router

app = FastAPI(
    title="PlaySphere AI Backend",
    description="Python backend powering PlaySphere AI venue discovery and AI concierge",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow Next.js (Vercel) and local dev origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", ""),  # Set to your Vercel URL in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(concierge_router, prefix="/api/ai")
app.include_router(discover_router,  prefix="/api/ai")
app.include_router(admin_router,     prefix="/api/admin")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "PlaySphere AI Backend"}
