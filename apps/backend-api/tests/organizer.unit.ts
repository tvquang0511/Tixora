import test from "node:test";
import assert from "node:assert/strict";
import { fn } from "jest-mock";
import { OrganizerService } from "../src/modules/organizer/services/organizer.service";
import { ConcertService } from "../src/modules/catalog/services/concert.service";
import { ConcertStatus } from "../src/modules/catalog/constants/concert-status.enum";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

function createOrganizerService() {
  const prisma = {
    organizerProfile: {
      findUnique: fn(),
      findMany: fn(),
      count: fn(),
      create: fn(),
      update: fn(),
      upsert: fn(),
    },
    role: {
      findFirst: fn(),
    },
    userRole: {
      upsert: fn(),
    },
    user: {
      update: fn(),
    },
    $transaction: fn(),
  };

  const service = new OrganizerService(prisma as any);
  (service as any).logger = {
    log: fn(),
    warn: fn(),
    error: fn(),
  };

  return { service, prisma };
}

function createConcertService() {
  const concertRepo = {
    findManyWithPagination: fn(),
    findById: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
  };

  const redisService = {
    getJson: fn(),
    setJson: fn(),
    delete: fn(),
    deleteByPattern: fn(),
    getClient: fn().mockReturnValue({ isOpen: false }),
  };

  const ticketingService = {
    getOrSeedInventory: fn(),
  };

  const service = new ConcertService(
    concertRepo as any,
    redisService as any,
    ticketingService as any,
  );
  (service as any).logger = {
    log: fn(),
    warn: fn(),
    error: fn(),
  };

  return { service, concertRepo, redisService };
}

test("OrganizerService.apply: successfully creates or updates profile with PENDING status", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue(null);
  prisma.organizerProfile.upsert.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    organization_name: "Saigon Music",
    tax_code_or_id: "0123456789",
    phone_number: "0901234567",
    status: "PENDING",
  });

  const result = await service.apply("user-1", {
    organization_name: "Saigon Music",
    tax_code_or_id: "0123456789",
    phone_number: "0901234567",
  });

  assert.equal(result.status, "PENDING");
  assert.equal(prisma.organizerProfile.upsert.mock.calls.length, 1);
});

test("OrganizerService.apply: throws BadRequestException if user is already an approved organizer", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    status: "APPROVED",
  });

  await assert.rejects(
    () =>
      service.apply("user-1", {
        organization_name: "Saigon Music",
        tax_code_or_id: "0123456789",
        phone_number: "0901234567",
      }),
    BadRequestException,
  );
});

test("OrganizerService.approveRequest: updates status to APPROVED and grants Organizer role", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    status: "PENDING",
    user: { id: "user-1", email: "test@example.com", full_name: "Test" },
  });
  prisma.role.findFirst.mockResolvedValue({
    id: "role-organizer",
    name: "Organizer",
  });

  prisma.$transaction.mockImplementation(async (callback: any) => {
    const tx = {
      organizerProfile: {
        update: fn().mockResolvedValue({
          id: "profile-1",
          status: "APPROVED",
          approved_at: new Date(),
        }),
      },
      userRole: {
        upsert: fn().mockResolvedValue({}),
      },
    };
    return callback(tx);
  });

  const result = await service.approveRequest("profile-1");
  assert.equal(result.status, "APPROVED");
  assert.equal(prisma.$transaction.mock.calls.length, 1);
});

test("OrganizerService.rejectRequest: updates status to REJECTED with rejection_reason", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    status: "PENDING",
  });
  prisma.organizerProfile.update.mockResolvedValue({
    id: "profile-1",
    status: "REJECTED",
    rejection_reason: "Missing business license",
  });

  const result = await service.rejectRequest("profile-1", {
    rejection_reason: "Missing business license",
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejection_reason, "Missing business license");
});

test("OrganizerService.updateProfile: successfully updates approved organizer profile and user full_name", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    status: "APPROVED",
  });
  prisma.organizerProfile.update.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    organization_name: "Saigon Entertainment Group",
    phone_number: "0911223344",
    status: "APPROVED",
    user: { id: "user-1", email: "user@tixora.vn", full_name: "Nguyễn Văn B" },
  });

  const result = await service.updateProfile("user-1", {
    organization_name: "Saigon Entertainment Group",
    phone_number: "0911223344",
    full_name: "Nguyễn Văn B",
  });

  assert.equal(result.organization_name, "Saigon Entertainment Group");
  assert.equal(prisma.user.update.mock.calls.length, 1);
  assert.equal(prisma.organizerProfile.update.mock.calls.length, 1);
});

test("OrganizerService.updateProfile: throws BadRequestException if organizer profile is not APPROVED", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue({
    id: "profile-1",
    user_id: "user-1",
    status: "PENDING",
  });

  await assert.rejects(
    () =>
      service.updateProfile("user-1", {
        organization_name: "Test Org",
      }),
    BadRequestException,
  );
});

test("OrganizerService.updateProfile: throws NotFoundException if organizer profile does not exist", async () => {
  const { service, prisma } = createOrganizerService();

  prisma.organizerProfile.findUnique.mockResolvedValue(null);

  await assert.rejects(
    () =>
      service.updateProfile("user-unknown", {
        organization_name: "Test Org",
      }),
    (err: any) => err.name === "NotFoundException",
  );
});

test("ConcertService.createConcert: sets organizer_id and PENDING_REVIEW if created by Organizer", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.create.mockImplementation(async (data: any) => ({
    id: "concert-1",
    ...data,
  }));

  const payload: any = {
    name: "Indie Night",
    start_time: "2026-10-01T19:00:00.000Z",
    end_time: "2026-10-01T22:00:00.000Z",
    status: ConcertStatus.PUBLISHED,
  };

  const currentUser = { sub: "organizer-user-1", roles: ["ORGANIZER"] };
  const result = await service.createConcert(payload, currentUser);

  assert.equal(result.organizer_id, "organizer-user-1");
  assert.equal(result.status, ConcertStatus.PENDING_REVIEW);
});

test("ConcertService.updateConcert: throws ForbiddenException if Organizer tries to update someone else concert", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.findById.mockResolvedValue({
    id: "concert-1",
    organizer_id: "other-organizer",
    status: ConcertStatus.PENDING_REVIEW,
  });

  const currentUser = { sub: "my-organizer-id", roles: ["ORGANIZER"] };

  await assert.rejects(
    () =>
      service.updateConcert(
        "concert-1",
        { name: "Hacked Name" } as any,
        currentUser,
      ),
    ForbiddenException,
  );
});

test("ConcertService.deleteConcert: throws ForbiddenException if Organizer tries to delete someone else concert", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.findById.mockResolvedValue({
    id: "concert-1",
    organizer_id: "other-organizer",
    status: ConcertStatus.DRAFT,
  });

  const currentUser = { sub: "my-organizer-id", roles: ["ORGANIZER"] };

  await assert.rejects(
    () => service.deleteConcert("concert-1", currentUser),
    ForbiddenException,
  );
});

test("ConcertService.getConcerts: throws ForbiddenException if Organizer queries another organizer_id", async () => {
  const { service } = createConcertService();

  const currentUser = { sub: "my-organizer-id", roles: ["ORGANIZER"] };

  await assert.rejects(
    () =>
      service.getConcerts({ organizer_id: "other-organizer-id" }, currentUser),
    ForbiddenException,
  );
});

test("ConcertService.updateConcert: throws BadRequestException when changing from PUBLISHED to DRAFT", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.findById.mockResolvedValue({
    id: "concert-1",
    organizer_id: "admin-1",
    status: ConcertStatus.PUBLISHED,
  });

  await assert.rejects(
    () =>
      service.updateConcert("concert-1", {
        status: ConcertStatus.DRAFT,
      } as any),
    (err: any) => {
      assert.equal(err.name, "BadRequestException");
      assert.match(err.message, /bản nháp/i);
      return true;
    },
  );
});

test("ConcertService.updateConcert: throws BadRequestException when changing from PAUSED to DRAFT", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.findById.mockResolvedValue({
    id: "concert-1",
    organizer_id: "admin-1",
    status: ConcertStatus.PAUSED,
  });

  await assert.rejects(
    () =>
      service.updateConcert("concert-1", {
        status: ConcertStatus.DRAFT,
      } as any),
    (err: any) => {
      assert.equal(err.name, "BadRequestException");
      assert.match(err.message, /bản nháp/i);
      return true;
    },
  );
});

test("ConcertService.updateConcert: throws BadRequestException when changing from CANCELLED to any status", async () => {
  const { service, concertRepo } = createConcertService();

  concertRepo.findById.mockResolvedValue({
    id: "concert-1",
    organizer_id: "admin-1",
    status: ConcertStatus.CANCELLED,
  });

  await assert.rejects(
    () =>
      service.updateConcert("concert-1", {
        status: ConcertStatus.PUBLISHED,
      } as any),
    (err: any) => {
      assert.equal(err.name, "BadRequestException");
      assert.match(err.message, /đã ở trạng thái/i);
      return true;
    },
  );
});
