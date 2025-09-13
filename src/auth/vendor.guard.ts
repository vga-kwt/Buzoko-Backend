import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class VendorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roles = req.user?.roles || [];
    if (Array.isArray(roles) && roles.includes('vendor')) {
      return true;
    }
    throw new ForbiddenException('Only vendors can access this resource');
  }
}
