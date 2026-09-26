# Backend API Redis Cache Demo

Concert reads use cache-aside with Redis.

Local runtime uses Docker. CI runs the mock-based unit test `npm run test:api:unit`.

## Demo flow

```bash
cd infrastructure
docker compose up -d
npm run start:api
```

Call the same endpoint twice:

```bash
curl http://localhost:3000/concerts/<concert-id>
curl http://localhost:3000/concerts/<concert-id>
```

Expected logs:

- first call: `[DB] ... cache miss`
- second call: `[REDIS] ... cache hit`

Same for the list endpoint:

```bash
curl "http://localhost:3000/concerts?page=1&limit=10"
curl "http://localhost:3000/concerts?page=1&limit=10"
```

## Clear Redis cache

```bash
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli FLUSHDB
```

Use `FLUSHALL` if you want to clear every Redis DB in the container.

To remove only concert keys:

```bash
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli --scan --pattern "concerts:*"
```

Then delete the returned keys with `DEL`.
