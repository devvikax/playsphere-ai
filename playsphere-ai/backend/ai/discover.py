"""
Venue Discovery Insights — Python port of backend/ai/discover.ts
Generates 3 programmatic analytics cards from live Firestore data.
"""
from __future__ import annotations
from firebase_service.firestore import get_all_venues, get_landmarks, get_infrastructure


async def handle_discover_request() -> list[dict]:
    """
    Returns exactly 3 insight dicts matching DiscoverInsight schema:
    { type, title, description, area?, sport?, emoji, urgency }
    """
    venues = get_all_venues()
    landmarks = get_landmarks()
    infra = get_infrastructure()

    active_approved = [
        v for v in venues
        if v.get("available") and v.get("approvalStatus") == "approved"
    ]

    # A. Sport Distribution
    sports = ["badminton", "football", "swimming", "kabaddi"]
    total = len(infra) + len(active_approved)
    sport_percentages: dict[str, int] = {}
    if total > 0:
        for sport in sports:
            count_infra = sum(1 for i in infra if (i.get("sport") or "").lower() == sport)
            count_active = sum(1 for v in active_approved if (v.get("sport") or "").lower() == sport)
            sport_percentages[sport] = round((count_infra + count_active) / total * 100)
    else:
        sport_percentages = {s: 25 for s in sports}

    # B. Area Metrics
    all_areas = set()
    for i in infra:
        if i.get("area"):
            all_areas.add(i["area"])
    for v in active_approved:
        if v.get("area"):
            all_areas.add(v["area"])
    for l in landmarks:
        if l.get("area"):
            all_areas.add(l["area"])

    stats_by_area = []
    for area in all_areas:
        area_infra = [i for i in infra if i.get("area") == area]
        area_active = [v for v in active_approved if v.get("area") == area]
        area_unverified = [i for i in area_infra if not i.get("ownerLinked")]
        stats_by_area.append({
            "area": area,
            "infraCount": len(area_infra),
            "activeCount": len(area_active),
            "unverifiedCount": len(area_unverified),
        })

    # Density: area with largest gap between mapped vs bookable
    density_area = "Gomti Nagar"
    density_mapped = 12
    density_bookable = 4

    density_candidates = [s for s in stats_by_area if s["infraCount"] > 0]
    if density_candidates:
        density_candidates.sort(
            key=lambda s: (s["infraCount"] - s["activeCount"]),
            reverse=True,
        )
        best = density_candidates[0]
        density_area = best["area"]
        density_mapped = best["infraCount"]
        density_bookable = best["activeCount"]
    elif infra:
        density_area = infra[0].get("area", "Gomti Nagar")
        density_mapped = len(infra)
        density_bookable = len(active_approved)

    # C. Infrastructure Proximity Gap based on Landmarks
    gap_landmark = "Lohia Park"
    gap_area = "Gomti Nagar"
    gap_sport = "swimming"
    gap_found = False

    for landmark in landmarks:
        for sport in landmark.get("sportsRelevance", []):
            active_in_area = [
                v for v in active_approved
                if v.get("area", "").lower() == landmark.get("area", "").lower()
                and (v.get("sport") or "").lower() == sport.lower()
            ]
            if not active_in_area:
                gap_landmark = landmark.get("name", gap_landmark)
                gap_area = landmark.get("area", gap_area)
                gap_sport = sport
                gap_found = True
                break
        if gap_found:
            break

    # D. Verification Opportunity
    opp_area = "Chinhat"
    opp_sport = "football"
    opp_count = 3

    unverified_infra = [i for i in infra if not i.get("ownerLinked")]
    unverified_by_area_sport: dict[str, dict[str, int]] = {}
    max_count = 0

    for i in unverified_infra:
        area = i.get("area", "Unknown")
        sport = i.get("sport", "unknown")
        if area not in unverified_by_area_sport:
            unverified_by_area_sport[area] = {}
        unverified_by_area_sport[area][sport] = unverified_by_area_sport[area].get(sport, 0) + 1
        if unverified_by_area_sport[area][sport] > max_count:
            max_count = unverified_by_area_sport[area][sport]
            opp_area = area
            opp_sport = sport
            opp_count = max_count

    if unverified_infra and max_count == 0:
        opp_area = unverified_infra[0].get("area", opp_area)
        opp_sport = unverified_infra[0].get("sport", opp_sport)
        opp_count = 1

    # E. Emoji mapping
    def _sport_emoji(sport: str) -> str:
        return {"swimming": "🏊", "football": "⚽", "badminton": "🏸", "kabaddi": "🤼"}.get(sport, "🏅")

    return [
        {
            "type": "trend",
            "title": f"{density_area} Density",
            "description": f"{density_area} has {density_mapped} mapped facilities but only {density_bookable} verified bookable venues.",
            "area": density_area,
            "emoji": "📊",
            "urgency": "high",
        },
        {
            "type": "gap",
            "title": f"{gap_sport.capitalize()} Gap",
            "description": f"{gap_sport.capitalize()} infrastructure missing near {gap_landmark} in {gap_area}.",
            "area": gap_area,
            "sport": gap_sport,
            "emoji": _sport_emoji(gap_sport),
            "urgency": "high",
        },
        {
            "type": "opportunity",
            "title": f"{opp_area} Claims Open",
            "description": f"{opp_area} contains {opp_count} mapped {opp_sport} facilities with no verified owner.",
            "area": opp_area,
            "sport": opp_sport,
            "emoji": "📈",
            "urgency": "medium",
        },
    ]
