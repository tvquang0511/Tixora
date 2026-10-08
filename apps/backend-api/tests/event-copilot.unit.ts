import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require("pdf-parse");

const mockGetText = fn().mockResolvedValue({
  text: "CONCERT CHILLIES TOUR 2026\nĐêm nhạc tại Sân vận động Quân khu 7 với dàn nghệ sĩ Chillies, Vũ, Trang.\nGiá vé VIP 1.500.000đ, GA 600.000đ.\nQuy định: 12 tuổi trở lên.",
});
const mockPdfParseClass = fn().mockImplementation(() => {
  return {
    getText: mockGetText,
  };
});
pdfParseModule.PDFParse = mockPdfParseClass;

import { GeminiClient } from "../src/shared/ai/gemini.client";
import { PdfParserService } from "../src/shared/pdf/pdf-parser.service";
import { EventCopilotService } from "../src/modules/organizer/services/event-copilot.service";
import { EventCopilotController } from "../src/modules/organizer/controllers/event-copilot.controller";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
  mockPdfParseClass.mockClear();
  mockGetText.mockClear();
});

// ==========================================
// 1. PDF PARSER SERVICE TESTS
// ==========================================

test("PdfParserService successfully extracts and cleans text from PDF buffer", async () => {
  const service = new PdfParserService();
  const buffer = Buffer.from("%PDF-1.4 Mock PDF content");
  const result = await service.extractCleanText(buffer);

  assert.ok(result.includes("CONCERT CHILLIES TOUR 2026"));
  assert.ok(result.includes("Chillies, Vũ, Trang"));
});

test("PdfParserService throws BadRequestException when buffer is empty", async () => {
  const service = new PdfParserService();
  await assert.rejects(
    () => service.extractCleanText(Buffer.alloc(0)),
    /PDF buffer is empty/,
  );
});

test("PdfParserService throws BadRequestException when extracted text is too short", async () => {
  mockGetText.mockResolvedValueOnce({ text: "abc" });
  const service = new PdfParserService();
  await assert.rejects(
    () => service.extractCleanText(Buffer.from("short")),
    /Tài liệu PDF không chứa nội dung văn bản đọc được/,
  );
});

// ==========================================
// 2. GEMINI CLIENT TESTS
// ==========================================

test("GeminiClient sends structured request and returns candidate text", async () => {
  process.env.GEMINI_API_KEY = "test-key";

  const expectedJson = JSON.stringify({
    name: "Live Concert Chillies",
    category: "CONCERT",
  });
  global.fetch = fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: expectedJson }] } }],
    }),
  }) as any;

  const client = new GeminiClient();
  const result = await client.generateContent("Extract event", {
    jsonMode: true,
  });

  assert.equal(result, expectedJson);
  const calls = (global.fetch as any).mock.calls;
  assert.equal(calls.length, 1);
  const [url, init] = calls[0];
  assert.ok(url.includes("test-key"));
  const sentBody = JSON.parse(init.body);
  assert.equal(sentBody.generationConfig?.responseMimeType, "application/json");
});

test("GeminiClient falls back to mock response when LLM_MOCK_ENABLED=true", async () => {
  delete process.env.GEMINI_API_KEY;
  process.env.LLM_MOCK_ENABLED = "true";

  const client = new GeminiClient();
  const result = await client.generateContent("Some prompt", {
    jsonMode: true,
  });

  const parsed = JSON.parse(result);
  assert.ok(parsed.name);
  assert.ok(parsed.category);
});

test("GeminiClient throws error when key is missing and mock mode is off", async () => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.LLM_MOCK_ENABLED;

  const client = new GeminiClient();
  await assert.rejects(
    () => client.generateContent("Some prompt"),
    /GEMINI_API_KEY is not configured/,
  );
});

// ==========================================
// 3. EVENT COPILOT SERVICE TESTS
// ==========================================

test("EventCopilotService successfully parses PDF and formats EventDraftDto", async () => {
  const geminiResponse = JSON.stringify({
    name: "CHILLIES LIVE TOUR 2026",
    description: "Đêm nhạc hoành tráng của ban nhạc Chillies tại TP.HCM",
    category: "CONCERT",
    suggested_location: "Sân vận động Quân khu 7",
    performers: ["Chillies", "Vũ", "Trang"],
    ai_bio: "Đêm nhạc bùng nổ quy tụ những bản hit cảm xúc.",
    house_rules: "Độ tuổi 12+.",
    suggested_ticket_tiers: [
      { name: "VIP", estimated_price: 1500000 },
      { name: "GA", estimated_price: 600000 },
    ],
  });

  const mockGeminiClient = {
    generateContent: fn().mockResolvedValue(geminiResponse),
  } as any;

  const pdfParserService = new PdfParserService();
  const service = new EventCopilotService(mockGeminiClient, pdfParserService);

  const draft = await service.generateDraftFromPdf(Buffer.from("dummy-pdf"));

  assert.equal(draft.name, "CHILLIES LIVE TOUR 2026");
  assert.equal(draft.category, "CONCERT");
  assert.deepEqual(draft.performers, ["Chillies", "Vũ", "Trang"]);
  assert.equal(draft.suggested_ticket_tiers?.length, 2);
  assert.equal(draft.suggested_ticket_tiers?.[0].estimated_price, 1500000);
});

test("EventCopilotService handles markdown code block fences in Gemini response", async () => {
  const fencedResponse =
    '```json\n{"name": "Encore Show", "performers": ["Artist A"]}\n```';
  const mockGeminiClient = {
    generateContent: fn().mockResolvedValue(fencedResponse),
  } as any;

  const pdfParserService = new PdfParserService();
  const service = new EventCopilotService(mockGeminiClient, pdfParserService);

  const draft = await service.generateDraftFromPdf(Buffer.from("dummy-pdf"));

  assert.equal(draft.name, "Encore Show");
  assert.deepEqual(draft.performers, ["Artist A"]);
  assert.equal(draft.category, "CONCERT"); // fallback valid category
});

// ==========================================
// 4. EVENT COPILOT CONTROLLER TESTS
// ==========================================

test("EventCopilotController rejects request when file is missing", async () => {
  const controller = new EventCopilotController({} as any);
  await assert.rejects(
    () => controller.generateDraftFromPdf(null),
    /Vui lòng tải lên một tệp tài liệu PDF/,
  );
});

test("EventCopilotController rejects non-PDF file", async () => {
  const controller = new EventCopilotController({} as any);
  const badFile = {
    mimetype: "image/png",
    originalname: "poster.png",
    buffer: Buffer.from("image"),
  };
  await assert.rejects(
    () => controller.generateDraftFromPdf(badFile),
    /Chỉ chấp nhận tệp có định dạng .pdf/,
  );
});

test("EventCopilotController delegates valid PDF to EventCopilotService", async () => {
  const mockDraft = { name: "Test Concert", performers: [] } as any;
  const mockService = {
    generateDraftFromPdf: fn().mockResolvedValue(mockDraft),
  };

  const controller = new EventCopilotController(mockService as any);
  const goodFile = {
    mimetype: "application/pdf",
    originalname: "proposal.pdf",
    buffer: Buffer.from("valid-pdf-buffer"),
  };

  const result = await controller.generateDraftFromPdf(goodFile);
  assert.equal(result, mockDraft);
  assert.equal((mockService.generateDraftFromPdf as any).mock.calls.length, 1);
});
