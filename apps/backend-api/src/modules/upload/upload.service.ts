import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as path from "path";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  async uploadFile(file: any, folder: string): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const bucketName = process.env.SUPABASE_BUCKET || "concert-assets";

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        "Supabase credentials are not set in environment variables",
      );
      throw new BadRequestException("Upload service is not configured");
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueFileName = `${randomUUID()}${fileExt}`;
    const filePath = `${folder}/${uniqueFileName}`;

    const url = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": file.mimetype,
          "x-upsert": "true",
        },
        body: file.buffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to upload file to Supabase Storage: ${response.status} - ${errorText}`,
        );
        throw new BadRequestException("Failed to upload file to storage");
      }

      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
    } catch (error) {
      this.logger.error("Error during file upload to Supabase", error);
      throw new BadRequestException("Failed to upload file to storage");
    }
  }
}
