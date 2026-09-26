import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";
import { UploadService } from "../src/modules/upload/upload.service";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test("UploadService uploadFile success returns public URL", async () => {
  process.env.SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_KEY = "test-key";
  process.env.SUPABASE_BUCKET = "test-bucket";

  const mockResponse = {
    ok: true,
    text: async () => "success",
  };
  global.fetch = fn().mockResolvedValue(mockResponse) as any;

  const service = new UploadService();
  const file = {
    originalname: "test-image.png",
    mimetype: "image/png",
    buffer: Buffer.from("test-data"),
  };

  const result = await service.uploadFile(file, "posters");

  assert.ok(
    result.startsWith(
      "https://supabase.example.com/storage/v1/object/public/test-bucket/posters/",
    ),
  );
  assert.ok(result.endsWith(".png"));

  const fetchCalls = (global.fetch as any).mock.calls;
  assert.equal(fetchCalls.length, 1);
  const [callUrl, callInit] = fetchCalls[0];
  assert.ok(
    callUrl.startsWith(
      "https://supabase.example.com/storage/v1/object/test-bucket/posters/",
    ),
  );
  assert.equal(callInit.method, "POST");
  assert.equal(callInit.headers["Authorization"], "Bearer test-key");
  assert.equal(callInit.headers["Content-Type"], "image/png");
  assert.equal(callInit.headers["x-upsert"], "true");
});

test("UploadService uploadFile throws error when SUPABASE_URL or SUPABASE_KEY is missing", async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;

  const service = new UploadService();
  const file = {
    originalname: "test.png",
    mimetype: "image/png",
    buffer: Buffer.from(""),
  };

  await assert.rejects(
    async () => {
      await service.uploadFile(file, "posters");
    },
    (err: any) => {
      assert.equal(err.message, "Upload service is not configured");
      return true;
    },
  );
});

test("UploadService uploadFile throws error when Supabase Storage returns non-ok response", async () => {
  process.env.SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_KEY = "test-key";

  const mockResponse = {
    ok: false,
    status: 400,
    text: async () => "Invalid key or token",
  };
  global.fetch = fn().mockResolvedValue(mockResponse) as any;

  const service = new UploadService();
  const file = {
    originalname: "test.png",
    mimetype: "image/png",
    buffer: Buffer.from(""),
  };

  await assert.rejects(
    async () => {
      await service.uploadFile(file, "posters");
    },
    (err: any) => {
      assert.equal(err.message, "Failed to upload file to storage");
      return true;
    },
  );
});

test("UploadService uploadFile throws error when fetch throws network error", async () => {
  process.env.SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_KEY = "test-key";

  global.fetch = fn().mockRejectedValue(
    new Error("Network connection failed"),
  ) as any;

  const service = new UploadService();
  const file = {
    originalname: "test.png",
    mimetype: "image/png",
    buffer: Buffer.from(""),
  };

  await assert.rejects(
    async () => {
      await service.uploadFile(file, "posters");
    },
    (err: any) => {
      assert.equal(err.message, "Failed to upload file to storage");
      return true;
    },
  );
});
