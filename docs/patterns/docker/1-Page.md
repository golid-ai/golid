# Docker — 1-Page

**Thesis**: Docker is packaging for software. Consistent environments from laptop to production.

**Refrain**: Keep images small. Layer strategically. Never run as root.

---

### Multi-Stage Build

```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run
FROM node:20-alpine
RUN adduser -D appuser
COPY --from=builder /app/dist ./dist
USER appuser
CMD ["node", "dist/index.js"]
```

### .dockerignore

```
node_modules
.git
.env
*.md
Dockerfile
```

### Compose Basics

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready"]

volumes:
  pg_data:
```

### Common Commands

```bash
# Build & run
docker build -t myapp .
docker run -d -p 8080:8080 myapp

# Compose
docker compose up -d
docker compose down -v
docker compose logs -f app

# Debug
docker exec -it container sh
docker logs -f container

# Cleanup
docker system prune -a
```

### Security

```dockerfile
# Non-root user
RUN adduser -D appuser
USER appuser
```

### Layer Caching Strategy

```dockerfile
# ✅ Dependencies first (rarely change)
COPY package*.json ./
RUN npm ci

# ✅ Source code last (changes often)
COPY . .
RUN npm run build
```

### Debugging Containers

```bash
# Interactive shell in running container
docker exec -it <container> sh

# Shell in stopped container (override entrypoint)
docker run -it --entrypoint sh myapp

# Copy files out
docker cp <container>:/app/logs ./logs

# Resource usage
docker stats

# Inspect container
docker inspect <container> | jq '.[0].NetworkSettings'
```

### Image Size Optimization

| Technique | Savings |
|-----------|---------|
| Alpine base | 100MB → 5MB |
| Multi-stage | Remove build tools |
| .dockerignore | Exclude node_modules, .git |
| Combine RUN | Fewer layers |

### Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

### Anti-Patterns

| Bad | Why | Do Instead |
|-----|-----|------------|
| Run as root | Security risk | `USER appuser` |
| `latest` tag | Unpredictable | Explicit version |
| Large images | Slow deploys | Multi-stage + Alpine |
| Secrets in image | Exposed in layers | Runtime env vars |
| COPY before deps | Cache invalidation | Copy package.json first |

### Definition of Done

- [ ] Multi-stage build
- [ ] Non-root user
- [ ] Health check defined
- [ ] .dockerignore present
- [ ] Pinned base image versions

---
