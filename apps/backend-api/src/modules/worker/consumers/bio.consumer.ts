import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { RabbitMqService } from "../../../shared/rabbitmq";
import { RedisService } from "../../../shared/redis";
import { LlmService } from "../services/llm.service";
import * as pdfParse from "pdf-parse";

interface BioMessagePayload {
  jobId: string;
  concertId: string;
  userId: string;
  pdfBase64: string;
  filename: string;
}

@Injectable()
export class BioConsumer implements OnModuleInit {
  private readonly logger = new Logger(BioConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly redisService: RedisService,
    private readonly llmService: LlmService,
  ) {}

  async onModuleInit() {
    try {
      await this.rabbitMqService.consume("ai.bio.queue", async (msg) => {
        const payload: BioMessagePayload = JSON.parse(msg.content.toString());
        await this.handleBioGeneration(payload);
      });
    } catch (err) {
      this.logger.error("Failed to start BioConsumer", err);
    }
  }

  private async handleBioGeneration(payload: BioMessagePayload): Promise<void> {
    const { jobId, concertId, pdfBase64, filename } = payload;
    this.logger.log(
      `[BioConsumer] Processing job ${jobId} for concert ${concertId} (File: ${filename})`,
    );

    try {
      // 1. Update status to PROCESSING (20%)
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
          progress_percentage: 20,
        },
      });

      // 2. Extract text from PDF
      this.logger.log(
        `[BioConsumer] Extracting text from PDF for job ${jobId}...`,
      );
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const parser = new pdfParse.PDFParse({ data: new Uint8Array(pdfBuffer) });
      const parsedPdf = await parser.getText();
      const rawText = parsedPdf.text || "";

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

      if (!cleanText) {
        throw new Error("Extracted PDF text is empty or unreadable.");
      }

      // Update progress to 50%
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          progress_percentage: 50,
        },
      });

      // 3. Call LLM to summarize bio
      this.logger.log(
        `[BioConsumer] Calling LLM to synthesize bio for job ${jobId}...`,
      );
      const synthesizedBio = await this.llmService.synthesizeBio(cleanText);

      // Update progress to 80%
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          progress_percentage: 80,
        },
      });

      // 4. Update Concert table
      this.logger.log(
        `[BioConsumer] Updating Concert ${concertId} with synthesized bio...`,
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.concert.update({
          where: { id: concertId },
          data: {
            ai_bio: synthesizedBio,
          },
        });
      });

      // Evict Redis caches to ensure updated bio is immediately visible
      await this.redisService.delete(`concerts:detail:${concertId}`);
      await this.redisService.deleteByPattern("concerts:list:*");

      // 5. Update BackgroundJob to COMPLETED
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress_percentage: 100,
          result_data: {
            bio: synthesizedBio,
          },
          completed_at: new Date(),
        },
      });

      this.logger.log(`[BioConsumer] Successfully completed job ${jobId}`);
    } catch (error: any) {
      this.logger.error(
        `[BioConsumer] Failed to process job ${jobId}: ${error.message}`,
        error,
      );

      // Fallback: update BackgroundJob status to FAILED
      try {
        await this.prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            progress_percentage: 100,
            error_message: error.message || "Unknown processing error",
            completed_at: new Date(),
          },
        });
      } catch (dbError) {
        this.logger.error(
          `[BioConsumer] Failed to write failure state to DB for job ${jobId}`,
          dbError,
        );
      }
    }
  }
}
