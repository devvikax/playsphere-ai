"""
AI Concierge handler — Python port of backend/ai/concierge.ts
Implements the two-pass agentic discovery workflow.
"""
from __future__ import annotations
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Optional

from ai.llm import call_llm
from ai.ranking import rank_venues, RankingCriteria
from firebase_service.firestore import (
    get_approved_venues,
    get_landmarks,
    get_infrastructure,
    get_venue_bookings,
)
from shared.pricing import generate_time_slots


async def handle_concierge_request(
    message: str,
    history: list[dict],
    mode: str = "discovery",
) -> dict:
    """
    Main concierge handler. Returns:
    {
        'response': str,
        'text': str,
        'cards': list[dict],
        'action': dict | None
    }
    """
    # ── Live Firestore retrieval ──────────────────────────────────────────────
    live_venues = get_approved_venues()
    landmarks = get_landmarks()
    infra = get_infrastructure()

    # ── GUIDANCE MODE ─────────────────────────────────────────────────────────
    if mode == "guidance":
        venue_names = ", ".join(v.get("name", "") for v in live_venues) or "None yet"
        system_prompt = (
            f"You are PlaySphere AI (Guidance Mode) — a sports rules and gear advisor for Lucknow, India.\n"
            "Your focus is to provide lightweight sports tips, basic rules, workout timing advice, and beginner suggestions.\n"
            "- Keep it lightweight. Do NOT create coaching programs, act as a health advisor, medical consultant, or life assistant.\n"
            "- Provide simple rules, gear tips, warm-up habits, and suggestions on the best timing to book slots to save money (afternoon slots are 15% cheaper).\n"
            f"- You can mention that these venues are available in Lucknow if relevant: {venue_names}. Never invent any other sports venues.\n"
            "- All prices are in Indian Rupees (₹).\n"
            "- Start with a brief friendly sports greeting (E.g. \"Hi! I'm PlaySphere AI (Guidance Mode) 🏸\")."
        )
        messages = [{"role": "system", "content": system_prompt}]
        for msg in (history or []):
            messages.append({
                "role": "assistant" if msg.get("role") == "assistant" else "user",
                "content": msg.get("content", ""),
            })
        messages.append({"role": "user", "content": message})
        response_text = await call_llm(messages)
        return {"response": response_text, "text": response_text, "cards": []}

    # ── DISCOVERY / AGENTIC MODE ──────────────────────────────────────────────
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    # Pass 1: Parse intent from user message
    extraction_prompt = (
        "You are an agentic query parsing assistant. Analyze the user's sports query and extract search parameters in Lucknow.\n"
        "Return ONLY a valid JSON object matching the schema below. Do not wrap the JSON in markdown code blocks or add any other text.\n"
        "Schema:\n"
        "{\n"
        '  "sport": string | null,\n'
        '  "location": string | null,\n'
        '  "landmark": string | null,\n'
        '  "venueName": string | null,\n'
        '  "maxPrice": number | null,\n'
        '  "skillLevel": string | null,\n'
        '  "preferredTime": "morning" | "afternoon" | "evening" | null,\n'
        '  "compareMode": boolean,\n'
        '  "timeSlot": string | null,\n'
        '  "bookingIntent": boolean,\n'
        '  "bookingDate": string | null,\n'
        '  "bookingSlot": string | null\n'
        "}\n\n"
        "Examples:\n"
        'Query: "Beginner badminton under 300 near Lohia Park tomorrow evening"\n'
        'JSON: {"sport":"badminton","location":"Gomti Nagar","landmark":"Lohia Park","venueName":null,"maxPrice":300,"skillLevel":"beginner","preferredTime":"evening","compareMode":false,"timeSlot":"tomorrow evening","bookingIntent":false,"bookingDate":null,"bookingSlot":null}\n\n'
        'Query: "I want to book a football turf in Chinhat tomorrow at 6 PM"\n'
        f'JSON: {{"sport":"football","location":"Chinhat","landmark":null,"venueName":null,"maxPrice":null,"skillLevel":null,"preferredTime":"evening","compareMode":false,"timeSlot":"tomorrow at 6 PM","bookingIntent":true,"bookingDate":"{tomorrow_str}","bookingSlot":"18:00–19:00"}}\n\n'
        f'User query: "{message}"\n'
        f"Today's date is: {today_str} (use this to resolve relative bookingDates like 'tomorrow', 'today', etc. to YYYY-MM-DD format).\n"
        "JSON:"
    )

    criteria = RankingCriteria()
    is_compare_mode = False
    time_slot_str = ""
    parsed: dict = {}

    try:
        raw_extraction = await call_llm(
            [
                {"role": "system", "content": "You parse queries to JSON."},
                {"role": "user", "content": extraction_prompt},
            ],
            temperature=0.1,
        )
        cleaned_json = re.sub(r"```json|```", "", raw_extraction).strip()
        parsed = json.loads(cleaned_json)

        criteria = RankingCriteria(
            sport=parsed.get("sport") or None,
            area=parsed.get("location") or None,
            max_price=parsed.get("maxPrice") or None,
            skill_level=parsed.get("skillLevel") or None,
            preferred_time=parsed.get("preferredTime") or None,
            venue_name=parsed.get("venueName") or None,
        )
        is_compare_mode = bool(parsed.get("compareMode"))
        time_slot_str = parsed.get("timeSlot") or ""

        # Landmark resolution
        if parsed.get("landmark") and landmarks:
            lm_query = parsed["landmark"].lower()
            matched = next(
                (l for l in landmarks
                 if lm_query in l.get("name", "").lower()
                 or l.get("name", "").lower() in lm_query),
                None,
            )
            if matched:
                criteria.near_landmark = matched["name"]
                criteria.area = matched["area"]

        # Direct landmark fallback
        if parsed.get("landmark") and not criteria.area:
            lm = parsed["landmark"].lower()
            if "lohia" in lm or "janeshwar" in lm:
                criteria.near_landmark = parsed["landmark"]
                criteria.area = "Gomti Nagar"

    except Exception as err:
        # Heuristic fallback
        lower_msg = message.lower()
        for sport in ["badminton", "football", "swimming", "kabaddi"]:
            if sport in lower_msg:
                criteria.sport = sport
                break
        for area in ["gomti", "chinhat", "aliganj", "hazratganj", "indira"]:
            if area in lower_msg:
                criteria.area = {"gomti": "Gomti Nagar", "indira": "Indira Nagar"}.get(area, area.capitalize())
                break
        if "beginner" in lower_msg:
            criteria.skill_level = "beginner"
        if "advanced" in lower_msg:
            criteria.skill_level = "advanced"
        if "compare" in lower_msg:
            is_compare_mode = True
        if "lohia" in lower_msg:
            criteria.area = "Gomti Nagar"
            criteria.near_landmark = "Lohia Park"
        elif "janeshwar" in lower_msg:
            criteria.area = "Gomti Nagar"
            criteria.near_landmark = "Janeshwar Mishra Park"

    # Merge live venues + infrastructure for discovery
    active_venue_codes = {v.get("venueCode") for v in live_venues if v.get("venueCode")}

    mapped_infra = []
    for i in infra:
        if i.get("venueCode") and i["venueCode"] in active_venue_codes:
            continue
        mapped_infra.append({
            "id": i.get("id"),
            "name": i.get("name"),
            "sport": i.get("sport"),
            "area": i.get("area"),
            "address": f"{i.get('name')}, {i.get('area')}",
            "coordinates": i.get("coordinates"),
            "price": 0,
            "rating": i.get("rating", 0),
            "reviewCount": i.get("reviewCount", 0),
            "amenities": i.get("amenities", []),
            "skillLevel": "all",
            "timings": {"open": "00:00", "close": "00:00"},
            "description": i.get("description", ""),
            "imageUrl": i.get("imageUrl", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"),
            "category": "infrastructure",
            "available": False,
            "ownerId": i.get("ownerId") or "system",
            "source": i.get("source"),
            "approvalStatus": "approved",
            "peakPricing": {"morning": 0, "afternoon": 0, "evening": 0},
            "ownerLinked": i.get("ownerLinked", False),
            "ownershipStatus": i.get("ownershipStatus"),
            "venueCode": i.get("venueCode"),
        })

    all_searchable = live_venues + mapped_infra

    filtered_venues = all_searchable
    if criteria.sport:
        filtered_venues = [
            v for v in all_searchable
            if (v.get("sport") or "").lower() == criteria.sport.lower()
        ]

    ranked = rank_venues(filtered_venues, criteria)

    # ── Agentic Booking Action ────────────────────────────────────────────────
    booking_action = None
    if parsed.get("bookingIntent") and live_venues:
        bookable_filtered = live_venues
        if criteria.sport:
            bookable_filtered = [
                v for v in live_venues
                if (v.get("sport") or "").lower() == criteria.sport.lower()
            ]
        ranked_bookables = rank_venues(bookable_filtered, criteria)
        if ranked_bookables:
            target_venue = ranked_bookables[0].venue
            target_date = parsed.get("bookingDate") or today_str
            try:
                bookings = get_venue_bookings(target_venue["id"], target_date)
                slots = generate_time_slots(
                    target_venue.get("timings", {}).get("open", "06:00"),
                    target_venue.get("timings", {}).get("close", "22:00"),
                    target_venue.get("price", 0),
                    target_date,
                )
                booked_labels = {b.get("slot") for b in bookings}
                available_slots = [s for s in slots if s["label"] not in booked_labels]

                selected_slot = None
                if parsed.get("bookingSlot") and available_slots:
                    clean_slot = re.sub(r"\s+", "", parsed["bookingSlot"]).lower()
                    for s in available_slots:
                        clean_label = re.sub(r"\s+", "", s["label"]).lower()
                        if clean_slot in clean_label or clean_label in clean_slot or clean_slot in s["time"]:
                            selected_slot = s
                            break

                if not selected_slot and criteria.preferred_time and available_slots:
                    selected_slot = next(
                        (s for s in available_slots if s.get("timeOfDay") == criteria.preferred_time),
                        None,
                    )
                if not selected_slot and available_slots:
                    selected_slot = available_slots[0]

                if selected_slot:
                    booking_action = {
                        "type": "book",
                        "venueId": target_venue["id"],
                        "venueName": target_venue["name"],
                        "date": target_date,
                        "slot": selected_slot["label"],
                    }
            except Exception:
                pass

    # ── Smart Compare Mode ────────────────────────────────────────────────────
    comparison_table = ""
    if is_compare_mode and ranked:
        comparison_table = "\n\n### 📊 Structured Comparison Matrix:\n| Venue Name | Location / Area | Type | Base Price | Rating |\n| :--- | :--- | :--- | :--- | :--- |\n"
        for r in ranked[:3]:
            is_inf = r.venue.get("category") == "infrastructure"
            comparison_table += (
                f"| **{r.venue['name']}** | {r.venue.get('area')} | "
                f"{'🏛️ Mapped Infra' if is_inf else '🎫 Bookable Venue'} | "
                f"{'N/A' if is_inf else '₹' + str(r.venue.get('price')) + '/hr'} | "
                f"{'N/A' if is_inf else str(r.venue.get('rating')) + '★'} |\n"
            )

    # ── Slot Recommendations ──────────────────────────────────────────────────
    slot_recommendation = ""
    if ranked:
        top_venue = ranked[0].venue
        peak = top_venue.get("peakPricing")
        if peak and top_venue.get("category") != "infrastructure":
            slot_recommendation = (
                f"\n\n### ⏱️ Slot Availability & Smart Pricing Recommendation for {top_venue['name']}:\n"
                f"- **Best Value (Afternoon)**: ₹{peak.get('afternoon')}/hr (11 AM - 4 PM) [15% Off discount applied]\n"
                f"- **Standard (Morning)**: ₹{peak.get('morning')}/hr (5 AM - 8 AM)\n"
                f"- **Peak Premium (Evening)**: ₹{peak.get('evening')}/hr (5 PM - 10 PM) [30% peak fee applied]\n"
                f"Recommendation: If booking {time_slot_str or 'soon'}, prefer the Afternoon slot to save money!"
            )

    # ── Assemble LLM system prompt ────────────────────────────────────────────
    ranked_facts = "\n".join(
        f"{i + 1}. **{r.venue['name']}** (Score: {r.score}/100) "
        f"[{'🏛️ Mapped Infrastructure - Booking Unavailable' if r.venue.get('category') == 'infrastructure' else '🎫 Marketplace Venue - Bookable'}]"
        f" -> {r.explanation}"
        for i, r in enumerate(ranked[:3])
    ) or "No matching active venues found in Lucknow matching those criteria."

    system_prompt = (
        "You are PlaySphere AI (Discovery Mode) — an expert agentic sports concierge for Lucknow, India.\n"
        "Your objective is to provide venue search, comparisons, slot recommendations, and booking assistance.\n"
        "- You have parsed the user's intent and calculated weighted matching scores for the top venues in real-time.\n"
        "- You must explain recommendations using the calculated matching scores (E.g. \"This facility scored 95/100 because...\") instead of fabricating reasoning.\n"
        "- Provide clear next steps using internal paths (e.g. /venues/[id]) and interactive venue cards rendering below.\n"
        "- Do NOT output any Google Maps links, raw coordinates, or external navigation links.\n\n"
        "### Real-Time Grounded Matches:\n"
        f"{ranked_facts}\n"
        f"{comparison_table}\n"
        f"{slot_recommendation}\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. Recommend ONLY the venues listed in the facts above. If the list is empty, state that honestly.\n"
        "2. Incorporate the computed matching scores and peak pricing recommendation in your response.\n"
        "3. Keep your response structured, recruiter-friendly, and concise. All prices are in Indian Rupees (₹).\n"
        "4. Do not invent any other venues. Lucknow areas include: Gomti Nagar, Chinhat, Aliganj, Hazratganj, Indira Nagar, Chowk.\n"
        "5. NEVER Suggest or output Google Maps links, coordinates, or any external navigation links."
    )

    if booking_action:
        system_prompt += (
            "\n\n### ⚡ PREFILLED BOOKING ACTION ACTIVE:\n"
            "The user explicitly wants to book. We have verified availability and prefilled this action:\n"
            f"- Venue: {booking_action['venueName']} (ID: {booking_action['venueId']})\n"
            f"- Date: {booking_action['date']}\n"
            f"- Slot: {booking_action['slot']}\n\n"
            "You MUST inform the user that you have found and pre-selected this slot for them, "
            "state the price, and tell them they can click the \"Continue Booking\" button below "
            "to pre-fill their booking details for manual confirmation on the booking page."
        )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in (history or []):
        messages.append({
            "role": "assistant" if msg.get("role") == "assistant" else "user",
            "content": msg.get("content", ""),
        })
    messages.append({"role": "user", "content": message})

    response_text = await call_llm(messages)

    # ── Build venue cards ─────────────────────────────────────────────────────
    cards = []
    for r in ranked[:3]:
        is_inf = r.venue.get("category") == "infrastructure"
        ownership_status = r.venue.get("ownershipStatus")
        action = (
            "book" if not is_inf
            else ("view" if ownership_status == "approved" else "verify")
        )
        cards.append({
            "venueId": r.venue.get("id"),
            "title": r.venue.get("name"),
            "sport": r.venue.get("sport"),
            "area": r.venue.get("area"),
            "imageUrl": r.venue.get("imageUrl"),
            "rating": None if is_inf else r.venue.get("rating"),
            "price": None if is_inf else r.venue.get("price"),
            "venueType": "infrastructure" if is_inf else "marketplace",
            "venueCode": r.venue.get("venueCode"),
            "action": action,
        })

    return {
        "response": response_text,
        "text": response_text,
        "action": booking_action,
        "cards": cards,
    }
