import { Module } from "@nestjs/common";
import { StorageGcService } from "./services/storage-gc.service";
import { PrismaService } from "../../shared/prisma.service";
import { WorkerController } from "./controllers/worker.controller";
import { GuestImportConsumer } from "./consumers/guest-import.consumer";
import { WorkerService } from "./services/worker.service";
import { LlmService } from "./services/llm.service";
import { BioConsumer } from "./consumers/bio.consumer";

@Module({
  controllers: [WorkerController],
  providers: [
    PrismaService,
    StorageGcService,
    GuestImportConsumer,
    WorkerService,
    LlmService,
    BioConsumer,
  ],
  exports: [StorageGcService, WorkerService],
})
export class WorkerModule {}
