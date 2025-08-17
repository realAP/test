# Simple Full-Stack Node.js Application

A minimal Node.js application with Express and PostgreSQL for testing deployment strategies.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed

### First Time Setup

```bash
# Clone/download the project files
# Navigate to the project directory

# Build and start the application
docker-compose up -d --build
```

The application will be available at: http://localhost:3000

## 🐛 Troubleshooting

### "relation 'messages' does not exist" Error

If you encounter this error, it means PostgreSQL was already initialized without the proper database schema. This happens when:

1. The database container was started before the `init.sql` file was properly configured
2. The persistent volume contains an old database without the messages table

**Solution:**

Run the database reset script:

```bash
# Make the script executable (if not already)
chmod +x reset-database.sh

# Reset the database
./reset-database.sh

# Start fresh
docker-compose up -d --build
```

**Manual Solution:**

```bash
# Stop containers and remove volumes
docker-compose down --volumes --remove-orphans

# Remove the persistent volume
docker volume rm test_postgres_data

# Start fresh
docker-compose up -d --build
```

## 📁 Project Structure

```
.
├── app.js              # Express server with inline HTML
├── package.json        # Node.js dependencies
├── Dockerfile          # Node.js container configuration
├── docker-compose.yml  # Multi-container setup
├── init.sql           # PostgreSQL schema and sample data
├── reset-database.sh   # Database reset utility
└── README.md          # This file
```

## 🔧 Development

### Quick Changes for Testing Deployments

1. Modify `app.js` to change styling, text, or functionality
2. Rebuild and restart: `docker-compose up -d --build`
3. See changes immediately at http://localhost:3000

### Environment Variables

The application uses these environment variables (set in docker-compose.yml):

- `POSTGRES_HOST=db`
- `POSTGRES_DB=testdb`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=password`
- `POSTGRES_PORT=5432`

### Features

- Single route at "/" showing HTML form and message list
- POST route "/add" to insert new messages
- PostgreSQL database with persistent storage
- Health check endpoint at "/health"
- Responsive inline CSS styling

## 🚢 Deployment Notes

- The app runs on port 3000
- Database data persists in Docker volume `postgres_data`
- For production, remove the volume mount of `app.js` in docker-compose.yml
- Health checks are configured for both services

## 📊 Database Schema

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔍 Logs and Monitoring

View application logs:
```bash
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

View database logs:
```bash
docker-compose logs db
```

## 🛑 Stopping the Application

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down --volumes
```