import { Injectable, Logger } from "@nestjs/common";

export class NonRetryableLlmError extends Error {}

export interface GeminiGenerateOptions {
  jsonMode?: boolean;
  systemInstruction?: string;
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  async generateContent(
    prompt: string,
    options: GeminiGenerateOptions = {},
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const mockEnabled = process.env.LLM_MOCK_ENABLED === "true";

    if (!apiKey) {
      if (mockEnabled) {
        this.logger.warn(
          "GEMINI_API_KEY is missing; LLM_MOCK_ENABLED is true. Using mock response.",
        );
        return this.generateMockResponse(prompt, options);
      }
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const timeoutMs = this.positiveNumber(
      process.env.GEMINI_TIMEOUT_MS,
      60_000,
    );
    const maxRetries = this.positiveNumber(process.env.GEMINI_MAX_RETRIES, 3);
    const retryDelayMs = this.nonNegativeNumber(
      process.env.GEMINI_RETRY_DELAY_MS,
      1_000,
    );

    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const requestBody: Record<string, any> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (options.systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    if (options.jsonMode) {
      requestBody.generationConfig = {
        responseMimeType: "application/json",
      };
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Dispatching prompt to Gemini (${model}) - attempt ${attempt}/${maxRetries}`,
        );
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const details = await response.text();
          const error = new Error(
            `Gemini API returned ${response.status}: ${details}`,
          );
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            throw new NonRetryableLlmError(error.message);
          }
          throw error;
        }

        const data = (await response.json()) as any;
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText || typeof candidateText !== "string") {
          throw new Error("Gemini API returned no text in candidate response");
        }
        return candidateText.trim();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Gemini attempt ${attempt} failed: ${lastError.message}`,
        );
        if (error instanceof NonRetryableLlmError || attempt >= maxRetries) {
          break;
        }
        if (retryDelayMs > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, attempt * retryDelayMs),
          );
        }
      }
    }

    if (mockEnabled) {
      this.logger.warn(
        `Gemini call failed; falling back to mock mode: ${lastError?.message}`,
      );
      return this.generateMockResponse(prompt, options);
    }

    throw new Error(
      `Gemini request failed after ${maxRetries} attempts: ${lastError?.message || "unknown error"}`,
    );
  }

  private positiveNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private nonNegativeNumber(
    value: string | undefined,
    fallback: number,
  ): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private generateMockResponse(
    prompt: string,
    options: GeminiGenerateOptions,
  ): string {
    if (options.jsonMode) {
      return JSON.stringify({
        name: "Live Concert Âm Nhạc Trẻ",
        description:
          "Đêm nhạc quy tụ những nghệ sĩ được yêu thích với hệ thống âm thanh ánh sáng đạt chuẩn quốc tế, mang lại trải nghiệm đỉnh cao cho khán giả.",
        category: "CONCERT",
        suggested_location: "Sân vận động Quân khu 7, TP.HCM",
        performers: ["Nghệ sĩ Khách Mời", "Ban Nhạc Sống"],
        ai_bio:
          "Sự kết hợp bùng nổ giữa những giai điệu thịnh hành và phong cách trình diễn cuốn hút. Đêm diễn hứa hẹn mang lại những khoảnh khắc thăng hoa khó quên.",
        house_rules:
          "Độ tuổi tham dự: 12 tuổi trở lên. Không mang đồ uống có cồn, máy ảnh chuyên nghiệp hoặc vũ khí vào khu vực biểu diễn.",
        suggested_ticket_tiers: [
          { name: "VIP", estimated_price: 1500000 },
          { name: "GA Sân", estimated_price: 650000 },
          { name: "Khán đài", estimated_price: 450000 },
        ],
      });
    }

    return "Mock LLM text response generated via fallback provider.";
  }
}
