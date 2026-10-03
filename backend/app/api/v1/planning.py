from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db

router = APIRouter(prefix="/planning", tags=["Dispatcher Workflows"])

@router.get("/summary")
def get_planning_summary(db: Session = Depends(get_db)):
    return {"status": "planning_ready"}
