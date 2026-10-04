import os
import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import (
    User, Outlet, Vehicle, Order, Trip,
    DistrictTravel, Calendar, ServiceAllowance
)

# Auto-create all table schemas in PostgreSQL
Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

CSV_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CSVs")

def get_file_path(filename):
    if not os.path.exists(CSV_DIR):
        return None
    for f in os.listdir(CSV_DIR):
        if f.lower() == filename.lower():
            return os.path.join(CSV_DIR, f)
    return None

def seed_users():
    # Users are provisioned by the real database/authentication workflow.
    # This initializer intentionally does not create demo accounts or passwords.
    print(f"✓ Users table ready ({db.query(User).count()} rows).")

def seed_outlets():
    path = get_file_path("outlets.csv")
    if path and db.query(Outlet).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            db.add(Outlet(
                outlet_id=str(row['outlet_id']),
                brand=str(row['brand']),
                district=str(row['district']),
                depot=str(row['depot']),
                dock_type=str(row['dock_type']),
                parking_constraint=str(row['parking_constraint']),
                window_open_time=str(row['window_open_time']),
                window_close_time=str(row['window_close_time']),
                mall_window=str(row['mall_window']) if pd.notna(row.get('mall_window')) else None
            ))
        db.commit()
        print(f"✓ Seeded outlets ({db.query(Outlet).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ Outlets table ready ({db.query(Outlet).count()} rows).")

def seed_vehicles():
    path = get_file_path("vehicles.csv")
    if path and db.query(Vehicle).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            db.add(Vehicle(
                vehicle_id=str(row['vehicle_id']),
                type=str(row['type']),
                temp=str(row['temp']),
                weight_cap_kg=float(row['weight_cap_kg']),
                volume_cap_m3=float(row['volume_cap_m3']),
                fuel_type=str(row['fuel_type']),
                km_per_l=float(row['km_per_l']),
                weekly_fuel_quota_l=float(row['weekly_fuel_quota_l']),
                depot=str(row['depot'])
            ))
        db.commit()
        print(f"✓ Seeded vehicles ({db.query(Vehicle).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ Vehicles table ready ({db.query(Vehicle).count()} rows).")

def seed_orders():
    path = get_file_path("orders.csv")
    if path and db.query(Order).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            db.add(Order(
                delivery_id=str(row['delivery_id']),
                order_date=pd.to_datetime(row['order_date']).date(),
                dispatch_status=str(row.get('dispatch_status', 'pending')),
                outlet_id=str(row['outlet_id']),
                brand=str(row['brand']),
                district=str(row['district']),
                depot=str(row['depot']),
                temp_requirement=str(row['temp_requirement']),
                order_units=int(row['order_units']),
                order_weight_kg=float(row['order_weight_kg']),
                order_volume_m3=float(row['order_volume_m3'])
            ))
        db.commit()
        print(f"✓ Seeded orders ({db.query(Order).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ Orders table ready ({db.query(Order).count()} rows).")

def seed_district_travel():
    path = get_file_path("district_travel.csv") or get_file_path("district_travel_matrix.csv")
    if path and db.query(DistrictTravel).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            orig = str(row.get('origin_district', row.get('from_district', '')))
            dest = str(row.get('destination_district', row.get('to_district', '')))
            ttime = float(row['travel_time_mins']) if 'travel_time_mins' in row and pd.notna(row['travel_time_mins']) else None
            dist = float(row['distance_km']) if 'distance_km' in row and pd.notna(row['distance_km']) else None
            db.add(DistrictTravel(
                origin_district=orig,
                destination_district=dest,
                travel_time_mins=ttime,
                distance_km=dist
            ))
        db.commit()
        print(f"✓ Seeded district_travel ({db.query(DistrictTravel).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ DistrictTravel table ready ({db.query(DistrictTravel).count()} rows).")

def seed_calendar():
    path = get_file_path("calendar.csv")
    if path and db.query(Calendar).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            db.add(Calendar(
                date=pd.to_datetime(row['date']).date(),
                day_of_week=str(row.get('day_of_week', '')),
                is_working_day=bool(row.get('is_working_day', True)),
                notes=str(row['notes']) if pd.notna(row.get('notes')) else None
            ))
        db.commit()
        print(f"✓ Seeded calendar ({db.query(Calendar).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ Calendar table ready ({db.query(Calendar).count()} rows).")

def seed_service_allowance():
    path = get_file_path("service_allowance.csv") or get_file_path("service_allowances.csv")
    if path and db.query(ServiceAllowance).count() == 0:
        df = pd.read_csv(path)
        for _, row in df.iterrows():
            val = float(row.get('value', row.get('allowance_value', 0)))
            db.add(ServiceAllowance(
                category=str(row.get('category', 'default')),
                allowance_type=str(row.get('allowance_type', 'service_time')),
                value=val,
                unit=str(row['unit']) if pd.notna(row.get('unit')) else None
            ))
        db.commit()
        print(f"✓ Seeded service_allowance ({db.query(ServiceAllowance).count()} rows) from {os.path.basename(path)}")
    else:
        print(f"✓ ServiceAllowance table ready ({db.query(ServiceAllowance).count()} rows).")

if __name__ == "__main__":
    seed_users()
    seed_outlets()
    seed_vehicles()
    seed_orders()
    seed_district_travel()
    seed_calendar()
    seed_service_allowance()
    db.close()
    print("----------------------------------------")
    print("Database initialization and seeding completed successfully.")
