import { Module } from "@nestjs/common";
import { OrganizerController } from "./controllers/organizer.controller";
import { OrganizerService } from "./services/organizer.service";
import { PrismaService } from "../../shared/prisma.service";

@Module({
  controllers: [OrganizerController],
  providers: [OrganizerService, PrismaService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
