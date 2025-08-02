#!/bin/bash

# Development script with file watching and auto-rebuild
# Usage: ./scripts/dev-watch.sh

set -e

echo "🔧 Starting development environment with file watching..."

# Function to rebuild and restart
rebuild_and_restart() {
    echo "📁 Files changed, rebuilding..."
    
    # Build React app
    echo "🏗️  Building React frontend..."
    cd frontend-react && npm run build && cd ..
    
    # Rebuild Docker image
    echo "🐳 Rebuilding Docker image..."
    docker-compose build --no-cache bookmark-app
    
    # Restart containers
    echo "🔄 Restarting containers..."
    docker-compose down
    docker-compose up -d
    
    echo "✅ Rebuild complete!"
}

# Function to clean rebuild (clears all cache)
clean_rebuild() {
    echo "🧹 Performing clean rebuild..."
    
    # Stop containers
    docker-compose down --volumes --remove-orphans
    
    # Clean Docker cache
    docker system prune -af --volumes
    
    # Rebuild everything
    rebuild_and_restart
}

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
    echo "❌ fswatch is not installed. Installing via Homebrew..."
    brew install fswatch
fi

# Initial build
echo "🚀 Performing initial build..."
rebuild_and_restart

echo "👀 Watching for file changes..."
echo "📝 Watching: backend/*.js, frontend-react/src/**, frontend-react/public/**"
echo "🛑 Press Ctrl+C to stop"

# Watch for changes and rebuild
fswatch -o \
    backend/*.js \
    frontend-react/src \
    frontend-react/public \
    frontend-react/package.json \
    frontend-react/vite.config.js | while read f; do
    rebuild_and_restart
done