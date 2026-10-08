import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { GeminiClient } from "../../../shared/ai/gemini.client";
import { PdfParserService } from "../../../shared/pdf/pdf-parser.service";
import { EventDraftDto } from "../dtos/event-draft.dto";

@Injectable()
export class EventCopilotService {
  private readonly logger = new Logger(EventCopilotService.name);

  constructor(
    private readonly geminiClient: GeminiClient,
    private readonly pdfParserService: PdfParserService,
  ) {}

  async generateDraftFromPdf(pdfBuffer: Buffer): Promise<EventDraftDto> {
    // 1. Extract clean text from PDF
    const cleanText = await this.pdfParserService.extractCleanText(pdfBuffer);
    this.logger.log(
      `Extracted ${cleanText.length} characters from PDF proposal. Dispatching to Gemini Event Copilot...`,
    );

    // Limit text sent to LLM to prevent extreme token usage (e.g. 50,000 chars is plenty for a 20-page proposal)
    const truncatedText = cleanText.slice(0, 50_000);

    const systemInstruction = `Bạn là một trợ lý AI chuyên nghiệp thuộc nền tảng bán vé Tixora.
Nhiệm vụ của bạn là đọc hiểu tài liệu kế hoạch sự kiện / proposal / press kit âm nhạc và trích xuất thông tin để điền tự động vào Form tạo sự kiện.

Yêu cầu bắt buộc:
1. Trả về định dạng JSON thuần túy (Valid JSON object), không bọc trong lời dẫn hay markdown thừa.
2. Các trường trong JSON gồm:
   - "name": Tên chính thức của concert / sự kiện (ngắn gọn, viết hoa trang trọng).
   - "description": Mô tả sự kiện đầy đủ, chuyên nghiệp, hấp dẫn gồm 2-3 đoạn văn bằng tiếng Việt.
   - "category": Một trong các giá trị: "CONCERT", "FESTIVAL", "ACOUSTIC", "WORKSHOP", "OTHER".
   - "suggested_location": Tên địa điểm, sân vận động hoặc nhà thi đấu nếu phát hiện trong tài liệu.
   - "performers": Mảng các chuỗi tên ca sĩ, ban nhạc, nghệ sĩ chính hoặc khách mời được nêu trong tài liệu (ví dụ: ["Chillies", "Vũ"]).
   - "ai_bio": Đoạn tóm tắt (2-3 câu) về điểm nhấn đặc sắc của đêm nhạc và lý do khán giả không nên bỏ lỡ để hiển thị công khai trên trang bán vé.
   - "house_rules": Tóm tắt các lưu ý tham dự, độ tuổi tối thiểu và danh mục đồ cấm mang vào (nếu có).
   - "suggested_ticket_tiers": Mảng các hạng vé dự kiến phát hiện trong tài liệu (mỗi phần tử có "name" và "estimated_price" là số nguyên VND nếu có).
3. Nếu tài liệu không nêu rõ một trường nào đó, hãy suy luận hợp lý dựa trên ngữ cảnh hoặc trả về chuỗi rỗng / mảng rỗng, tuyệt đối không bịa đặt tên nghệ sĩ hay thông tin sai lệch nghiêm trọng.`;

    const userPrompt = `Dưới đây là nội dung bóc tách từ tài liệu kế hoạch sự kiện:

---
${truncatedText}
---

Hãy trích xuất thông tin và trả về đúng JSON Schema đã quy định.`;

    const rawResponse = await this.geminiClient.generateContent(userPrompt, {
      jsonMode: true,
      systemInstruction,
    });

    try {
      const parsed = this.parseJsonSafely(rawResponse);
      return this.sanitizeDraft(parsed);
    } catch (parseError: any) {
      this.logger.error("Failed to parse Gemini JSON output", parseError);
      throw new BadRequestException(
        "AI không thể phân tích cấu trúc dữ liệu từ tệp PDF này. Vui lòng thử lại hoặc nhập thủ công.",
      );
    }
  }

  private parseJsonSafely(rawText: string): any {
    // Strip markdown code fences if present (e.g. ```json ... ```)
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(cleaned);
  }

  private sanitizeDraft(data: any): EventDraftDto {
    const validCategories = [
      "CONCERT",
      "FESTIVAL",
      "ACOUSTIC",
      "WORKSHOP",
      "OTHER",
    ];
    const category = validCategories.includes(
      String(data.category).toUpperCase(),
    )
      ? String(data.category).toUpperCase()
      : "CONCERT";

    const performers = Array.isArray(data.performers)
      ? data.performers
          .map((p: any) => String(p).trim())
          .filter((p: string) => p.length > 0)
      : [];

    const suggested_ticket_tiers = Array.isArray(data.suggested_ticket_tiers)
      ? data.suggested_ticket_tiers
          .filter((t: any) => t && typeof t.name === "string" && t.name.trim())
          .map((t: any) => ({
            name: String(t.name).trim(),
            estimated_price:
              typeof t.estimated_price === "number" && t.estimated_price > 0
                ? Math.round(t.estimated_price)
                : undefined,
          }))
      : [];

    return {
      name:
        typeof data.name === "string" && data.name.trim()
          ? data.name.trim()
          : "Sự Kiện Âm Nhạc Mới",
      description:
        typeof data.description === "string" && data.description.trim()
          ? data.description.trim()
          : "Thông tin chi tiết về sự kiện sẽ được cập nhật sớm.",
      category,
      suggested_location:
        typeof data.suggested_location === "string" &&
        data.suggested_location.trim()
          ? data.suggested_location.trim()
          : undefined,
      performers,
      ai_bio:
        typeof data.ai_bio === "string" && data.ai_bio.trim()
          ? data.ai_bio.trim()
          : "Đêm nhạc quy tụ những màn trình diễn đặc sắc mang đến trải nghiệm khó quên cho khán giả.",
      house_rules:
        typeof data.house_rules === "string" && data.house_rules.trim()
          ? data.house_rules.trim()
          : undefined,
      suggested_ticket_tiers,
    };
  }
}
