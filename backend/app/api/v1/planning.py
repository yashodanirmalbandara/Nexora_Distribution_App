from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import DistrictTravel, Calendar, ServiceAllowance, Outlet

router = APIRouter(tags=["Dispatcher & Constraint Data"])

@router.get("/travel-times")
def get_travel_times(db: Session = Depends(get_db)):
    return db.query(DistrictTravel).all()

@router.get("/calendar")
def get_calendar(db: Session = Depends(get_db)):
    return db.query(Calendar).all()

@router.get("/service-allowances")
def get_service_allowances(db: Session = Depends(get_db)):
    return db.query(ServiceAllowance).all()


@router.get("/outlets")
def get_outlets(db: Session = Depends(get_db)):
    return db.query(Outlet).order_by(Outlet.outlet_id).all()
