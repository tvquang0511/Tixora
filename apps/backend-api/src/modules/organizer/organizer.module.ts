import { Module } from "@nestjs/common";
import { OrganizerController } from "./controllers/organizer.controller";
import { EventCopilotController } from "./controllers/event-copilot.controller";
import { OrganizerService } from "./services/organizer.service";
import { EventCopilotService } from "./services/event-copilot.service";
import { PrismaService } from "../../shared/prisma.service";
import { GeminiClient } from "../../shared/ai/gemini.client";
import { PdfParserService } from "../../shared/pdf/pdf-parser.service";

@Module({
  controllers: [OrganizerController, EventCopilotController],
  providers: [
    OrganizerService,
    EventCopilotService,
    GeminiClient,
    PdfParserService,
    PrismaService,
  ],
  exports: [OrganizerService, EventCopilotService],
})
export class OrganizerModule {}
