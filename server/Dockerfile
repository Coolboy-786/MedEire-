FROM node:20-alpine

WORKDIR /app

# Copy manifests first so Docker caches the npm install layer separately.
# Re-installing only happens when package*.json changes, not on every code edit.
COPY package*.json ./
RUN npm install --omit=dev

# Create the logs directory the Winston file transport writes to.
RUN mkdir -p logs

# Copy the rest of the source (node_modules excluded via .dockerignore).
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
