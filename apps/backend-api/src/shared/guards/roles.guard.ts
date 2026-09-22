import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const userRoles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
    const userPermissions = Array.isArray(user?.permissions)
      ? user.permissions
      : user?.permission
        ? [user.permission]
        : [];

    const normalizedUserRoles = userRoles.map((r: string) => r.toUpperCase());
    const normalizedUserPermissions = userPermissions.map((p: string) => p.toUpperCase());

    const isSuperAdmin = normalizedUserRoles.includes('SUPERADMIN') || normalizedUserRoles.includes('SUPER_ADMIN');

    const roleOk =
      isSuperAdmin ||
      (requiredRoles && requiredRoles.length > 0
        ? requiredRoles.some((r) => normalizedUserRoles.includes(r.toUpperCase()))
        : true);
    const permissionOk =
      requiredPermissions && requiredPermissions.length > 0
        ? requiredPermissions.some((p) => normalizedUserPermissions.includes(p.toUpperCase()))
        : true;

    return roleOk && permissionOk;
  }
}
