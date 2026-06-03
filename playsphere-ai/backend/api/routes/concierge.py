"""
POST /api/ai/concierge
AI Concierge venue discovery and booking assistant.
"""
from fastapi import APIRouter, HTTPException
from shared.types import ConciergeRequest, ConciergeResponse
from ai.concierge import handle_concierge_request

router = APIRouter()


@router.post("/concierge", response_model=ConciergeResponse)
async def concierge(body: ConciergeRequest):
    try:
        result = await handle_concierge_request(
            message=body.message,
            history=[msg.model_dump() for msg in body.history],
            mode=body.mode,
        )
        return ConciergeResponse(
            response=result["response"],
            text=result["text"],
            cards=result.get("cards", []),
            action=result.get("action"),
        )
    except RuntimeError as exc:
        # LLM timeout or API failure
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Concierge error: {str(exc)}")
