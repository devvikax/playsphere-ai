"""
Django settings for PlaySphere AI Python backend.
SQLite is used only for Django internals (sessions, management commands).
All application data lives in Google Firestore.
"""
from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from backend/ or parent root directory
_env_path = BASE_DIR / ".env"
if not _env_path.exists():
    _env_path = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=_env_path)

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-playsphere-dev-key-change-in-production")

DEBUG = os.getenv("DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = ["*"]  # Lock down in production via env

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    # Our management commands app
    "core",
]

# No middleware needed — FastAPI handles the HTTP layer
MIDDLEWARE = []

ROOT_URLCONF = "core.urls"

# ── Database ── SQLite for Django internals only ──────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ── Static Files (not served by Django, just satisfies checks) ────────────────
STATIC_URL = "/static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Environment config exposed to Django context ──────────────────────────────
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]
