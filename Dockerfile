# A small, production-ready Node.js base image (not the full-size one —
# keeps the container smaller and faster to start on Cloud Run).
FROM node:20-slim

WORKDIR /app

# Copy just the dependency manifests first, so Docker can cache the
# `npm ci` step and skip re-downloading packages when only your source
# code changes (not your dependencies) between deploys.
COPY package*.json ./
RUN npm ci --omit=dev

# Now copy the actual application code.
COPY . .

# Cloud Run sets the PORT environment variable itself (usually 8080) and
# expects your app to listen on it — src/server.js already reads
# process.env.PORT, so no code change is needed here, just documenting it.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]
