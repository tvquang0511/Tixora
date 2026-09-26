# Backend API Redis Cache Local Demo

Concert reads use cache-aside with Redis.

## Test flow

```bash
cd infrastructure
docker compose up -d
npm run start:api
```

Call the same endpoint twice, for example:

```bash
curl http://localhost:3000/concerts/<concert-id>
curl http://localhost:3000/concerts/<concert-id>
```

Expected logs:

- first call: `[DB] ... cache miss`
- second call: `[REDIS] ... cache hit`

Same idea for the list endpoint:

```bash
curl "http://localhost:3000/concerts?page=1&limit=10"
curl "http://localhost:3000/concerts?page=1&limit=10"
```

## Clear Redis cache for demo

Clear the current Redis database:

```bash
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli FLUSHDB
```

Clear everything in the Redis container:

```bash
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli FLUSHALL
```

Remove only concert keys:

```bash
docker compose -f infrastructure/docker-compose.yml exec redis redis-cli --scan --pattern "concerts:*"
```

Then delete the returned keys with `DEL`.

Expected TTL: about `86400` seconds.
