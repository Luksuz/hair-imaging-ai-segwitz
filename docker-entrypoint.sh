#!/bin/sh
set -eu

# Ensure Roboflow env can be passed to Flask (optional)
export FLASK_APP=api/index.py
export HOST=0.0.0.0
export PORT=3000

# Start Flask API
python3 api/index.py &
FLASK_PID=$!

# Start Next.js server
npm run start -- --port ${PORT} --hostname 0.0.0.0 &
NEXT_PID=$!

# Wait for both
wait ${FLASK_PID} ${NEXT_PID}


