import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../../shared/prisma.service";

interface SupabaseFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

@Injectable()
export class StorageGcService {
  private readonly logger = new Logger(StorageGcService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Cron job to run every day at 3:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log("Starting Storage Garbage Collector routine...");
    try {
      await this.runCleanup();
      this.logger.log(
        "Storage Garbage Collector routine completed successfully.",
      );
    } catch (error) {
      this.logger.error(
        "Error during Storage Garbage Collector routine:",
        error,
      );
    }
  }

  async runCleanup(): Promise<number> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const bucketName = process.env.SUPABASE_BUCKET || "concert-assets";

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        "Supabase credentials are not set. Skipping Storage GC.",
      );
      return 0;
    }

    // 1. Get all active URLs from Database
    const concerts = await this.prisma.concert.findMany({
      select: {
        poster_url: true,
        svg_map_url: true,
      },
    });

    const activeUrls = new Set<string>();
    for (const c of concerts) {
      if (c.poster_url) activeUrls.add(c.poster_url.trim());
      if (c.svg_map_url) activeUrls.add(c.svg_map_url.trim());
    }

    // 2. Fetch files from Supabase Storage for 'posters' and 'maps'
    const folders = ["posters", "maps"];
    const orphanedPaths: string[] = [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const folder of folders) {
      const files = await this.listStorageFiles(bucketName, folder);
      for (const file of files) {
        // Skip directory placeholders or empty names
        if (!file.name || file.name === ".emptyFolderPlaceholder") {
          continue;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${folder}/${file.name}`;

        // Check if the file is older than 24 hours to avoid deleting files that are currently being uploaded
        const createdAtTime = new Date(file.created_at).getTime();
        const isOlderThan24Hours = createdAtTime < oneDayAgo;

        if (!activeUrls.has(publicUrl) && isOlderThan24Hours) {
          orphanedPaths.push(`${folder}/${file.name}`);
        }
      }
    }

    // 3. Delete orphaned files
    if (orphanedPaths.length > 0) {
      this.logger.log(
        `Found ${orphanedPaths.length} orphaned file(s) to delete: ${JSON.stringify(orphanedPaths)}`,
      );
      await this.deleteStorageFiles(bucketName, orphanedPaths);
      this.logger.log(
        `Successfully deleted ${orphanedPaths.length} file(s) from Storage.`,
      );
    } else {
      this.logger.log("No orphaned files found to delete.");
    }

    return orphanedPaths.length;
  }

  private async listStorageFiles(
    bucketName: string,
    folder: string,
  ): Promise<SupabaseFile[]> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const url = `${supabaseUrl}/storage/v1/object/list/${bucketName}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: folder,
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Failed to list files from Supabase Storage for folder ${folder}: ${response.status} - ${errorText}`,
      );
      return [];
    }

    return (await response.json()) as SupabaseFile[];
  }

  private async deleteStorageFiles(
    bucketName: string,
    paths: string[],
  ): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const url = `${supabaseUrl}/storage/v1/object/${bucketName}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefixes: paths,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete files from Storage: ${response.status} - ${errorText}`,
      );
    }
  }
}
