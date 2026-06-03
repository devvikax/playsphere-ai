"""
Pricing helpers — Python port of shared/helpers/pricing.ts
"""
from __future__ import annotations
import re
from datetime import datetime, timezone, date as date_type
from typing import Optional


def get_time_of_day(time_str: str) -> str:
    """Returns 'morning', 'afternoon', or 'evening' from an HH:MM string."""
    try:
        hours = int(time_str.split(":")[0])
    except (ValueError, IndexError):
        return "evening"
    if 5 <= hours < 11:
        return "morning"
    if 11 <= hours < 17:
        return "afternoon"
    return "evening"


def is_weekend(date_str: str) -> bool:
    """Returns True if date_str (YYYY-MM-DD) falls on a Saturday or Sunday."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.weekday() >= 5  # 5=Sat, 6=Sun
    except ValueError:
        return False


def calculate_price(base_price: float, time_slot: str, date_str: str) -> dict:
    time_of_day = get_time_of_day(time_slot)
    weekend = is_weekend(date_str)

    multipliers = {"morning": 1.0, "afternoon": 0.85, "evening": 1.3}
    labels = {
        "morning": "🌅 Morning (5–8 AM)",
        "afternoon": "☀️ Afternoon (11–4 PM)",
        "evening": "🌆 Evening Peak (5–10 PM)",
    }

    multiplier = multipliers[time_of_day]
    weekend_surcharge = min(base_price * 0.2, 300) if weekend else 0
    final_price = round(base_price * multiplier + weekend_surcharge)

    tip = None
    if time_of_day == "evening":
        afternoon_price = round(base_price * 0.85)
        tip = f"Save ₹{final_price - afternoon_price} by booking afternoon instead!"
    if weekend and weekend_surcharge > 0:
        tip = f"Weekend surcharge +₹{round(weekend_surcharge)} applied"

    return {
        "timeOfDay": time_of_day,
        "label": labels[time_of_day],
        "multiplier": multiplier,
        "isWeekend": weekend,
        "weekendSurcharge": round(weekend_surcharge),
        "finalPrice": final_price,
        "tip": tip,
    }


def _parse_time_to_minutes(time_str: str) -> int:
    """Parse HH:MM (24h) or H:MM AM/PM to total minutes from midnight."""
    clean = time_str.strip().upper()
    is_pm = clean.endswith("PM")
    is_am = clean.endswith("AM")
    time_part = re.sub(r"[AP]M", "", clean).strip()
    parts = time_part.split(":")
    try:
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
    except (ValueError, IndexError):
        return 0

    if is_pm and hours < 12:
        hours += 12
    elif is_am and hours == 12:
        hours = 0

    return hours * 60 + minutes


def generate_time_slots(
    open_time: str,
    close_time: str,
    base_price: float,
    date_str: str,
    slot_duration_minutes: int = 60,
) -> list[dict]:
    """Generate hourly time slots with dynamic pricing."""
    slots = []
    current = _parse_time_to_minutes(open_time)
    close = _parse_time_to_minutes(close_time)

    while current + slot_duration_minutes <= close:
        start_h, start_m = divmod(current, 60)
        end_minutes = current + slot_duration_minutes
        end_h, end_m = divmod(end_minutes, 60)

        start_str = f"{start_h:02d}:{start_m:02d}"
        end_str = f"{end_h:02d}:{end_m:02d}"
        label = f"{start_str}–{end_str}"

        pricing = calculate_price(base_price, start_str, date_str)

        slots.append({
            "time": start_str,
            "endTime": end_str,
            "label": label,
            "priceMultiplier": pricing["multiplier"],
            "finalPrice": pricing["finalPrice"],
            "timeOfDay": pricing["timeOfDay"],
            "available": True,
        })
        current += slot_duration_minutes

    return slots


def is_slot_in_past(date_str: str, slot_str: str, reference_time: Optional[datetime] = None) -> bool:
    """Returns True if the booking slot end time has already passed."""
    try:
        now = reference_time or datetime.now(timezone.utc).replace(tzinfo=None)
        today_str = now.strftime("%Y-%m-%d")

        if date_str < today_str:
            return True

        if date_str == today_str:
            parts = re.split(r"[–\-]", slot_str)
            if len(parts) >= 2:
                end_time_str = parts[1].strip()
                end_h, end_m = [int(x) for x in end_time_str.split(":")]
                slot_end = now.replace(hour=end_h, minute=end_m, second=0, microsecond=0)
                return slot_end <= now
    except Exception:
        pass
    return False


def get_booking_lifecycle(booking: dict, reference_time: Optional[datetime] = None) -> str:
    """Derives 'upcoming' | 'completed' | 'expired' | 'cancelled' status."""
    b_status = (booking.get("bookingStatus") or booking.get("status") or "").lower()

    if b_status == "cancelled":
        return "cancelled"

    passed = is_slot_in_past(booking["date"], booking["slot"], reference_time)

    if not passed:
        return "upcoming"

    is_success = (
        b_status == "confirmed"
        or booking.get("paymentStatus") == "paid"
        or booking.get("paymentStatus") == "verification_pending"
    )
    return "completed" if is_success else "expired"
