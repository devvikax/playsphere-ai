"""
Infrastructure Discovery orchestrator — Python port of backend/ai/infrastructure-discovery.ts
Combines seed pool + OSM Overpass + optional Google Places enrichment.
"""
from __future__ import annotations
from datetime import datetime
import os
import httpx

from ai.osm_discovery import fetch_osm_infrastructure
from firebase_service.firestore import upsert_infrastructure

# ── Seeded discovery pool (same as TypeScript LUCKNOW_DISCOVERED_POOL) ────────
LUCKNOW_DISCOVERED_POOL = [
    {
        "name": "Gomti Nagar Swimming Pavilion",
        "sport": "swimming", "area": "Gomti Nagar",
        "coordinates": {"lat": 26.8540, "lng": 80.9910},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "public",
        "imageUrl": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
        "description": "Public access swimming facility in Gomti Nagar, offering clean waters and coached sessions.",
        "rating": 4.1, "reviewCount": 9,
        "amenities": ["Shower Rooms", "Lockers", "Trainer"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Chinhat Badminton Center",
        "sport": "badminton", "area": "Chinhat",
        "coordinates": {"lat": 26.8900, "lng": 81.0500},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "private",
        "imageUrl": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
        "description": "Indoor private badminton facility in Chinhat area with synthetic courts.",
        "rating": 3.9, "reviewCount": 7,
        "amenities": ["Parking", "Refreshments"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Aliganj Football Ground",
        "sport": "football", "area": "Aliganj",
        "coordinates": {"lat": 26.8980, "lng": 80.9380},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "public",
        "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
        "description": "Open public football ground in Aliganj for community play and local matches.",
        "rating": 4.0, "reviewCount": 14,
        "amenities": ["Open Access", "Goal Posts"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Hazratganj Kabaddi Academy",
        "sport": "kabaddi", "area": "Hazratganj",
        "coordinates": {"lat": 26.8610, "lng": 80.9450},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "akhara",
        "imageUrl": "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
        "description": "Traditional soil arena and training ground for kabaddi enthusiasts in Hazratganj.",
        "rating": 4.3, "reviewCount": 22,
        "amenities": ["Soil Arena", "Drinking Water", "First Aid"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Janeshwar Mishra Park Swimming Pool",
        "sport": "swimming", "area": "Gomti Nagar Extension",
        "coordinates": {"lat": 26.8350, "lng": 80.9960},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "park",
        "imageUrl": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
        "description": "Outdoor public swimming pool situated inside Janeshwar Mishra Park.",
        "rating": 4.2, "reviewCount": 31,
        "amenities": ["Locker Rooms", "Showers", "Life Guard"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Ekana Badminton Arena",
        "sport": "badminton", "area": "Sultanpur Road",
        "coordinates": {"lat": 26.8100, "lng": 81.0180},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "private",
        "imageUrl": "https://images.unsplash.com/photo-1521537634581-0dccd2ece234?w=800",
        "description": "Premium private indoor badminton courts near Ekana Stadium.",
        "rating": 4.5, "reviewCount": 18,
        "amenities": ["Indoor Courts", "Parking", "AC", "Pro Shop"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
    {
        "name": "Gomti Nagar Kabaddi Turf",
        "sport": "kabaddi", "area": "Gomti Nagar",
        "coordinates": {"lat": 26.8480, "lng": 80.9800},
        "source": "discovered", "verified": True, "bookable": False,
        "ownerLinked": False, "ownerId": None, "infrastructureType": "public",
        "imageUrl": "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800",
        "description": "Community kabaddi play area inside Gomti Nagar public sports complex.",
        "rating": 3.8, "reviewCount": 5,
        "amenities": ["Open Fields", "Seating"],
        "ownershipStatus": None, "linkedOwnerId": None, "ownershipVerifiedAt": None,
    },
]


async def _enrich_with_google(name: str, area: str, api_key: str) -> dict | None:
    """Query Google Places for additional metadata. Returns None on failure."""
    try:
        url = (
            f"https://maps.googleapis.com/maps/api/place/textsearch/json"
            f"?query={name + ', ' + area + ', Lucknow'}&key={api_key}"
        )
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            resp = await client.get(url)
            if not resp.is_success:
                return None
            data = resp.json()
            if data.get("status") == "OK" and data.get("results"):
                match = data["results"][0]
                image_url = None
                if match.get("photos"):
                    ref = match["photos"][0]["photo_reference"]
                    image_url = (
                        f"https://maps.googleapis.com/maps/api/place/photo"
                        f"?maxwidth=800&photoreference={ref}&key={api_key}"
                    )
                return {
                    "formattedAddress": match.get("formatted_address"),
                    "rating": match.get("rating"),
                    "reviewCount": match.get("user_ratings_total"),
                    "imageUrl": image_url,
                    "placeId": match.get("place_id"),
                }
    except Exception as err:
        print(f"[GOOGLE-ENRICHMENT] Failed for '{name}': {err}")
    return None


async def run_infrastructure_discovery() -> dict:
    """
    Main discovery orchestrator:
    1. Fetch from OpenStreetMap Overpass API
    2. Combine with seed pool
    3. Optionally enrich with Google Places
    4. Upsert into Firestore

    Returns {success, added, updated, skipped, enriched, errors, logs, osmFetched, normalized, rejected}
    """
    logs = []
    added = updated = skipped = enriched = errors = osm_fetched = 0

    def log(msg: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        logs.append(f"[{timestamp}] {msg}")
        print(f"[INFRA-DISCOVERY] {msg}")

    log("Starting sports infrastructure discovery for Lucknow...")

    # 1. OSM Overpass
    log("Querying OpenStreetMap Overpass API for sports infrastructure in Lucknow...")
    try:
        osm_result = await fetch_osm_infrastructure()
        osm_fetched = osm_result["rawFetched"]
        normalized_osm = osm_result["normalized"]
        rejected_count = osm_result["rejected"]
        log(f"OSM query complete. Fetched {osm_fetched} candidates (Normalized: {len(normalized_osm)}, Rejected: {rejected_count}).")
    except Exception as err:
        log(f"OSM query failed: {err}. Using seed pool only.")
        normalized_osm = []
        rejected_count = 0

    # 2. Combine
    combined = list(LUCKNOW_DISCOVERED_POOL) + normalized_osm
    log(f"Total candidates: {len(combined)} (Seed: {len(LUCKNOW_DISCOVERED_POOL)}, OSM: {len(normalized_osm)}).")

    # 3. Google enrichment setup
    google_api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    has_google = bool(google_api_key.strip())
    log(f"Google Places enrichment: {'ENABLED' if has_google else 'DISABLED (no API key)'}.")

    enrichment_count = 0
    ENRICHMENT_CAP = 5

    # 4. Ingest each candidate
    for item in combined:
        try:
            enriched_this = False
            if has_google and enrichment_count < ENRICHMENT_CAP:
                log(f"[ENRICH] Querying Google Places for \"{item['name']}\"...")
                enriched_data = await _enrich_with_google(item["name"], item["area"], google_api_key)
                if enriched_data:
                    if enriched_data.get("rating"):
                        item["rating"] = enriched_data["rating"]
                    if enriched_data.get("reviewCount"):
                        item["reviewCount"] = enriched_data["reviewCount"]
                    if enriched_data.get("imageUrl"):
                        item["imageUrl"] = enriched_data["imageUrl"]
                    if enriched_data.get("placeId"):
                        item["placeId"] = enriched_data["placeId"]
                    if enriched_data.get("formattedAddress"):
                        item["description"] = (
                            (item.get("description") or "") + f"\n\nAddress: {enriched_data['formattedAddress']}"
                        )
                    item["source"] = "osm_enriched"
                    enriched_this = True
                    enrichment_count += 1
                    enriched += 1
                    log(f"  -> ENRICHED: {item['name']} (Place ID: {enriched_data.get('placeId')})")
                else:
                    log(f"  -> ENRICH SKIP: No match from Google Places.")

            log(f"Evaluating: \"{item['name']}\" in {item['area']} ({item.get('sport')}) [Source: {item.get('source')}]...")
            res = upsert_infrastructure(item)

            if res["action"] == "added":
                added += 1
                log(f"  -> SUCCESS: Created '{item['name']}' (ID: {res['id']})")
            else:
                updated += 1
                skipped += 1
                status = "Enriched" if enriched_this else "Duplicate Skipped"
                log(f"  -> SKIP (Duplicate): Updated existing '{item['name']}' (ID: {res['id']}) [{status}]")

        except Exception as err:
            errors += 1
            log(f"  -> ERROR: Failed to ingest '{item.get('name')}': {err}")

    log("Discovery cycle completed.")
    log(
        f"Summary: OSM Fetched: {osm_fetched}, Normalized: {len(normalized_osm)}, "
        f"Rejected: {rejected_count}, Added: {added}, Updated: {updated}, "
        f"Skipped: {skipped}, Enriched: {enriched}, Errors: {errors}."
    )

    return {
        "success": True,
        "osmFetched": osm_fetched,
        "normalized": len(normalized_osm),
        "rejected": rejected_count,
        "added": added,
        "updated": updated,
        "skipped": skipped,
        "enriched": enriched,
        "errors": errors,
        "logs": logs,
    }
