import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { ROLES_KEY } from '../src/shared/decorators/roles.decorator';
import { PERMISSIONS_KEY, PermissionCode } from '../src/shared/decorators/permissions.decorator';

function createMockExecutionContext(user: any): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

test('RolesGuard allows access when no roles or permissions are required', () => {
  const reflector = new Reflector();
  reflector.getAllAndOverride = ((_key: string) => {
    return undefined;
  }) as any;

  const guard = new RolesGuard(reflector);
  const context = createMockExecutionContext(null);

  assert.equal(guard.canActivate(context), true);
});

test('RolesGuard allows access when user has required role and required permission', () => {
  const reflector = new Reflector();
  reflector.getAllAndOverride = ((key: string) => {
    if (key === ROLES_KEY) return ['ADMIN'];
    if (key === PERMISSIONS_KEY) return [PermissionCode.MANAGE_USERS];
    return undefined;
  }) as any;

  const guard = new RolesGuard(reflector);
  const context = createMockExecutionContext({
    roles: ['Admin'],
    permissions: ['MANAGE_USERS', 'VIEW_REVENUE'],
  });

  assert.equal(guard.canActivate(context), true);
});

test('RolesGuard denies access when user has required role but lacks required permission', () => {
  const reflector = new Reflector();
  reflector.getAllAndOverride = ((key: string) => {
    if (key === ROLES_KEY) return ['ORGANIZER'];
    if (key === PERMISSIONS_KEY) return [PermissionCode.MANAGE_USERS];
    return undefined;
  }) as any;

  const guard = new RolesGuard(reflector);
  const context = createMockExecutionContext({
    roles: ['Organizer'],
    permissions: ['CREATE_CONCERT', 'VIEW_REVENUE'],
  });

  assert.equal(guard.canActivate(context), false);
});

test('RolesGuard denies access when user has required permission but lacks required role', () => {
  const reflector = new Reflector();
  reflector.getAllAndOverride = ((key: string) => {
    if (key === ROLES_KEY) return ['ADMIN'];
    if (key === PERMISSIONS_KEY) return [PermissionCode.SCAN_TICKET];
    return undefined;
  }) as any;

  const guard = new RolesGuard(reflector);
  const context = createMockExecutionContext({
    roles: ['Checker'],
    permissions: ['SCAN_TICKET'],
  });

  assert.equal(guard.canActivate(context), false);
});

test('RolesGuard blocks Checker from endpoints requiring Admin or Organizer', () => {
  const reflector = new Reflector();
  reflector.getAllAndOverride = ((key: string) => {
    if (key === ROLES_KEY) return ['ADMIN', 'ORGANIZER'];
    if (key === PERMISSIONS_KEY) return [PermissionCode.ASSIGN_CHECKER];
    return undefined;
  }) as any;

  const guard = new RolesGuard(reflector);
  const context = createMockExecutionContext({
    roles: ['Checker'],
    permissions: ['SCAN_TICKET'],
  });

  assert.equal(guard.canActivate(context), false);
});
