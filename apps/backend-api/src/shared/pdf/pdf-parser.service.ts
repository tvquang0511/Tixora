import { Injectable, Logger, BadRequestException } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require("pdf-parse");

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  async extractCleanText(pdfBuffer: Buffer): Promise<string> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new BadRequestException("PDF buffer is empty");
    }

    try {
      // Support both new PDFParse class and legacy function export
      let rawText = "";
      if (typeof pdfParseModule.PDFParse === "function") {
        const parser = new pdfParseModule.PDFParse({
          data: new Uint8Array(pdfBuffer),
        });
        const result = await parser.getText();
        rawText = result?.text || "";
      } else if (typeof pdfParseModule === "function") {
        const result = await pdfParseModule(pdfBuffer);
        rawText = result?.text || "";
      } else {
        throw new Error("Unsupported pdf-parse module interface");
      }

      /* eslint-disable no-control-regex */
      const controlCharsRegex = new RegExp(
        "[\\u0000-\\u0008\\u000B-\\u000C\\u000E-\\u001F]",
        "g",
      );
      /* eslint-enable no-control-regex */

      const cleanText = rawText
        .replace(controlCharsRegex, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n\s*\n+/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

      if (!cleanText || cleanText.length < 10) {
        throw new BadRequestException(
          "Tài liệu PDF không chứa nội dung văn bản đọc được hoặc tài liệu chỉ chứa ảnh scan thuần túy.",
        );
      }

      return cleanText;
    } catch (error: any) {
      this.logger.error("Failed to parse PDF document", error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Không thể xử lý tệp PDF: ${error.message || "Định dạng file không hợp lệ"}`,
      );
    }
  }
}
