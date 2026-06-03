"""
OpenStreetMap Overpass API discovery — Python port of backend/ai/osm-discovery.ts
Fetches sports infrastructure in Lucknow bounding box, normalizes and filters results.
"""
from __future__ import annotations
import math
import httpx

# ── Area mapping ──────────────────────────────────────────────────────────────
_AREAS = [
    {"name": "Gomti Nagar",   "lat": 26.8540, "lng": 80.9910},
    {"name": "Aliganj",       "lat": 26.8980, "lng": 80.9380},
    {"name": "Hazratganj",    "lat": 26.8610, "lng": 80.9450},
    {"name": "Chinhat",       "lat": 26.8900, "lng": 81.0500},
    {"name": "Indira Nagar",  "lat": 26.8850, "lng": 80.9980},
    {"name": "Mahanagar",     "lat": 26.8770, "lng": 80.9540},
    {"name": "Chowk",         "lat": 26.8650, "lng": 80.8990},
    {"name": "Jankipuram",    "lat": 26.9300, "lng": 80.9500},
    {"name": "Ashiyana",      "lat": 26.7900, "lng": 80.9200},
    {"name": "Charbagh",      "lat": 26.8300, "lng": 80.9200},
]

# Fallback dataset used when Overpass API is unreachable
_FALLBACK_OSM_RAW = [
    {"type": "node", "id": 100001, "lat": 26.8530, "lon": 80.9410,
     "tags": {"name": "K.D. Singh Babu Stadium", "leisure": "stadium", "sport": "cricket", "operator": "Government of UP", "opening_hours": "06:00-20:00"}},
    {"type": "node", "id": 100002, "lat": 26.8670, "lon": 80.8980,
     "tags": {"name": "Chowk Sports Stadium", "leisure": "stadium", "sport": "football", "operator": "Lucknow Sports Council"}},
    {"type": "way",  "id": 100003, "center": {"lat": 26.8110, "lon": 81.0190},
     "tags": {"name": "Ekana Sports Complex", "leisure": "sports_centre", "sport": "badminton"}},
    {"type": "node", "id": 100004, "lat": 26.8550, "lon": 80.9920,
     "tags": {"name": "Gomti Nagar Sports Academy", "leisure": "sports_centre", "sport": "tennis"}},
    {"type": "node", "id": 100005, "lat": 26.8975, "lon": 80.9390,
     "tags": {"name": "Aliganj Sports Club", "leisure": "pitch", "sport": "basketball"}},
    {"type": "node", "id": 100006, "lat": 26.8990, "lon": 80.9370,
     "tags": {"name": "LDA Stadium Aliganj", "leisure": "stadium"}},
    {"type": "node", "id": 100007, "lat": 26.8860, "lon": 80.9990,
     "tags": {"name": "Indira Nagar Squash Courts", "building": "sports_hall"}},
    {"type": "way",  "id": 100008, "center": {"lat": 26.8780, "lon": 80.9550},
     "tags": {"name": "Mahanagar Play Turf", "leisure": "pitch"}},
    {"type": "node", "id": 100009, "lat": 26.9310, "lon": 80.9510,
     "tags": {"name": "Jankipuram Badminton Academy", "leisure": "sports_centre", "sport": "badminton"}},
    {"type": "node", "id": 100010, "lat": 26.8310, "lon": 80.9210,
     "tags": {"name": "Charbagh Railway Stadium", "leisure": "stadium", "sport": "football"}},
    {"type": "node", "id": 100011, "lat": 26.7910, "lon": 80.9210,
     "tags": {"name": "Ashiyana Sports Complex", "leisure": "sports_centre", "sport": "swimming"}},
    {"type": "node", "id": 100012, "lat": 26.8545, "lon": 80.9930,
     "tags": {"name": "Gomti Nagar Swimming Academy", "amenity": "swimming_pool"}},
    {"type": "node", "id": 100013, "lat": 26.8615, "lon": 80.9460,
     "tags": {"name": "Hazratganj Kabaddi Academy", "leisure": "pitch", "sport": "kabaddi"}},
    {"type": "node", "id": 100014, "lat": 26.8910, "lon": 81.0510,
     "tags": {"name": "Chinhat Turf Club", "leisure": "pitch", "sport": "football"}},
    {"type": "node", "id": 100015, "lat": 26.9320, "lon": 80.9520,
     "tags": {"name": "Sahara States Complex", "leisure": "sports_centre", "sport": "basketball"}},
    # Junk elements (should be rejected)
    {"type": "node", "id": 900001, "lat": 26.8520, "lon": 80.9400,
     "tags": {"name": "", "leisure": "pitch", "sport": "cricket"}},
    {"type": "node", "id": 900002, "tags": {"name": "Broken Geometry Arena", "leisure": "stadium"}},
    {"type": "node", "id": 900003, "lat": 0, "lon": 0,
     "tags": {"name": "Null Island Sports", "leisure": "sports_centre"}},
    {"type": "node", "id": 900004, "lat": 26.8500, "lon": 80.9850,
     "tags": {"name": "Sector G Public Lawn", "leisure": "park"}},
    {"type": "node", "id": 900005, "lat": 26.8600, "lon": 80.9400,
     "tags": {"leisure": "playground"}},
]


def _get_lucknow_area(lat: float, lng: float, tags: dict) -> str:
    if tags.get("addr:suburb"):
        return tags["addr:suburb"]
    if tags.get("addr:neighbourhood"):
        return tags["addr:neighbourhood"]

    closest = _AREAS[0]
    min_d = float("inf")
    for a in _AREAS:
        d = math.hypot(a["lat"] - lat, a["lng"] - lng)
        if d < min_d:
            min_d = d
            closest = a

    return closest["name"] if min_d < 0.08 else "Lucknow"


def _infer_sport(tags: dict, name: str) -> str:
    sport_tag = (tags.get("sport") or "").lower()
    if "badminton" in sport_tag:
        return "badminton"
    if "soccer" in sport_tag or "football" in sport_tag:
        return "football"
    if "swim" in sport_tag or tags.get("leisure") == "swimming_pool" or tags.get("amenity") == "swimming_pool":
        return "swimming"
    if "kabaddi" in sport_tag:
        return "kabaddi"

    lower_name = name.lower()
    if "badminton" in lower_name:
        return "badminton"
    if "football" in lower_name or "soccer" in lower_name:
        return "football"
    if "swimming" in lower_name or "pool" in lower_name:
        return "swimming"
    if "kabaddi" in lower_name:
        return "kabaddi"

    if tags.get("leisure") == "pitch":
        return "football"
    if tags.get("building") == "sports_hall":
        return "badminton"

    return "badminton"  # fallback


def _detect_infra_type(tags: dict, name: str) -> str:
    lower_name = name.lower()
    if "academy" in lower_name or "club" in lower_name or tags.get("access") == "private":
        return "private"
    if "stadium" in lower_name or "complex" in lower_name or "government" in lower_name or tags.get("operator") == "government":
        return "government"
    if "park" in lower_name or tags.get("leisure") == "park":
        return "park"
    return "public"


_OVERPASS_QUERY = """
[out:json][timeout:30];
(
  node["leisure"~"stadium|sports_centre|pitch|track|fitness_centre"](26.60,80.70,27.10,81.20);
  way["leisure"~"stadium|sports_centre|pitch|track|fitness_centre"](26.60,80.70,27.10,81.20);
  relation["leisure"~"stadium|sports_centre|pitch|track|fitness_centre"](26.60,80.70,27.10,81.20);
  node["building"="sports_hall"](26.60,80.70,27.10,81.20);
  way["building"="sports_hall"](26.60,80.70,27.10,81.20);
  node["sport"](26.60,80.70,27.10,81.20);
  way["sport"](26.60,80.70,27.10,81.20);
);
out center;
"""


async def fetch_osm_infrastructure() -> dict:
    """
    Fetches sports infrastructure from OpenStreetMap Overpass API for Lucknow.
    Falls back to a curated dataset if the API is unavailable.
    Returns: { rawFetched: int, normalized: list[dict], rejected: int }
    """
    raw_elements = []

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(35.0)) as client:
            response = await client.post(
                "https://overpass-api.de/api/interpreter",
                content=f"data={_OVERPASS_QUERY}",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if response.is_success:
                data = response.json()
                raw_elements = data.get("elements", [])
            else:
                raise RuntimeError(f"Overpass API returned status: {response.status_code}")
    except Exception as err:
        print(f"[OSM-DISCOVERY] Overpass API failed, using fallback dataset: {err}")
        raw_elements = _FALLBACK_OSM_RAW

    if not raw_elements:
        print("[OSM-DISCOVERY] Overpass returned 0 records. Using fallback dataset.")
        raw_elements = _FALLBACK_OSM_RAW

    raw_fetched = len(raw_elements)
    normalized = []
    rejected = 0

    for el in raw_elements:
        tags = el.get("tags") or {}
        name = (tags.get("name") or "").strip()

        # 1. Reject unnamed
        if not name:
            rejected += 1
            continue

        # 2. Reject missing/invalid coordinates
        lat = el.get("lat")
        lng = el.get("lon")
        if lat is None or lng is None:
            center = el.get("center")
            if center:
                lat = center.get("lat")
                lng = center.get("lon")

        if lat is None or lng is None or lat == 0 or lng == 0:
            rejected += 1
            continue

        # 3. Reject generic parks/playgrounds with no sport indicators
        is_generic = (
            tags.get("leisure") in ("park", "playground")
            and not tags.get("sport")
            and not any(kw in name.lower() for kw in ["sports", "academy", "stadium", "club", "complex", "turf"])
        )
        if is_generic:
            rejected += 1
            continue

        # 4. Build normalized record
        sport = _infer_sport(tags, name)
        area = _get_lucknow_area(lat, lng, tags)
        infra_type = _detect_infra_type(tags, name)
        osm_id = f"{el.get('type')}/{el.get('id')}"

        amenities = []
        if tags.get("lighting") == "yes":
            amenities.append("Lighting")
        if tags.get("changing_rooms") == "yes":
            amenities.append("Changing Rooms")
        if tags.get("parking") == "yes":
            amenities.append("Parking")
        if tags.get("toilets") == "yes":
            amenities.append("Toilets")
        if tags.get("shower") == "yes":
            amenities.append("Showers")

        operator = tags.get("operator") or tags.get("owner") or ""
        description = (
            tags.get("description")
            or f"Discovered via OpenStreetMap: {name} in {area}."
            + (f" Operator: {operator}." if operator else "")
        )

        normalized.append({
            "name": name,
            "sport": sport,
            "area": area,
            "coordinates": {"lat": lat, "lng": lng},
            "source": "osm_discovered",
            "verified": False,
            "bookable": False,
            "ownerLinked": False,
            "ownerId": None,
            "infrastructureType": infra_type,
            "description": description,
            "amenities": amenities if amenities else ["General Access"],
            "osmId": osm_id,
            "ownershipStatus": None,
            "linkedOwnerId": None,
            "ownershipVerifiedAt": None,
        })

    return {
        "rawFetched": raw_fetched,
        "normalized": normalized,
        "rejected": rejected,
    }
