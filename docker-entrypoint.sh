#!/bin/sh
set -eu

# Ensure Roboflow env can be passed to Flask (optional)
export FLASK_APP=api/index.py
export HOST=0.0.0.0
# Railway provides $PORT for the public web service. Default to 8080.
export PORT=${PORT:-8080}

# Start Flask API
python3 api/index.py &
FLASK_PID=$!

# Start Next.js server on the provided port
npm run start -- --port "${PORT}" --hostname 0.0.0.0 &
NEXT_PID=$!

# Wait for both
wait ${FLASK_PID} ${NEXT_PID}


