import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const PermissionCode = {
  CREATE_CONCERT: 'CREATE_CONCERT',
  UPDATE_CONCERT: 'UPDATE_CONCERT',
  DELETE_CONCERT: 'DELETE_CONCERT',
  VIEW_REVENUE: 'VIEW_REVENUE',
  SCAN_TICKET: 'SCAN_TICKET',
  MANAGE_USERS: 'MANAGE_USERS',
  ASSIGN_CHECKER: 'ASSIGN_CHECKER',
  IMPORT_GUESTS: 'IMPORT_GUESTS',
} as const;

export type PermissionCodeType = (typeof PermissionCode)[keyof typeof PermissionCode];

export const Permissions = (...permissions: (PermissionCodeType | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

