import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { ApplyOrganizerDto } from "../dtos/apply-organizer.dto";
import { RejectOrganizerDto } from "../dtos/reject-organizer.dto";
import { OrganizerRequestQueryDto } from "../dtos/organizer-request-query.dto";
import { PaginationMetaDto } from "../../../shared/dtos/pagination-meta.dto";

@Injectable()
export class OrganizerService {
  private readonly logger = new Logger(OrganizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: ApplyOrganizerDto) {
    const existing = await this.prisma.organizerProfile.findUnique({
      where: { user_id: userId },
    });

    if (existing && existing.status === "APPROVED") {
      throw new BadRequestException(
        "Tài khoản đã là Ban Tổ Chức được phê duyệt",
      );
    }

    const profile = await this.prisma.organizerProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        organization_name: dto.organization_name,
        tax_code_or_id: dto.tax_code_or_id,
        phone_number: dto.phone_number,
        business_license_url: dto.business_license_url,
        portfolio_url: dto.portfolio_url,
        bank_account_name: dto.bank_account_name,
        bank_account_number: dto.bank_account_number,
        bank_name: dto.bank_name,
        status: "PENDING",
        rejection_reason: null,
      },
      update: {
        organization_name: dto.organization_name,
        tax_code_or_id: dto.tax_code_or_id,
        phone_number: dto.phone_number,
        business_license_url: dto.business_license_url,
        portfolio_url: dto.portfolio_url,
        bank_account_name: dto.bank_account_name,
        bank_account_number: dto.bank_account_number,
        bank_name: dto.bank_name,
        status: "PENDING",
        rejection_reason: null,
      },
      include: {
        user: {
          select: { id: true, email: true, full_name: true },
        },
      },
    });

    this.logger.log(`Organizer application submitted by user ${userId}`);
    return profile;
  }

  async getMyApplication(userId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { id: true, email: true, full_name: true },
        },
      },
    });

    return profile;
  }

  async getRequests(query: OrganizerRequestQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = Math.max(0, (page - 1) * limit);
    const trimmedSearch = query.search?.trim();
    const status = query.status?.trim();

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (trimmedSearch) {
      where.OR = [
        { organization_name: { contains: trimmedSearch, mode: "insensitive" } },
        { phone_number: { contains: trimmedSearch, mode: "insensitive" } },
        { tax_code_or_id: { contains: trimmedSearch, mode: "insensitive" } },
        { user: { email: { contains: trimmedSearch, mode: "insensitive" } } },
        {
          user: { full_name: { contains: trimmedSearch, mode: "insensitive" } },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizerProfile.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: { id: true, email: true, full_name: true, status: true },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      this.prisma.organizerProfile.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const meta = new PaginationMetaDto({
      totalItems: total,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    });

    return { data: items, meta };
  }

  async approveRequest(id: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException("Không tìm thấy yêu cầu đối tác");
    }

    if (profile.status === "APPROVED") {
      throw new BadRequestException("Hồ sơ đối tác này đã được phê duyệt");
    }

    const organizerRole = await this.prisma.role.findFirst({
      where: { name: { equals: "Organizer", mode: "insensitive" } },
    });

    if (!organizerRole) {
      throw new InternalServerErrorException(
        "Vai trò Organizer chưa được đồng bộ trong hệ thống",
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update profile to APPROVED
      const approvedProfile = await tx.organizerProfile.update({
        where: { id },
        data: {
          status: "APPROVED",
          approved_at: new Date(),
          rejection_reason: null,
        },
        include: {
          user: {
            select: { id: true, email: true, full_name: true, status: true },
          },
        },
      });

      // 2. Grant Organizer role to user
      await tx.userRole.upsert({
        where: {
          user_id_role_id: {
            user_id: profile.user_id,
            role_id: organizerRole.id,
          },
        },
        create: {
          user_id: profile.user_id,
          role_id: organizerRole.id,
        },
        update: {},
      });

      return approvedProfile;
    });

    this.logger.log(
      `Organizer request ${id} approved, user ${profile.user_id} promoted to Organizer`,
    );
    return updated;
  }

  async rejectRequest(id: string, dto: RejectOrganizerDto) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Không tìm thấy yêu cầu đối tác");
    }

    const updated = await this.prisma.organizerProfile.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejection_reason: dto.rejection_reason,
      },
      include: {
        user: {
          select: { id: true, email: true, full_name: true, status: true },
        },
      },
    });

    this.logger.log(
      `Organizer request ${id} rejected. Reason: ${dto.rejection_reason}`,
    );
    return updated;
  }

  async updateRequestStatus(
    id: string,
    dto: { status: "PENDING" | "APPROVED" | "REJECTED"; rejection_reason?: string },
  ) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException("Không tìm thấy yêu cầu đối tác");
    }

    if (dto.status === "APPROVED") {
      if (profile.status === "APPROVED") {
        return profile;
      }
      return this.approveRequest(id);
    }

    if (dto.status === "REJECTED") {
      return this.rejectRequest(id, {
        rejection_reason: dto.rejection_reason || "Từ chối bởi quản trị viên",
      });
    }

    // PENDING
    const updated = await this.prisma.organizerProfile.update({
      where: { id },
      data: {
        status: "PENDING",
        rejection_reason: null,
        approved_at: null,
      },
      include: {
        user: {
          select: { id: true, email: true, full_name: true, status: true },
        },
      },
    });

    this.logger.log(`Organizer request ${id} reset to PENDING`);
    return updated;
  }
}

