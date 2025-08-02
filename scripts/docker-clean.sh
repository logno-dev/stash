#!/bin/bash

# Docker cleanup script
# Usage: ./scripts/docker-clean.sh [--full]

set -e

echo "🧹 Cleaning Docker cache..."

# Stop and remove containers
echo "🛑 Stopping containers..."
docker-compose down --volumes --remove-orphans

if [ "$1" = "--full" ]; then
    echo "🗑️  Performing FULL cleanup (removes ALL Docker data)..."
    echo "⚠️  This will remove ALL Docker images, containers, volumes, and networks!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -af --volumes
        docker builder prune -af
        echo "✅ Full cleanup complete!"
    else
        echo "❌ Full cleanup cancelled"
    fi
else
    echo "🗑️  Performing standard cleanup..."
    # Remove only unused objects
    docker system prune -f --volumes
    # Remove build cache for this project
    docker builder prune -f --filter type=exec.cachemount
    echo "✅ Standard cleanup complete!"
fi

echo "💾 Disk space reclaimed:"
docker system df