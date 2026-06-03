"""
Firebase Admin SDK initialisation.
Supports two auth methods (checked in order):
  1. FIREBASE_SERVICE_ACCOUNT_JSON env var (JSON string) — for Railway/CI
  2. FIREBASE_SERVICE_ACCOUNT_PATH env var (path to key file) — for local dev
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from dotenv import load_dotenv
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"
if not _env_path.exists():
    _env_path = _backend_dir.parent / ".env"
load_dotenv(dotenv_path=_env_path)

_app: firebase_admin.App | None = None

def _get_app() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    # Prefer pre-existing default app (e.g. in test context)
    if firebase_admin._apps:
        _app = firebase_admin.get_app()
        return _app

    cred = None

    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        sa_dict = json.loads(sa_json)
        cred = credentials.Certificate(sa_dict)
    else:
        sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")
        if os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)

    _app = firebase_admin.initialize_app(cred, {
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
    })
    return _app


def get_firestore_client():
    """Return a Firestore client bound to the Admin SDK app."""
    _get_app()
    return firestore.client()


def get_auth_client():
    """Return the Firebase Auth client."""
    _get_app()
    return firebase_auth
