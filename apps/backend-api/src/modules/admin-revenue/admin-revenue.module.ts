import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma.service";
import { GeminiClient } from "../../shared/ai/gemini.client";
import { RedisModule } from "../../shared/redis/redis.module";
import { AdminRevenueController } from "./controllers/admin-revenue.controller";
import { AdminRevenueAiController } from "./controllers/admin-revenue-ai.controller";
import { AdminRevenueService } from "./services/admin-revenue.service";
import { AdminRevenueAiService } from "./services/admin-revenue-ai.service";

@Module({
  imports: [RedisModule],
  controllers: [AdminRevenueController, AdminRevenueAiController],
  providers: [
    AdminRevenueService,
    AdminRevenueAiService,
    GeminiClient,
    PrismaService,
  ],
  exports: [AdminRevenueService, AdminRevenueAiService],
})
export class AdminRevenueModule {}
