import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const SYSTEM_ROLES = [
  { name: 'SuperAdmin', description: 'Root system administrator' },
  { name: 'Admin', description: 'System administrator' },
  { name: 'Organizer', description: 'Concert organizer' },
  { name: 'Checker', description: 'Gate staff' },
  { name: 'Audience', description: 'Regular customer' },
];

export const SYSTEM_PERMISSIONS = [
  { code: 'CREATE_CONCERT', description: 'Create concerts' },
  { code: 'UPDATE_CONCERT', description: 'Update concerts' },
  { code: 'DELETE_CONCERT', description: 'Delete concerts' },
  { code: 'VIEW_REVENUE', description: 'View revenue reports' },
  { code: 'SCAN_TICKET', description: 'Scan tickets at gate' },
  { code: 'MANAGE_USERS', description: 'Manage staff accounts and roles' },
  { code: 'MANAGE_ADMINS', description: 'Manage administrator accounts and privilege levels' },
  { code: 'ASSIGN_CHECKER', description: 'Assign checkers to concert gates' },
  { code: 'IMPORT_GUESTS', description: 'Import VIP and guest lists' },
];

export const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: [
    'CREATE_CONCERT',
    'UPDATE_CONCERT',
    'DELETE_CONCERT',
    'VIEW_REVENUE',
    'SCAN_TICKET',
    'MANAGE_USERS',
    'MANAGE_ADMINS',
    'ASSIGN_CHECKER',
    'IMPORT_GUESTS',
  ],
  Admin: [
    'CREATE_CONCERT',
    'UPDATE_CONCERT',
    'DELETE_CONCERT',
    'VIEW_REVENUE',
    'SCAN_TICKET',
    'MANAGE_USERS',
    'ASSIGN_CHECKER',
    'IMPORT_GUESTS',
  ],
  Organizer: [
    'CREATE_CONCERT',
    'UPDATE_CONCERT',
    'VIEW_REVENUE',
    'ASSIGN_CHECKER',
    'IMPORT_GUESTS',
  ],
  Checker: ['SCAN_TICKET'],
  Audience: [],
};

@Injectable()
export class RolesPermissionsSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesPermissionsSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.syncRolesAndPermissions();
    } catch (error) {
      this.logger.error('Failed to synchronize system roles and permissions', error);
    }
  }

  async syncRolesAndPermissions() {
    this.logger.log('Synchronizing system roles and permissions...');

    // 1. Ensure Roles exist
    await this.prisma.role.createMany({
      data: SYSTEM_ROLES,
      skipDuplicates: true,
    });

    // 2. Ensure Permissions exist
    await this.prisma.permission.createMany({
      data: SYSTEM_PERMISSIONS,
      skipDuplicates: true,
    });

    // 3. Map Roles and Permissions
    const dbRoles = await this.prisma.role.findMany({ select: { id: true, name: true } });
    const dbPermissions = await this.prisma.permission.findMany({ select: { id: true, code: true } });

    const roleMap = new Map(dbRoles.map((r) => [r.name, r.id]));
    const permMap = new Map(dbPermissions.map((p) => [p.code, p.id]));

    for (const [roleName, permissionCodes] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;

      for (const code of permissionCodes) {
        const permId = permMap.get(code);
        if (!permId) continue;

        await this.prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleId,
              permission_id: permId,
            },
          },
          update: {},
          create: {
            role_id: roleId,
            permission_id: permId,
          },
        });
      }
    }

    this.logger.log('Roles and permissions synchronized successfully.');
  }
}
