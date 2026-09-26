import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";
import { StorageGcService } from "../src/modules/worker/services/storage-gc.service";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test("StorageGcService runCleanup deletes only unreferenced and old files", async () => {
  process.env.SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_KEY = "test-key";
  process.env.SUPABASE_BUCKET = "test-bucket";

  // Mock Prisma Service
  const mockPrisma = {
    concert: {
      findMany: fn().mockResolvedValue([
        {
          poster_url:
            "https://supabase.example.com/storage/v1/object/public/test-bucket/posters/active-poster.png",
          svg_map_url:
            "https://supabase.example.com/storage/v1/object/public/test-bucket/maps/active-map.svg",
        },
      ]),
    },
  } as any;

  // Setup file timings
  const oldTime = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(); // 30h ago
  const newTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago

  // Mock Fetch
  const mockFetch = fn();

  // First call: List posters
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { name: "active-poster.png", created_at: oldTime }, // Active
      { name: "old-orphaned-poster.png", created_at: oldTime }, // Orphaned & Old -> SHOULD DELETE
      { name: "new-orphaned-poster.png", created_at: newTime }, // Orphaned & New -> SKIP
    ],
  });

  // Second call: List maps
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { name: "active-map.svg", created_at: oldTime }, // Active
      { name: "old-orphaned-map.svg", created_at: oldTime }, // Orphaned & Old -> SHOULD DELETE
    ],
  });

  // Third call: Delete endpoint
  mockFetch.mockResolvedValueOnce({
    ok: true,
  });

  global.fetch = mockFetch as any;

  const service = new StorageGcService(mockPrisma);
  const deletedCount = await service.runCleanup();

  // Should delete: 'posters/old-orphaned-poster.png' and 'maps/old-orphaned-map.svg'
  assert.equal(deletedCount, 2);

  const fetchCalls = mockFetch.mock.calls;

  // Verify list calls
  assert.equal(fetchCalls.length, 3);
  const [listCall1Url, listCall1Init] = fetchCalls[0];
  assert.equal(
    listCall1Url,
    "https://supabase.example.com/storage/v1/object/list/test-bucket",
  );
  assert.equal(JSON.parse(listCall1Init.body).prefix, "posters");

  const [listCall2Url, listCall2Init] = fetchCalls[1];
  assert.equal(
    listCall2Url,
    "https://supabase.example.com/storage/v1/object/list/test-bucket",
  );
  assert.equal(JSON.parse(listCall2Init.body).prefix, "maps");

  // Verify delete call
  const [deleteCallUrl, deleteCallInit] = fetchCalls[2];
  assert.equal(
    deleteCallUrl,
    "https://supabase.example.com/storage/v1/object/test-bucket",
  );
  assert.equal(deleteCallInit.method, "DELETE");
  const deleteBody = JSON.parse(deleteCallInit.body);
  assert.deepEqual(deleteBody.prefixes, [
    "posters/old-orphaned-poster.png",
    "maps/old-orphaned-map.svg",
  ]);
});
