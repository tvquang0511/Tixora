import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { EventCopilotService } from "../services/event-copilot.service";
import { EventDraftDto } from "../dtos/event-draft.dto";

@ApiTags("Organizer - AI Event Copilot")
@Controller("organizer/ai")
export class EventCopilotController {
  constructor(private readonly eventCopilotService: EventCopilotService) {}

  @Post("draft-from-pdf")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "ORGANIZER")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary:
      "Tự động trích xuất thông tin tạo sự kiện từ file PDF kế hoạch / Press Kit (Admin/Organizer)",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: {
          type: "string",
          format: "binary",
          description:
            "Tệp PDF kế hoạch sự kiện / proposal / press kit (tối đa 15MB)",
        },
      },
    },
  })
  @ApiOkResponse({
    type: EventDraftDto,
    description: "Bản nháp dữ liệu sự kiện được AI bóc tách",
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
      },
    }),
  )
  async generateDraftFromPdf(
    @UploadedFile() file: any,
  ): Promise<EventDraftDto> {
    if (!file) {
      throw new BadRequestException("Vui lòng tải lên một tệp tài liệu PDF.");
    }

    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = file.originalname?.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      throw new BadRequestException(
        "Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp có định dạng .pdf",
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("Tệp tải lên bị rỗng.");
    }

    return this.eventCopilotService.generateDraftFromPdf(file.buffer);
  }
}
