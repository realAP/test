#!/bin/bash

echo "🔄 Resetting database for fresh initialization..."

# Stop and remove containers
echo "Stopping containers..."
docker-compose down

# Remove the persistent volume to force database reinitialization
echo "Removing persistent volume data..."
docker volume rm test_postgres_data 2>/dev/null || echo "Volume doesn't exist or already removed"

# Remove any orphaned containers
echo "Cleaning up..."
docker-compose down --volumes --remove-orphans

echo "✅ Database reset complete!"
echo "Now run: docker-compose up -d --build"
echo "The database will be initialized fresh with the messages table."