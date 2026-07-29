#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding sample data..."
python -m app.seed

echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
