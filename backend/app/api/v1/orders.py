from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Order

router = APIRouter(tags=["Orders"])

class OrderUpdate(BaseModel):
    dispatch_status: str | None = None
    vehicle_id: str | None = None
    trip_id: int | None = None
    seq_in_route: int | None = None

@router.get("/")
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.order_date.desc(), Order.delivery_id).all()

@router.patch("/{delivery_id}")
def update_order(delivery_id: str, payload: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.delivery_id == delivery_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order

@router.post("/")
def create_order(payload: dict, db: Session = Depends(get_db)):
    required = ["delivery_id", "order_date", "outlet_id", "brand", "district", "depot", "temp_requirement", "order_units", "order_weight_kg", "order_volume_m3"]
    missing = [key for key in required if key not in payload]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing fields: {', '.join(missing)}")
    order = Order(**payload)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
