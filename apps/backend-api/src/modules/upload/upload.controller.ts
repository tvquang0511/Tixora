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
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/guards/jwt-auth.guard";
import { RolesGuard } from "../../shared/guards/roles.guard";
import { Roles } from "../../shared/decorators/roles.decorator";
import { UploadService } from "./upload.service";

@ApiTags("Upload")
@Controller("uploads")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload concert image poster (Admin/Organizer)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }

    // Validate mime-type
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
      );
    }

    const url = await this.uploadService.uploadFile(file, "posters");
    return { url };
  }

  @Post("svg")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "ORGANIZER")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload seating map SVG (Admin/Organizer)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadSvg(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 2MB limit");
    }

    // Validate mime-type (SVG)
    const allowedMimeTypes = ["image/svg+xml"];
    const hasSvgMime = allowedMimeTypes.includes(file.mimetype);
    const hasSvgExt = file.originalname?.toLowerCase().endsWith(".svg");
    if (!hasSvgMime && !hasSvgExt) {
      throw new BadRequestException(
        "Invalid file type. Only SVG files are allowed.",
      );
    }

    // Force mimetype to image/svg+xml in case multer parsed it differently
    if (!file.mimetype || file.mimetype === "application/octet-stream") {
      file.mimetype = "image/svg+xml";
    }

    const url = await this.uploadService.uploadFile(file, "maps");
    return { url };
  }
}
