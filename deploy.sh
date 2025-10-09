#!/bin/bash

# MeeWarp Production Deployment Script
# This script deploys the fixed package creation code to production server

echo "🚀 Starting MeeWarp Production Deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Build and push Docker images (if using Docker registry)
echo "📦 Building Docker images..."
docker-compose build

# Tag images for production
echo "🏷️  Tagging images for production..."
docker tag meewarp-server:latest meewarp-server:production
docker tag meewarp-client:latest meewarp-client:production

echo "✅ Docker images built and tagged successfully!"

# Note: The actual deployment to production server depends on your infrastructure
# This could be:
# 1. Pushing to a Docker registry and pulling on production server
# 2. Using a CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
# 3. Direct file transfer to production server
# 4. Using a container orchestration platform (Kubernetes, Docker Swarm, etc.)

echo "📋 Next steps for production deployment:"
echo "1. Push images to your Docker registry (if using one)"
echo "2. Update production server with new images"
echo "3. Restart production containers"
echo "4. Verify the fix is working"

echo "🔧 To manually deploy to production server:"
echo "1. Copy the fixed adminRoutes.js to production server"
echo "2. Restart the production application"
echo "3. Test the package creation API"

echo "🎯 The fix includes:"
echo "- Better error handling for package creation"
echo "- Store context validation"
echo "- Improved error messages"

echo "✨ Deployment preparation completed!"
