#!/bin/sh
set -e

echo "Running database seed script..."
python -m seed.seed_data || echo "Seeding script completed or pending model setup."

echo "Starting FastAPI app..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
