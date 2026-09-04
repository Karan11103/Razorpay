#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export PATH="/Users/karan/.local/node/bin:$PATH"

echo "=========================================================="
echo " Starting Ghost Payment Detector (Razorpay Buildathon)   "
echo "=========================================================="

# Cleanup handler on exit
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

# 1. Start Backend
echo "-> Launching FastAPI Backend on http://localhost:8000..."
cd "$DIR/backend"
PYTHONPATH=. ./venv/bin/python run.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend health check..."
until curl -s http://localhost:8000/health >/dev/null; do
  sleep 0.5
done
echo "Backend is live at http://localhost:8000 (Swagger docs: http://localhost:8000/docs)"

# 2. Start Frontend
echo "-> Launching React + Vite Frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "=========================================================="
echo " Ghost Payment Detector is RUNNING!                       "
echo " Web UI:    http://localhost:5173                         "
echo " API Docs:  http://localhost:8000/docs                    "
echo " Press Ctrl+C to stop both services.                      "
echo "=========================================================="

wait
