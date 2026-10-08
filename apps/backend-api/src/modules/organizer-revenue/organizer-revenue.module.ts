import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma.service";
import { GeminiClient } from "../../shared/ai/gemini.client";
import { RedisModule } from "../../shared/redis/redis.module";
import { OrganizerRevenueController } from "./controllers/organizer-revenue.controller";
import { OrganizerRevenueAiController } from "./controllers/organizer-revenue-ai.controller";
import { OrganizerRevenueService } from "./services/organizer-revenue.service";
import { OrganizerRevenueAiService } from "./services/organizer-revenue-ai.service";

@Module({
  imports: [RedisModule],
  controllers: [OrganizerRevenueController, OrganizerRevenueAiController],
  providers: [
    OrganizerRevenueService,
    OrganizerRevenueAiService,
    GeminiClient,
    PrismaService,
  ],
  exports: [OrganizerRevenueService, OrganizerRevenueAiService],
})
export class OrganizerRevenueModule {}
