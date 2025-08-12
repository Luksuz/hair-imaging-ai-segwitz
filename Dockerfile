# Multi-process container: Next.js (port 3000) + Flask (port 5328)

FROM node:20-bullseye

# Install Python for Flask API
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends python3 python3-pip \
     libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps first for better caching
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy application code
COPY . .

# Install Python deps for API
RUN pip3 install --no-cache-dir -r api/requirements.txt

# Build Next.js
ENV NODE_ENV=production
RUN npm run build

# Expose ports: Next.js 8080 (public default), Flask 5328 (internal)
EXPOSE 8080
EXPOSE 5328

# Start both processes
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]


