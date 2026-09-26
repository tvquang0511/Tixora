import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { RabbitMqService } from "../../../shared/rabbitmq";

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async generateBioJob(userId: string, concertId: string, file: any) {
    // 1. Verify concert exists
    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
    });
    if (!concert) {
      throw new NotFoundException(`Concert not found for id: ${concertId}`);
    }

    // 2. Create BackgroundJob record
    const job = await this.prisma.backgroundJob.create({
      data: {
        trigger_by_user_id: userId,
        job_type: "GENERATE_BIO",
        target_id: concertId,
        status: "PENDING",
        progress_percentage: 0,
        payload: {
          filename: file.originalname,
        },
      },
    });

    this.logger.log(
      `Created BackgroundJob ${job.id} with status PENDING for concert ${concertId}`,
    );

    // 3. Publish to RabbitMQ
    try {
      await this.rabbitMqService.publish("ai.bio.exchange", "ai.bio", {
        jobId: job.id,
        concertId,
        userId,
        pdfBase64: file.buffer.toString("base64"),
        filename: file.originalname,
      });
      this.logger.log(
        `Enqueued AI biography generation job ${job.id} to RabbitMQ`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to publish message to RabbitMQ for job ${job.id}, rolling back job to FAILED`,
        error,
      );
      // Mark job as failed immediately if queue publishing fails
      await this.prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          progress_percentage: 100,
          error_message: `Queue publish failed: ${error.message}`,
          completed_at: new Date(),
        },
      });
      throw error;
    }

    return job;
  }
}
