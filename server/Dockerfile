# Use Node.js 20 Alpine image for smaller size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy all server files
COPY . .

# Create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Cloud Run sets PORT environment variable
EXPOSE 8080

# Set PORT for Cloud Run (will be overridden by Cloud Run's PORT env var)
ENV PORT=8080
ENV NODE_ENV=production

# Start the production server (explicitly use production-server.js)
# IMPORTANT: This must run production-server.js, NOT index.js
CMD ["node", "production-server.js"]
