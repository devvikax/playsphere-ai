"""
Venue ranking algorithm — Python port of backend/ai/ranking.ts
Implements weighted multi-criteria scoring for venue matching.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional


@dataclass
class RankingCriteria:
    sport: Optional[str] = None
    area: Optional[str] = None
    max_price: Optional[float] = None
    skill_level: Optional[str] = None
    preferred_time: Optional[str] = None
    near_landmark: Optional[str] = None
    venue_name: Optional[str] = None


@dataclass
class RankedVenue:
    venue: dict
    score: int
    score_breakdown: dict
    explanation: str


def rank_venues(venues: list[dict], criteria: RankingCriteria) -> list[RankedVenue]:
    """
    Rank venues by weighted criteria matching. Returns sorted list (highest score first).
    Scoring weights:
      - Skill compatibility: 30%
      - Budget:              25%
      - Location/area:       25%
      - Rating:              10%
      - Availability:        10%
    Plus locality boost (0–25 pts) and marketplace priority boost (0–20 pts).
    """
    ranked = []

    for v in venues:
        # 1. Skill Compatibility Score (30%)
        skill_score = 1.0
        if criteria.skill_level:
            v_skill = v.get("skillLevel", "all")
            if v_skill == "all":
                skill_score = 0.8
            elif v_skill.lower() == criteria.skill_level.lower():
                skill_score = 1.0
            else:
                skill_score = 0.2

        # 2. Budget Score (25%)
        price_score = 1.0
        if criteria.max_price is not None:
            v_price = v.get("price", 0)
            if v_price <= criteria.max_price:
                price_score = 1.0
            elif v_price <= criteria.max_price * 1.2:
                price_score = 0.6
            else:
                price_score = 0.1

        # 3. Location / Area Match (25%)
        location_score = 1.0
        query_venue_name = (criteria.venue_name or "").lower()
        query_area = (criteria.area or "").lower()
        query_landmark = (criteria.near_landmark or "").lower()
        venue_area = v.get("area", "").lower()
        venue_name = v.get("name", "").lower()
        venue_desc = v.get("description", "").lower()

        if query_venue_name or query_area or query_landmark:
            stop_words = {"sports", "complex", "arena", "center", "park", "turf", "field"}
            query_words = [
                w for w in query_venue_name.split()
                if len(w) >= 3 and w not in stop_words
            ]
            has_word_match = bool(query_words) and any(w in venue_name for w in query_words)

            if query_venue_name and (
                query_venue_name in venue_name
                or venue_name in query_venue_name
                or has_word_match
            ):
                location_score = 3.0
            elif (
                venue_area == query_area
                or (query_landmark and (
                    query_landmark in venue_name
                    or query_landmark in venue_desc
                    or query_landmark in venue_area
                ))
            ):
                location_score = 1.0
            elif query_area and (query_area in venue_area or venue_area in query_area):
                location_score = 0.8
            else:
                location_score = 0.1

        # 4. Rating Score (10%)
        rating_score = (v.get("rating") or 4.0) / 5.0

        # 5. Availability Score (10%)
        availability_score = 1.0 if v.get("available") else 0.0

        # 6. Locality-Aware Proximity Boost
        locality_boost = 0
        if query_area and venue_area == query_area:
            locality_boost = 25
        elif query_landmark and (
            query_landmark in venue_name
            or query_landmark in venue_desc
            or query_landmark in venue_area
        ):
            locality_boost = 20
        elif query_area and (query_area in venue_area or venue_area in query_area):
            locality_boost = 15

        # 7. Infrastructure vs Marketplace Priority Boost
        is_infra = v.get("category") == "infrastructure"
        is_verified_infra = is_infra and (
            v.get("ownerLinked") is True or v.get("ownershipStatus") == "approved"
        )

        if is_infra:
            priority_boost = 10 if is_verified_infra else 0
        else:
            priority_boost = 20

        # Calculate weighted total score
        total_score = round(
            (skill_score * 0.3
             + price_score * 0.25
             + location_score * 0.25
             + rating_score * 0.1
             + availability_score * 0.1) * 100
        ) + priority_boost + locality_boost

        target_location = criteria.near_landmark or criteria.area or v.get("area", "")
        explanation = (
            f"Recommended because it is closest to {target_location}, "
            f"is currently bookable, fits your ₹{v.get('price', 0)} budget, "
            f"and supports {v.get('sport', '')}."
        )

        ranked.append(RankedVenue(
            venue=v,
            score=total_score,
            score_breakdown={
                "skillScore": skill_score,
                "priceScore": price_score,
                "locationScore": location_score,
                "ratingScore": rating_score,
                "availabilityScore": availability_score,
            },
            explanation=explanation,
        ))

    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked
