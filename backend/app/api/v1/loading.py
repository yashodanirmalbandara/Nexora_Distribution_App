from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Order

router = APIRouter(prefix="/loading", tags=["Loader Workflows"])

@router.get("/sequence/{trip_id}")
def get_loading_sequence(trip_id: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.trip_id == trip_id).order_by(Order.seq_in_route.desc()).all()
    return {"trip_id": trip_id, "loading_sequence": orders}
