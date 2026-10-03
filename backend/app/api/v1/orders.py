from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Order

router = APIRouter(prefix="/orders", tags=["Store Manager Workflows"])

@router.get("/")
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()
