from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Vehicle, Trip

router = APIRouter(tags=["Fleet"])

@router.get("/vehicles")
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).order_by(Vehicle.vehicle_id).all()

@router.get("/trips")
def list_trips(db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.id.desc()).all()
