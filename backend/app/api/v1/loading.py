from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Order, Vehicle

router = APIRouter(tags=["Loader Workflows"])

class LoadingUpdate(BaseModel):
    dispatch_status: str

@router.get("/manifests")
def get_manifests(db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.vehicle_id.isnot(None)).order_by(Order.trip_id, Order.seq_in_route).all()
    grouped = {}
    for order in orders:
        key = str(order.trip_id or order.vehicle_id)
        grouped.setdefault(key, []).append(order)
    result = []
    for trip_id, trip_orders in grouped.items():
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == trip_orders[0].vehicle_id).first()
        result.append({
            "tripId": trip_id,
            "vehicleId": vehicle.vehicle_id if vehicle else trip_orders[0].vehicle_id,
            "vehiclePlate": None,
            "driverName": None,
            "status": "DISPATCHED" if all(o.dispatch_status == "dispatched" for o in trip_orders) else "LOADING",
            "items": [{
                "id": o.delivery_id,
                "description": f"{o.brand} order",
                "qty": o.order_units,
                "weightKg": o.order_weight_kg,
                "loaded": o.dispatch_status in ("loaded", "dispatched", "in_transit", "delivered"),
            } for o in trip_orders],
            "totalCrateCount": sum(o.order_units for o in trip_orders),
            "loadedCrateCount": sum(o.order_units for o in trip_orders if o.dispatch_status in ("loaded", "dispatched", "in_transit", "delivered")),
        })
    return result

@router.get("/sequence/{trip_id}")
def get_loading_sequence(trip_id: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.trip_id == trip_id).order_by(Order.seq_in_route.desc()).all()
    return {"trip_id": trip_id, "loading_sequence": orders}

@router.post("/dispatch/{trip_id}")
def dispatch_trip(trip_id: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.trip_id == trip_id).all()
    for order in orders:
        order.dispatch_status = "dispatched"
    db.commit()
    return {"status": "dispatched", "trip_id": trip_id, "count": len(orders)}
