from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Order, Outlet, Vehicle

router = APIRouter(tags=["Driver Workflows"])

class DeliverySyncRequest(BaseModel):
    delivery_ids: List[str]
    status: str

class CompleteStopRequest(BaseModel):
    delivery_id: str

@router.get("/active-route")
def active_route(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.vehicle_id.isnot(None))
        .filter(Order.dispatch_status.in_(["assigned", "dispatched", "in_transit"]))
        .order_by(Order.trip_id, Order.seq_in_route)
        .all()
    )
    stops = []
    for idx, order in enumerate(orders, 1):
        outlet = db.query(Outlet).filter(Outlet.outlet_id == order.outlet_id).first()
        stops.append({
            "stopNumber": order.seq_in_route or idx,
            "deliveryId": order.delivery_id,
            "storeId": order.outlet_id,
            "storeName": outlet.brand if outlet else order.outlet_id,
            "district": order.district,
            "deliveryStatus": "PENDING" if order.dispatch_status != "delivered" else "COMPLETED",
            "windowStart": outlet.window_open_time if outlet else None,
            "windowEnd": outlet.window_close_time if outlet else None,
        })
    vehicle = None
    if orders:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == orders[0].vehicle_id).first()
    return {
        "tripId": str(orders[0].trip_id) if orders else None,
        "vehicleId": vehicle.vehicle_id if vehicle else None,
        "vehiclePlate": None,
        "driverName": None,
        "status": "IN_TRANSIT" if orders else "NO_ACTIVE_ROUTE",
        "stops": stops,
    }

@router.post("/complete-stop")
def complete_stop(payload: CompleteStopRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.delivery_id == payload.delivery_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Delivery not found")
    order.dispatch_status = "delivered"
    db.commit()
    db.refresh(order)
    return {"status": "completed", "delivery": order}

@router.post("/sync")
def sync_offline_deliveries(payload: DeliverySyncRequest, db: Session = Depends(get_db)):
    processed = 0
    for delivery_id in payload.delivery_ids:
        order = db.query(Order).filter(Order.delivery_id == delivery_id).first()
        if order:
            order.dispatch_status = payload.status
            processed += 1
    db.commit()
    return {"status": "synced", "processed_count": processed}
