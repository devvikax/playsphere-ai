"""
Firestore data access layer — Python equivalent of backend/firebase/firestore.ts.
All functions are synchronous (Firestore Admin SDK is sync in Python).
Real-time listeners (onSnapshot) are intentionally omitted — they stay in
the Next.js client using the Firebase JS SDK.
"""
from __future__ import annotations

import os
import random
import string
from datetime import datetime, timezone
from typing import Any, Optional

from google.cloud.firestore_v1 import FieldFilter
from google.cloud.firestore_v1.base_query import BaseQuery

from firebase_service.client import get_firestore_client
from shared.pricing import is_slot_in_past
from shared.ticket import generate_ticket_id

# ── Helpers ───────────────────────────────────────────────────────────────────

def _db():
    return get_firestore_client()


def _doc_to_dict(doc) -> dict:
    """Convert a Firestore document snapshot to a plain dict including its id."""
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def _serialize_timestamps(data: Any) -> Any:
    """Recursively convert Firestore DatetimeWithNanoseconds → ISO strings."""
    if data is None:
        return data
    if isinstance(data, datetime):
        return data.isoformat()
    if isinstance(data, dict):
        return {k: _serialize_timestamps(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_serialize_timestamps(item) for item in data]
    # google.cloud.firestore DatetimeWithNanoseconds is a datetime subclass, handled above
    return data


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── VENUES ───────────────────────────────────────────────────────────────────

def get_all_venues() -> list[dict]:
    docs = _db().collection("venues").stream()
    return [_doc_to_dict(d) for d in docs]


def get_approved_venues() -> list[dict]:
    q = _db().collection("venues").where(filter=FieldFilter("available", "==", True))
    docs = q.stream()
    venues = [_doc_to_dict(d) for d in docs]
    return [v for v in venues if v.get("ownerId") != "system" and v.get("approvalStatus") == "approved"]


def get_venue_by_id(venue_id: str) -> Optional[dict]:
    doc = _db().collection("venues").document(venue_id).get()
    return _doc_to_dict(doc) if doc.exists else None


def get_filtered_venues(filters: dict) -> list[dict]:
    q: Any = _db().collection("venues")

    if filters.get("sport"):
        q = q.where(filter=FieldFilter("sport", "==", filters["sport"]))
    if filters.get("area"):
        q = q.where(filter=FieldFilter("area", "==", filters["area"]))
    if filters.get("skillLevel"):
        q = q.where(filter=FieldFilter("skillLevel", "in", [filters["skillLevel"], "all"]))

    venues = [_doc_to_dict(d) for d in q.stream()]

    if filters.get("maxPrice") is not None:
        venues = [v for v in venues if v.get("price", 0) <= filters["maxPrice"]]
    if filters.get("minPrice") is not None:
        venues = [v for v in venues if v.get("price", 0) >= filters["minPrice"]]
    if filters.get("minRating") is not None:
        venues = [v for v in venues if v.get("rating", 0) >= filters["minRating"]]
    if filters.get("searchQuery"):
        sq = filters["searchQuery"].lower()
        venues = [
            v for v in venues
            if sq in v.get("name", "").lower()
            or sq in v.get("area", "").lower()
            or sq in v.get("description", "").lower()
        ]

    return [
        v for v in venues
        if v.get("ownerId") != "system"
        and v.get("approvalStatus") == "approved"
        and v.get("available") is True
    ]


def get_owner_venues(owner_id: str) -> list[dict]:
    q = _db().collection("venues").where(filter=FieldFilter("ownerId", "==", owner_id))
    return [_doc_to_dict(d) for d in q.stream()]


def add_venue(venue: dict) -> str:
    db = _db()
    owner_name = "System"
    if venue.get("ownerId") and venue["ownerId"] != "system":
        profile = get_user_profile(venue["ownerId"])
        if profile:
            owner_name = profile.get("displayName", "System")

    venue_data = {
        **venue,
        "ownerName": owner_name,
        "venueName": venue.get("name"),
        "sportType": venue.get("sport"),
        "location": venue.get("address") or venue.get("area"),
        "status": "active" if venue.get("available") else "inactive",
        "createdAt": datetime.now(timezone.utc),
    }
    _, ref = db.collection("venues").add(venue_data)
    return ref.id


def update_venue(venue_id: str, data: dict) -> None:
    updates = dict(data)
    if data.get("name"):
        updates["venueName"] = data["name"]
    if data.get("sport"):
        updates["sportType"] = data["sport"]
    if data.get("address") or data.get("area"):
        updates["location"] = data.get("address") or data.get("area")
    if "available" in data:
        updates["status"] = "active" if data["available"] else "inactive"
    _db().collection("venues").document(venue_id).update(updates)


def delete_venue(venue_id: str) -> None:
    _db().collection("venues").document(venue_id).delete()


# ── BOOKINGS ─────────────────────────────────────────────────────────────────

def get_user_bookings(user_id: str) -> list[dict]:
    q = (
        _db().collection("bookings")
        .where(filter=FieldFilter("userId", "==", user_id))
        .order_by("createdAt", direction="DESCENDING")
    )
    return [_doc_to_dict(d) for d in q.stream()]


def create_booking(booking: dict) -> str:
    if is_slot_in_past(booking["date"], booking["slot"]):
        raise ValueError("This slot has already passed.")

    db = _db()
    ref = db.collection("bookings").document()
    booking_id = ref.id
    booking_data = {
        **booking,
        "bookingId": booking_id,
        "id": booking_id,
        "userId": booking.get("playerId") or booking.get("userId"),
        "playerId": booking.get("playerId") or booking.get("userId"),
        "amount": booking.get("amount") or booking.get("price", 0),
        "price": booking.get("amount") or booking.get("price", 0),
        "paymentStatus": "payment_pending",
        "bookingStatus": "pending",
        "status": "pending",
        "utrNumber": "",
        "screenshotUrl": "",
        "ticketId": "",
        "ticketNumber": "",
        "createdAt": datetime.now(timezone.utc),
    }
    # Override status fields if explicitly provided (e.g., test suite creates cancelled bookings)
    if booking.get("bookingStatus"):
        booking_data["bookingStatus"] = booking["bookingStatus"]
        booking_data["status"] = booking["bookingStatus"]

    ref.set(booking_data)
    return booking_id


def submit_payment_proof(booking_id: str, utr_number: str, screenshot_url: str) -> None:
    _db().collection("bookings").document(booking_id).update({
        "paymentStatus": "verification_pending",
        "utrNumber": utr_number,
        "screenshotUrl": screenshot_url,
    })


def approve_payment(booking_id: str) -> None:
    doc = _db().collection("bookings").document(booking_id).get()
    if not doc.exists:
        raise ValueError("Booking not found")
    booking = doc.to_dict()
    ticket_id = generate_ticket_id(booking.get("sport", ""))
    _db().collection("bookings").document(booking_id).update({
        "paymentStatus": "paid",
        "bookingStatus": "confirmed",
        "status": "confirmed",
        "ticketId": ticket_id,
        "ticketNumber": ticket_id,
    })


def reject_payment(booking_id: str) -> None:
    _db().collection("bookings").document(booking_id).update({
        "paymentStatus": "rejected",
        "bookingStatus": "pending",
        "status": "pending",
    })


def cancel_booking(booking_id: str) -> None:
    ref = _db().collection("bookings").document(booking_id)
    doc = ref.get()
    if doc.exists:
        data = doc.to_dict() or {}
        is_paid = data.get("paymentStatus") == "paid"
        ref.update({
            "bookingStatus": "cancelled",
            "status": "cancelled",
            "paymentStatus": "refund_pending" if is_paid else data.get("paymentStatus", "cancelled"),
        })
    else:
        ref.update({"bookingStatus": "cancelled", "status": "cancelled"})


def get_booking_by_id(booking_id: str) -> Optional[dict]:
    doc = _db().collection("bookings").document(booking_id).get()
    return _doc_to_dict(doc) if doc.exists else None


def get_venue_bookings(venue_id: str, date: str) -> list[dict]:
    q = (
        _db().collection("bookings")
        .where(filter=FieldFilter("venueId", "==", venue_id))
        .where(filter=FieldFilter("date", "==", date))
    )
    bookings = [_doc_to_dict(d) for d in q.stream()]
    return [b for b in bookings if b.get("status") != "cancelled" and b.get("bookingStatus") != "cancelled"]


def check_slot_availability(venue_id: str, date: str, slot: str) -> bool:
    if is_slot_in_past(date, slot):
        return False
    bookings = get_venue_bookings(venue_id, date)
    return not any(b.get("slot") == slot for b in bookings)


def get_all_bookings() -> list[dict]:
    q = _db().collection("bookings").order_by("createdAt", direction="DESCENDING")
    return [_doc_to_dict(d) for d in q.stream()]


def get_venue_bookings_for_owner(venue_ids: list[str]) -> list[dict]:
    if not venue_ids:
        return []
    results = []
    for i in range(0, len(venue_ids), 30):
        chunk = venue_ids[i:i + 30]
        q = (
            _db().collection("bookings")
            .where(filter=FieldFilter("venueId", "in", chunk))
            .order_by("createdAt", direction="DESCENDING")
        )
        results.extend([_doc_to_dict(d) for d in q.stream()])
    return results


# ── USERS ─────────────────────────────────────────────────────────────────────

def get_user_profile(uid: str) -> Optional[dict]:
    doc = _db().collection("users").document(uid).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["uid"] = doc.id
    return data


def update_user_profile(uid: str, data: dict) -> None:
    _db().collection("users").document(uid).update(data)


def get_all_users() -> list[dict]:
    docs = _db().collection("users").stream()
    result = []
    for d in docs:
        data = d.to_dict() or {}
        data["uid"] = d.id
        result.append(data)
    return result


def update_owner_approval(uid: str, status: str) -> None:
    _db().collection("users").document(uid).update({"approvalStatus": status})


def get_users_by_role(role: str) -> list[dict]:
    q = _db().collection("users").where(filter=FieldFilter("role", "==", role))
    result = []
    for d in q.stream():
        data = d.to_dict() or {}
        data["uid"] = d.id
        result.append(data)
    return result


# ── SAVED VENUES ──────────────────────────────────────────────────────────────

def toggle_saved_venue(user_id: str, venue_id: str, is_saved: bool) -> None:
    from google.cloud.firestore_v1 import ArrayUnion, ArrayRemove
    ref = _db().collection("users").document(user_id)
    if is_saved:
        ref.update({"savedVenues": ArrayRemove([venue_id])})
    else:
        ref.update({"savedVenues": ArrayUnion([venue_id])})


def get_venues_by_ids(ids: list[str]) -> list[dict]:
    if not ids:
        return []
    results = []
    for vid in ids:
        doc = _db().collection("venues").document(vid).get()
        if doc.exists:
            results.append(_doc_to_dict(doc))
    return results


# ── LANDMARKS ─────────────────────────────────────────────────────────────────

def get_landmarks() -> list[dict]:
    return [_doc_to_dict(d) for d in _db().collection("landmarks").stream()]


# ── INFRASTRUCTURE ────────────────────────────────────────────────────────────

def get_infrastructure() -> list[dict]:
    return [_doc_to_dict(d) for d in _db().collection("infrastructure").stream()]


def get_infrastructure_by_id(infra_id: str) -> Optional[dict]:
    doc = _db().collection("infrastructure").document(infra_id).get()
    return _doc_to_dict(doc) if doc.exists else None


def get_infrastructure_by_venue_code(venue_code: str) -> Optional[dict]:
    q = _db().collection("infrastructure").where(filter=FieldFilter("venueCode", "==", venue_code))
    docs = list(q.stream())
    return _doc_to_dict(docs[0]) if docs else None


def get_unverified_infrastructure() -> list[dict]:
    q = _db().collection("infrastructure").where(filter=FieldFilter("ownerLinked", "==", False))
    return [_doc_to_dict(d) for d in q.stream()]


def upsert_infrastructure(item: dict) -> dict:
    """
    Insert or update an infrastructure record.
    Matches by name + area + sport to detect duplicates.
    Returns {'action': 'added'|'updated', 'id': str}
    """
    db = _db()
    col = db.collection("infrastructure")

    # Try to find existing record by name + area
    q = (
        col
        .where(filter=FieldFilter("name", "==", item["name"]))
        .where(filter=FieldFilter("area", "==", item["area"]))
    )
    existing = list(q.stream())

    if existing:
        doc = existing[0]
        # Only update metadata fields — never overwrite ownership fields
        update_data = {}
        for field in ["imageUrl", "rating", "reviewCount", "description", "amenities", "placeId", "osmId", "source"]:
            if field in item:
                update_data[field] = item[field]
        if update_data:
            doc.reference.update(update_data)
        return {"action": "updated", "id": doc.id}

    # Insert new record
    _, ref = col.add({
        **item,
        "createdAt": datetime.now(timezone.utc),
    })
    return {"action": "added", "id": ref.id}


def generate_venue_code(sport: str) -> str:
    prefixes = {"badminton": "BAD", "football": "FTB", "swimming": "SWM", "kabaddi": "KBD"}
    code = prefixes.get(sport.lower(), "SPT")
    rand = random.randint(1000, 9999)
    return f"PS-LKO-{code}-{rand}"


# ── OWNERSHIP REQUESTS ────────────────────────────────────────────────────────

def submit_ownership_request(request_data: dict) -> str:
    db = _db()

    # A. Validate infrastructure exists
    infra_doc = db.collection("infrastructure").document(request_data["infrastructureId"]).get()
    if not infra_doc.exists:
        raise ValueError("Infrastructure record not found")
    infra_data = infra_doc.to_dict() or {}

    # B. Reject if already verified
    if infra_data.get("ownerLinked") is True:
        raise ValueError("This venue is already verified by an owner.")

    # C. Check for pending request on same venueCode
    requests_col = db.collection("ownership_requests")
    q_code = (
        requests_col
        .where(filter=FieldFilter("venueCode", "==", request_data["venueCode"]))
        .where(filter=FieldFilter("status", "==", "pending"))
    )
    if list(q_code.stream()):
        raise ValueError("Ownership verification already pending.")

    # D. Prevent duplicate by same owner
    q_owner = (
        requests_col
        .where(filter=FieldFilter("ownerId", "==", request_data["ownerId"]))
        .where(filter=FieldFilter("venueCode", "==", request_data["venueCode"]))
        .where(filter=FieldFilter("status", "==", "pending"))
    )
    if list(q_owner.stream()):
        raise ValueError("You already have a pending verification request for this venue.")

    _, ref = requests_col.add({
        **request_data,
        "status": "pending",
        "createdAt": datetime.now(timezone.utc),
    })
    return ref.id


def approve_ownership_request(request_id: str) -> None:
    db = _db()
    request_ref = db.collection("ownership_requests").document(request_id)
    request_snap = request_ref.get()
    if not request_snap.exists:
        raise ValueError("Ownership request not found")

    req_data = request_snap.to_dict() or {}
    if req_data.get("status") != "pending":
        raise ValueError(f"Request is already in state: {req_data.get('status')}")

    # 1. Update request status
    request_ref.update({"status": "approved"})

    # 2. Update infrastructure record
    infra_ref = db.collection("infrastructure").document(req_data["infrastructureId"])
    infra_snap = infra_ref.get()
    if not infra_snap.exists:
        raise ValueError("Infrastructure record not found")
    infra_data = infra_snap.to_dict() or {}

    infra_ref.update({
        "ownershipStatus": "approved",
        "linkedOwnerId": req_data["ownerId"],
        "ownershipVerifiedAt": datetime.now(timezone.utc),
        "ownerLinked": True,
        "bookable": True,
        "ownerId": req_data["ownerId"],
    })

    # 3. Fetch owner name
    owner_name = req_data.get("ownerName", "Venue Owner")
    profile = get_user_profile(req_data["ownerId"])
    if profile:
        owner_name = profile.get("displayName", owner_name)

    # 4. Create marketplace venue
    venue_data = {
        "name": infra_data.get("name"),
        "sport": infra_data.get("sport"),
        "area": infra_data.get("area"),
        "address": f"{infra_data.get('name')}, {infra_data.get('area')}, Lucknow",
        "coordinates": infra_data.get("coordinates"),
        "price": 250,
        "rating": infra_data.get("rating", 4.5),
        "reviewCount": infra_data.get("reviewCount", 1),
        "amenities": infra_data.get("amenities", ["Parking", "Drinking Water", "Restrooms"]),
        "skillLevel": "all",
        "timings": {"open": "06:00", "close": "22:00"},
        "description": infra_data.get("description", f"Owner-managed facility: {infra_data.get('name')}"),
        "imageUrl": infra_data.get("imageUrl", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"),
        "category": "sports",
        "peakPricing": {"morning": 250, "afternoon": 212, "evening": 325},
        "available": True,
        "ownerId": req_data["ownerId"],
        "ownerName": owner_name,
        "source": "owner",
        "approvalStatus": "approved",
        "status": "active",
        "createdAt": datetime.now(timezone.utc),
    }
    db.collection("venues").add(venue_data)


def reject_ownership_request(request_id: str) -> None:
    db = _db()
    request_ref = db.collection("ownership_requests").document(request_id)
    request_snap = request_ref.get()
    if not request_snap.exists:
        raise ValueError("Ownership request not found")

    req_data = request_snap.to_dict() or {}
    request_ref.update({"status": "rejected"})

    infra_ref = db.collection("infrastructure").document(req_data["infrastructureId"])
    infra_ref.update({
        "ownershipStatus": None,
        "linkedOwnerId": None,
        "ownershipVerifiedAt": None,
        "ownerLinked": False,
        "bookable": False,
        "ownerId": None,
    })


def get_ownership_request_by_venue_code(venue_code: str) -> Optional[dict]:
    q = _db().collection("ownership_requests").where(filter=FieldFilter("venueCode", "==", venue_code))
    docs = [_doc_to_dict(d) for d in q.stream()]
    if not docs:
        return None
    docs.sort(key=lambda d: d.get("createdAt") or "", reverse=True)
    return docs[0]


# ── SEEDING ───────────────────────────────────────────────────────────────────

def seed_landmarks_and_infrastructure() -> None:
    """Seed default landmarks and infrastructure if collections are empty."""
    db = _db()

    # 1. Seed landmarks
    landmark_col = db.collection("landmarks")
    if not list(landmark_col.limit(1).stream()):
        defaults = [
            {"name": "Lohia Park", "area": "Gomti Nagar", "latitude": 26.8529, "longitude": 80.9829, "sportsRelevance": ["running", "walking", "badminton", "yoga"]},
            {"name": "SAI Lucknow Center", "area": "Kanpur Road", "latitude": 26.7456, "longitude": 80.8719, "sportsRelevance": ["athletics", "football", "hockey", "swimming", "badminton"]},
            {"name": "K.D. Singh Babu Stadium", "area": "Hazratganj", "latitude": 26.8576, "longitude": 80.9402, "sportsRelevance": ["cricket", "football", "swimming", "tennis"]},
            {"name": "Ekana Stadium", "area": "Sultanpur Road", "latitude": 26.8122, "longitude": 81.0142, "sportsRelevance": ["cricket", "football", "tennis"]},
            {"name": "Janeshwar Mishra Park", "area": "Gomti Nagar Extension", "latitude": 26.8328, "longitude": 80.9998, "sportsRelevance": ["football", "cycling", "cricket"]},
            {"name": "Chinhat Bazar", "area": "Chinhat", "latitude": 26.8864, "longitude": 81.0454, "sportsRelevance": ["cricket", "football"]},
            {"name": "SAI Complex Aliganj", "area": "Aliganj", "latitude": 26.8923, "longitude": 80.9405, "sportsRelevance": ["badminton", "table tennis", "basketball"]},
        ]
        for d in defaults:
            landmark_col.add(d)

    # 2. Seed infrastructure
    infra_col = db.collection("infrastructure")
    if not list(infra_col.limit(1).stream()):
        defaults = [
            {
                "name": "Lohia Park Sports Area",
                "sport": "badminton", "area": "Gomti Nagar",
                "coordinates": {"lat": 26.8529, "lng": 80.9829},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "park",
                "imageUrl": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
                "description": "Public open-air badminton courts and jogging tracks inside Dr. Ram Manohar Lohia Park, Gomti Nagar.",
                "rating": 4.2, "reviewCount": 15,
                "amenities": ["Jogging Track", "Open Gym", "Public Restrooms"],
                "venueCode": "PS-LKO-BAD-1043", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "SAI Lucknow Sports Complex",
                "sport": "football", "area": "Kanpur Road",
                "coordinates": {"lat": 26.7456, "lng": 80.8719},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "government",
                "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
                "description": "Sports Authority of India (SAI) training facility in Lucknow, offering national-grade football turfs.",
                "rating": 4.6, "reviewCount": 48,
                "amenities": ["Locker Rooms", "Professional Coaches", "Parking", "First Aid"],
                "venueCode": "PS-LKO-FTB-2012", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "Aliganj Swimming Center",
                "sport": "swimming", "area": "Aliganj",
                "coordinates": {"lat": 26.8923, "lng": 80.9405},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "government",
                "imageUrl": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
                "description": "SAI Complex Aliganj swimming pool with national-grade infrastructure.",
                "rating": 4.4, "reviewCount": 32,
                "amenities": ["Olympic Pool", "Locker Rooms", "Coach", "First Aid"],
                "venueCode": "PS-LKO-SWM-3001", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "Hazratganj Kabaddi Akhara",
                "sport": "kabaddi", "area": "Hazratganj",
                "coordinates": {"lat": 26.8576, "lng": 80.9402},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "akhara",
                "imageUrl": "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
                "description": "Traditional Kabaddi akhara near K.D. Singh Babu Stadium.",
                "rating": 4.0, "reviewCount": 18,
                "amenities": ["Soil Arena", "Changing Room", "Drinking Water"],
                "venueCode": "PS-LKO-KBD-4001", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "Ekana Sports Arena",
                "sport": "football", "area": "Sultanpur Road",
                "coordinates": {"lat": 26.8122, "lng": 81.0142},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "government",
                "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
                "description": "Practice grounds adjacent to Ekana Cricket Stadium for football and athletics.",
                "rating": 4.3, "reviewCount": 21,
                "amenities": ["Floodlights", "Parking", "Canteen", "First Aid"],
                "venueCode": "PS-LKO-FTB-2014", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "Gomti Nagar Badminton Hall",
                "sport": "badminton", "area": "Gomti Nagar",
                "coordinates": {"lat": 26.8529, "lng": 80.9850},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "private",
                "imageUrl": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
                "description": "Indoor badminton facility in Gomti Nagar with 4 synthetic courts.",
                "rating": 4.1, "reviewCount": 11,
                "amenities": ["Indoor Courts", "Equipment Rental", "Parking"],
                "venueCode": "PS-LKO-BAD-1044", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
            {
                "name": "Chinhat Sports Complex",
                "sport": "football", "area": "Chinhat",
                "coordinates": {"lat": 26.8864, "lng": 81.0454},
                "source": "mapped", "verified": True, "bookable": False,
                "ownerLinked": False, "ownerId": None, "infrastructureType": "public",
                "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
                "description": "Community sports complex in Chinhat with football grounds and running track.",
                "rating": 3.9, "reviewCount": 8,
                "amenities": ["Football Ground", "Running Track", "Open Gym"],
                "venueCode": "PS-LKO-FTB-2013", "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
            },
        ]
        for d in defaults:
            infra_col.add(d)
