"""
POST /api/admin/discover-infrastructure
Admin-only endpoint to trigger the infrastructure discovery scan.
Verifies Firebase ID Token and admin role, manages scan lock/cooldown in Firestore.
"""
from __future__ import annotations
import os
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, HTTPException, Request

from firebase_service.client import get_auth_client, get_firestore_client
from ai.infrastructure_discovery import run_infrastructure_discovery

router = APIRouter()

_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
_ADMIN_EMAILS = [
    e.strip().lower()
    for e in os.getenv("ADMIN_EMAILS", "").split(",")
    if e.strip()
]


async def _firestore_get(collection: str, doc_id: str, token: str) -> dict | None:
    """Read a Firestore document via REST API using the user's auth token."""
    url = (
        f"https://firestore.googleapis.com/v1/projects/{_PROJECT_ID}"
        f"/databases/(default)/documents/{collection}/{doc_id}"
    )
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 404:
            return None
        if not resp.is_success:
            raise RuntimeError(f"Firestore REST GET failed: {resp.status_code} {resp.text[:200]}")
        return resp.json()


async def _firestore_patch(collection: str, doc_id: str, fields: dict, token: str) -> None:
    """Write fields to a Firestore document via REST API using the user's auth token."""
    url = (
        f"https://firestore.googleapis.com/v1/projects/{_PROJECT_ID}"
        f"/databases/(default)/documents/{collection}/{doc_id}"
    )
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.patch(
            url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"fields": fields},
        )
        if not resp.is_success:
            raise RuntimeError(f"Firestore REST PATCH failed: {resp.status_code} {resp.text[:200]}")


@router.post("/discover-infrastructure")
async def discover_infrastructure(request: Request):
    # 1. Extract Bearer token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=403,
            detail="Unauthorized: Missing or invalid credentials.",
        )
    token = auth_header[len("Bearer "):].strip()

    # 2. Verify Firebase ID Token
    try:
        auth = get_auth_client()
        decoded = auth.verify_id_token(token)
        admin_email = (decoded.get("email") or "").lower()
        uid = decoded["uid"]
    except Exception as exc:
        raise HTTPException(status_code=403, detail=f"Unauthorized: {exc}")

    # 3. Validate admin role
    is_email_admin = admin_email in _ADMIN_EMAILS

    # Check Firestore users/{uid}.role via SDK
    try:
        db = get_firestore_client()
        user_doc = db.collection("users").document(uid).get()
        user_role = (user_doc.to_dict() or {}).get("role", "") if user_doc.exists else ""
    except Exception:
        user_role = ""

    is_role_admin = user_role == "admin"

    if not is_email_admin and not is_role_admin:
        print(f"[SECURITY] Blocked non-admin. Email: {admin_email}, UID: {uid}")
        raise HTTPException(status_code=403, detail="Forbidden: Access requires admin permissions.")

    # 4. Scan lock & cooldown check
    lock_acquired = False
    now = datetime.now(timezone.utc)

    try:
        status_data = await _firestore_get("system_settings", "discovery", token)

        if status_data and status_data.get("fields"):
            fields = status_data["fields"]
            is_running = fields.get("isRunning", {}).get("booleanValue", False)
            last_scan_str = fields.get("lastScanAt", {}).get("timestampValue")
            last_scan_at = datetime.fromisoformat(last_scan_str.rstrip("Z")) if last_scan_str else None
            if last_scan_at and last_scan_at.tzinfo is None:
                last_scan_at = last_scan_at.replace(tzinfo=timezone.utc)

            # Lock check (10-min safety timeout)
            if is_running:
                diff = (now - last_scan_at).total_seconds() if last_scan_at else 9999
                if diff < 600:
                    raise HTTPException(status_code=429, detail="Discovery already running.")

            # Cooldown check (5 min)
            if last_scan_at:
                diff_secs = (now - last_scan_at).total_seconds()
                cooldown = 5 * 60
                if diff_secs < cooldown:
                    next_available = int(cooldown - diff_secs)
                    raise HTTPException(
                        status_code=429,
                        detail=f"Please wait before running another scan.",
                        headers={"X-Next-Available-Sec": str(next_available)},
                    )

        # 5. Acquire lock
        await _firestore_patch(
            "system_settings", "discovery",
            {
                "isRunning": {"booleanValue": True},
                "lastScanAt": {"timestampValue": now.isoformat()},
            },
            token,
        )
        lock_acquired = True
        print(f"[DISCOVERY] Scan starting. Triggered by admin: {admin_email}")

        # 6. Run discovery
        result = await run_infrastructure_discovery()
        print(f"[DISCOVERY] Complete. Added: {result['added']}, Skipped: {result['skipped']}, Errors: {result['errors']}")

        return {**result, "triggeredBy": admin_email}

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[DISCOVERY] Scan crashed: {exc}")
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
    finally:
        if lock_acquired:
            try:
                await _firestore_patch(
                    "system_settings", "discovery",
                    {
                        "isRunning": {"booleanValue": False},
                        "lastScanAt": {"timestampValue": datetime.now(timezone.utc).isoformat()},
                    },
                    token,
                )
                print("[DISCOVERY] Lock released.")
            except Exception as release_err:
                print(f"[DISCOVERY] Failed to release lock: {release_err}")
