import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma.service";
import { OrganizerRevenueController } from "./controllers/organizer-revenue.controller";
import { OrganizerRevenueService } from "./services/organizer-revenue.service";

@Module({
  controllers: [OrganizerRevenueController],
  providers: [OrganizerRevenueService, PrismaService],
  exports: [OrganizerRevenueService],
})
export class OrganizerRevenueModule {}
