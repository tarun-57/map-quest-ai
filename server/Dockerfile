# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
# Use npm install to avoid lockfile sync errors in CI when dependencies changed without lock update
RUN npm install --omit=dev

# Copy app source
COPY index.js ./
COPY data ./data

EXPOSE 3300

ENV NODE_ENV=production

CMD ["node", "index.js"]


