"""
Ticket ID generator — Python port of shared/helpers/ticket.ts
"""
import random


def generate_ticket_id(sport: str) -> str:
    sport_abbr_map = {
        "badminton": "BAD",
        "football": "FOT",
        "swimming": "SWM",
        "kabaddi": "KAB",
    }
    abbr = sport_abbr_map.get((sport or "").lower(), "SPT")
    rand_num = random.randint(1000, 9999)
    return f"PS-{abbr}-2026-{rand_num}"
