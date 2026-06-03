"""
Pydantic models matching shared/types/index.ts.
Used for FastAPI request/response validation.
"""
from __future__ import annotations
from typing import Any, Optional, Literal
from pydantic import BaseModel, Field


# ── Enums (as Literal types) ──────────────────────────────────────────────────

Sport = Literal["badminton", "football", "swimming", "kabaddi"]
SkillLevel = Literal["beginner", "intermediate", "advanced", "all"]
BookingStatus = Literal["pending", "confirmed", "cancelled", "completed"]
PaymentStatus = Literal["payment_pending", "verification_pending", "paid", "rejected", "refund_pending"]
UserRole = Literal["player", "owner", "admin"]
ApprovalStatus = Literal["pending", "approved", "rejected"]
PriceSlot = Literal["morning", "afternoon", "evening"]


# ── Request/Response Models ───────────────────────────────────────────────────

class ChatHistoryItem(BaseModel):
    role: str
    content: str


class ConciergeRequest(BaseModel):
    message: str
    history: list[ChatHistoryItem] = Field(default_factory=list)
    mode: Literal["discovery", "guidance"] = "discovery"


class ConciergeCard(BaseModel):
    venueId: str
    title: str
    sport: str
    area: str
    imageUrl: Optional[str] = None
    rating: Optional[float] = None
    price: Optional[float] = None
    venueType: Literal["marketplace", "infrastructure"]
    venueCode: Optional[str] = None
    action: Literal["book", "view", "verify"]


class BookingAction(BaseModel):
    type: str
    venueId: str
    venueName: str
    date: str
    slot: str


class ConciergeResponse(BaseModel):
    response: str
    text: str
    cards: list[ConciergeCard] = Field(default_factory=list)
    action: Optional[BookingAction] = None


class DiscoverInsight(BaseModel):
    type: Literal["gap", "opportunity", "trend", "value"]
    title: str
    description: str
    area: Optional[str] = None
    sport: Optional[str] = None
    emoji: str
    urgency: Literal["high", "medium", "low"]


class DiscoverResponse(BaseModel):
    insights: list[DiscoverInsight]


class InfrastructureDiscoveryResponse(BaseModel):
    success: bool
    added: int
    updated: int
    skipped: int
    enriched: int
    errors: int
    logs: list[str]
    triggeredBy: Optional[str] = None
    osmFetched: Optional[int] = None
    normalized: Optional[int] = None
    rejected: Optional[int] = None


class ErrorResponse(BaseModel):
    error: str


class TimeSlot(BaseModel):
    time: str
    endTime: str
    label: str
    priceMultiplier: float
    finalPrice: float
    timeOfDay: PriceSlot
    available: bool
