# ── Stage 1: Build ───────────────────────────────────────────────────────────
# Install dependencies and compile the Vite/React app into a static bundle.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────────────────────
# Drop the build tools entirely; only ship the compiled static files + nginx.
# This keeps the production image small (~25 MB vs ~400 MB for a node image).
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
