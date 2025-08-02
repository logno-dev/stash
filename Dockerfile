# Multi-stage build for React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend-react

# Copy frontend package files
COPY frontend-react/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY frontend-react/ ./

# Build the React app
RUN npm run build

# Backend stage
FROM node:20-alpine

WORKDIR /app

# Copy backend package.json and package-lock.json
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --only=production

# Copy backend application code
COPY backend/*.js ./

# Copy built React frontend from previous stage
COPY --from=frontend-builder /app/backend/dist ./dist

# Copy environment files
COPY .env* ./

# Create data directory for SQLite database
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]