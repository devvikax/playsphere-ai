"""
POST /api/ai/discover
Returns programmatic venue discovery insights from live Firestore data.
"""
from fastapi import APIRouter, HTTPException
from shared.types import DiscoverInsight
from ai.discover import handle_discover_request

router = APIRouter()


@router.post("/discover")
async def discover():
    try:
        insights = await handle_discover_request()
        return {"insights": insights}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Discovery error: {str(exc)}")
