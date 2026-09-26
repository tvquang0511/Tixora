import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { RabbitMqService } from "../../../shared/rabbitmq";
import * as fs from "fs";
import * as readline from "readline";
import { randomUUID } from "crypto";

interface GuestImportPayload {
  jobId: string;
  concertId: string;
  filePath: string;
  userId: string;
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

@Injectable()
export class GuestImportConsumer implements OnModuleInit {
  private readonly logger = new Logger(GuestImportConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async onModuleInit() {
    try {
      await this.rabbitMqService.consume("guest.import.queue", async (msg) => {
        const payload: GuestImportPayload = JSON.parse(msg.content.toString());
        await this.handleGuestImport(payload);
      });
    } catch (err) {
      this.logger.error("Failed to start GuestImportConsumer", err);
    }
  }

  private async handleGuestImport(payload: GuestImportPayload): Promise<void> {
    const { jobId, concertId, filePath } = payload;
    this.logger.log(
      `Starting guest import job ${jobId} for concert ${concertId} from ${filePath}`,
    );

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      this.logger.error(`CSV file not found at path: ${filePath}`);
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error_message: `CSV file not found on disk at path: ${filePath}`,
          completed_at: new Date(),
        },
      });
      return;
    }

    // Update job status to PROCESSING
    await this.prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        progress_percentage: 0,
      },
    });

    try {
      // 1. Count total lines to determine total records for progress telemetry
      let totalLines = 0;
      const lineCountStream = fs.createReadStream(filePath);
      const rlCount = readline.createInterface({
        input: lineCountStream,
        crlfDelay: Infinity,
      });

      for await (const line of rlCount) {
        if (line.trim()) {
          totalLines++;
        }
      }
      rlCount.close();

      const totalRecords = totalLines > 1 ? totalLines - 1 : 0;
      this.logger.log(`Found ${totalRecords} records to process in CSV`);

      if (totalRecords === 0) {
        await this.prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            progress_percentage: 100,
            completed_at: new Date(),
            result_data: {
              processed: 0,
              message: "CSV file is empty or contains only headers",
            },
          },
        });
        return;
      }

      // 2. Stream parse the CSV and insert in batches of 500
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let isHeader = true;
      let headers: string[] = [];
      let headerMap: {
        email: number;
        fullName: number;
        ticketCategory: number;
      } = {
        email: -1,
        fullName: -1,
        ticketCategory: -1,
      };

      let processedCount = 0;
      const batch: Array<{
        email: string;
        fullName: string;
        ticketCategory: string;
      }> = [];

      for await (const line of rl) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (isHeader) {
          headers = parseCsvLine(trimmedLine);
          const normalized = headers.map((h) =>
            h
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, ""),
          );

          headerMap = {
            email: normalized.findIndex((h) => h === "email"),
            fullName: normalized.findIndex(
              (h) => h === "fullname" || h === "full_name" || h === "name",
            ),
            ticketCategory: normalized.findIndex(
              (h) =>
                h === "ticketcategory" ||
                h === "ticket_category" ||
                h === "category",
            ),
          };

          if (
            headerMap.email === -1 ||
            headerMap.fullName === -1 ||
            headerMap.ticketCategory === -1
          ) {
            throw new Error(
              `Invalid CSV headers. Required headers: 'email', 'full_name', 'ticket_category'. Found: ${headers.join(", ")}`,
            );
          }

          isHeader = false;
          continue;
        }

        const fields = parseCsvLine(trimmedLine);
        if (fields.length < headers.length) {
          // Skip malformed/incomplete lines
          continue;
        }

        const email = fields[headerMap.email]?.trim();
        const fullName = fields[headerMap.fullName]?.trim();
        const ticketCategory = fields[headerMap.ticketCategory]?.trim();

        if (!email || !fullName || !ticketCategory) {
          continue; // Skip lines with empty values for required fields
        }

        batch.push({ email, fullName, ticketCategory });

        if (batch.length === 500) {
          await this.upsertBatch(concertId, batch);
          processedCount += batch.length;
          batch.length = 0; // reset

          await this.prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
              progress_percentage: Math.min(
                100,
                Math.round((processedCount / totalRecords) * 100),
              ),
            },
          });
        }
      }
      rl.close();

      // Upsert remaining
      if (batch.length > 0) {
        await this.upsertBatch(concertId, batch);
        processedCount += batch.length;

        await this.prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            progress_percentage: Math.min(
              100,
              Math.round((processedCount / totalRecords) * 100),
            ),
          },
        });
      }

      // Mark job as COMPLETED
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress_percentage: 100,
          completed_at: new Date(),
          result_data: { processed: processedCount },
        },
      });

      this.logger.log(
        `Completed guest import job ${jobId}. Processed ${processedCount} records.`,
      );
    } catch (err) {
      this.logger.error(`Error processing guest import job ${jobId}`, err);
      await this.prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error_message: (err as Error).message,
          completed_at: new Date(),
        },
      });
    } finally {
      // 3. Cleanup: Delete the local temporary CSV file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted temporary CSV file at ${filePath}`);
        }
      } catch (cleanupErr) {
        this.logger.error(
          `Failed to delete temporary CSV file at ${filePath}`,
          cleanupErr,
        );
      }
    }
  }

  private async upsertBatch(
    concertId: string,
    batch: Array<{ email: string; fullName: string; ticketCategory: string }>,
  ): Promise<void> {
    if (batch.length === 0) return;

    // Deduplicate within the batch itself to prevent "ON CONFLICT DO UPDATE command cannot affect the same row twice" PostgreSQL error
    const uniqueMap = new Map<
      string,
      { email: string; fullName: string; ticketCategory: string }
    >();
    for (const record of batch) {
      uniqueMap.set(record.email.toLowerCase(), record);
    }
    const uniqueBatch = Array.from(uniqueMap.values());

    const valuesSql: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const record of uniqueBatch) {
      const id = randomUUID();
      valuesSql.push(
        `($${paramIndex}::uuid, $${paramIndex + 1}::uuid, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`,
      );
      params.push(
        id,
        concertId,
        record.email,
        record.fullName,
        record.ticketCategory,
        false,
      );
      paramIndex += 6;
    }

    const query = `
      INSERT INTO guest_lists (id, concert_id, email, full_name, ticket_category, is_scanned)
      VALUES ${valuesSql.join(", ")}
      ON CONFLICT (concert_id, email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        ticket_category = EXCLUDED.ticket_category
    `;

    await this.prisma.$executeRawUnsafe(query, ...params);
  }
}
