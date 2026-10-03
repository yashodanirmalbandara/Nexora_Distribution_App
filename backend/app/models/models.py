import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, Date, ForeignKey
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    DISPATCHER = "dispatcher"
    LOADER = "loader"
    DRIVER = "driver"
    STORE_MANAGER = "store_manager"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)

class Outlet(Base):
    __tablename__ = "outlets"
    outlet_id = Column(String, primary_key=True)
    brand = Column(String, nullable=False)
    district = Column(String, nullable=False)
    depot = Column(String, nullable=False)
    dock_type = Column(String, nullable=False)
    parking_constraint = Column(String, nullable=False)
    window_open_time = Column(String, nullable=False)
    window_close_time = Column(String, nullable=False)
    mall_window = Column(String, nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"
    vehicle_id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    temp = Column(String, nullable=False)
    weight_cap_kg = Column(Float, nullable=False)
    volume_cap_m3 = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)
    km_per_l = Column(Float, nullable=False)
    weekly_fuel_quota_l = Column(Float, nullable=False)
    depot = Column(String, nullable=False)

class Order(Base):
    __tablename__ = "orders"
    delivery_id = Column(String, primary_key=True)
    order_date = Column(Date, nullable=False)
    dispatch_date = Column(Date, nullable=True)
    dispatch_status = Column(String, default="pending")
    outlet_id = Column(String, ForeignKey("outlets.outlet_id"), nullable=False)
    brand = Column(String, nullable=False)
    district = Column(String, nullable=False)
    depot = Column(String, nullable=False)
    temp_requirement = Column(String, nullable=False)
    order_units = Column(Integer, nullable=False)
    order_weight_kg = Column(Float, nullable=False)
    order_volume_m3 = Column(Float, nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=True)
    trip_id = Column(Integer, nullable=True)
    seq_in_route = Column(Integer, nullable=True)
    deferred_yesterday = Column(Integer, default=0)
    days_since_last_served = Column(Integer, default=0)

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    trip_number = Column(Integer, nullable=False)
    status = Column(String, default="planned")
    shortfall_flag = Column(Boolean, default=False)
    shortfall_notes = Column(String, nullable=True)
