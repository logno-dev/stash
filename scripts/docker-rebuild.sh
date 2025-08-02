#!/bin/bash

# Docker rebuild script
# Usage: ./scripts/docker-rebuild.sh [--no-cache]

set -e

echo "🔄 Rebuilding Docker containers..."

# Build React frontend first
echo "🏗️  Building React frontend..."
cd frontend-react && npm run build && cd ..

# Stop containers
echo "🛑 Stopping containers..."
docker-compose down

# Build Docker image
if [ "$1" = "--no-cache" ]; then
    echo "🐳 Building Docker image (no cache)..."
    docker-compose build --no-cache
else
    echo "🐳 Building Docker image..."
    docker-compose build
fi

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Show logs
echo "📋 Container logs:"
docker-compose logs --tail=20

echo "✅ Rebuild complete!"
echo "🌐 App available at: http://localhost:3000"