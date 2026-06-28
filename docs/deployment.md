# Deployment

## Docker

The application runs with Docker Compose.

### Services
- `app` - Next.js application
- `mongo` - MongoDB instance

### Environment Variables

Required:
```
MONGODB_URI=mongodb://mongo:27017/agency-crm
JWT_SECRET=<random-64-char-secret>
JWT_REFRESH_SECRET=<random-64-char-secret>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production
```

Optional:
```
MONGODB_DB_NAME=agency-crm
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Commands

```bash
# Development
docker compose up -d

# Production build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild
docker compose build --no-cache
```

## Health Checks

- `GET /api/health` - Basic health check (responds 200 if app is running)
- `GET /api/health/ready` - Readiness check (verifies MongoDB connection)

## Backup

MongoDB backups via `mongodump`:
```bash
docker compose exec mongo mongodump --out /backup/$(date +%Y%m%d)
```
