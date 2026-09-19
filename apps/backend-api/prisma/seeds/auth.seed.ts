import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import {
    BCRYPT_SALT,
    DEFAULT_PASSWORD,
    FAKER_SEED,
    permissions,
    rolePermissions,
    roles,
    staticUsers,
} from "./seed-data";
import { chunkArray } from "./seed-utils";

const AUDIENCE_COUNT = 10000;
const CHUNK_SIZE = 5000;

export async function seedAuth(prisma: PrismaClient) {
    faker.seed(FAKER_SEED);

    await prisma.role.createMany({ data: roles, skipDuplicates: true });
    await prisma.permission.createMany({ data: permissions, skipDuplicates: true });

    const roleRecords = await prisma.role.findMany({
        select: { id: true, name: true },
    });
    const permissionRecords = await prisma.permission.findMany({
        select: { id: true, code: true },
    });

    const roleByName = new Map(roleRecords.map((role) => [role.name, role.id]));
    const permissionByCode = new Map(
        permissionRecords.map((permission) => [permission.code, permission.id]),
    );

    const rolePermissionRows = Object.entries(rolePermissions).flatMap(
        ([roleName, permissionCodes]) => {
            const roleId = roleByName.get(roleName);
            if (!roleId) {
                throw new Error(`Missing role ${roleName}`);
            }

            return permissionCodes.map((code) => {
                const permissionId = permissionByCode.get(code);
                if (!permissionId) {
                    throw new Error(`Missing permission ${code}`);
                }

                return {
                    role_id: roleId,
                    permission_id: permissionId,
                };
            });
        },
    );

    await prisma.rolePermission.createMany({
        data: rolePermissionRows,
        skipDuplicates: true,
    });

    const password_hash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_SALT);

    const staticUsersWithId = staticUsers.map((user) => ({
        id: faker.string.uuid(),
        email: user.email,
        full_name: user.full_name,
        status: user.status,
        password_hash,
        roles: user.roles,
    }));

    const audienceUsers = Array.from({ length: AUDIENCE_COUNT }, (_, index) => ({
        id: faker.string.uuid(),
        email: `audience${index + 1}@ticketbox.local`,
        full_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        status: "ACTIVE",
        password_hash,
        roles: ["Audience"],
    }));

    const allUsers = [...staticUsersWithId, ...audienceUsers].map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        status: user.status,
        password_hash: user.password_hash,
    }));

    for (const chunk of chunkArray(allUsers, CHUNK_SIZE)) {
        await prisma.user.createMany({ data: chunk, skipDuplicates: true });
    }

    const userRoleRows = [...staticUsersWithId, ...audienceUsers].flatMap(
        (user) =>
            user.roles.map((roleName) => {
                const roleId = roleByName.get(roleName);
                if (!roleId) {
                    throw new Error(`Missing role ${roleName}`);
                }

                return {
                    user_id: user.id,
                    role_id: roleId,
                };
            }),
    );

    for (const chunk of chunkArray(userRoleRows, CHUNK_SIZE)) {
        await prisma.userRole.createMany({ data: chunk, skipDuplicates: true });
    }
}
