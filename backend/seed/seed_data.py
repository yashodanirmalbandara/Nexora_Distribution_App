import os
import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Outlet, Vehicle, Order

Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

# Direct path to backend/seed/CSVs
CSV_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CSVs")

def seed_users():
    if db.query(User).count() == 0:
        default_users = [
            User(username="dispatcher1", hashed_password="password123", role="dispatcher"),
            User(username="loader1", hashed_password="password123", role="loader"),
            User(username="driver1", hashed_password="password123", role="driver"),
            User(username="manager1", hashed_password="password123", role="store_manager"),
        ]
        db.add_all(default_users)
        db.commit()
        print("Seeded default users successfully.")

def seed_csv_data():
    # 1. Outlets
    outlets_path = os.path.join(CSV_DIR, "outlets.csv")
    if os.path.exists(outlets_path) and db.query(Outlet).count() == 0:
        df = pd.read_csv(outlets_path)
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
        print(f"Seeded outlets.csv from {outlets_path}")

    # 2. Vehicles
    vehicles_path = os.path.join(CSV_DIR, "vehicles.csv")
    if os.path.exists(vehicles_path) and db.query(Vehicle).count() == 0:
        df = pd.read_csv(vehicles_path)
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
        print(f"Seeded vehicles.csv from {vehicles_path}")

    # 3. Orders (optional if present)
    orders_path = os.path.join(CSV_DIR, "orders.csv")
    if os.path.exists(orders_path) and db.query(Order).count() == 0:
        df = pd.read_csv(orders_path)
        for _, row in df.iterrows():
            db.add(Order(
                delivery_id=str(row['delivery_id']),
                order_date=str(row['order_date']),
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
        print(f"Seeded orders.csv from {orders_path}")

if __name__ == "__main__":
    seed_users()
    seed_csv_data()
    db.close()
    print("Database seeding completed.")
