from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/delivery", tags=["Driver Workflows"])

class DeliverySyncRequest(BaseModel):
    delivery_ids: List[str]
    status: str

@router.post("/sync")
def sync_offline_deliveries(payload: DeliverySyncRequest):
    return {"status": "synced", "processed_count": len(payload.delivery_ids)}
