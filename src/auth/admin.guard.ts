import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roles: string[] = req?.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    if (!isAdmin) {
      throw new ForbiddenException('Forbidden: requires admin role');
    }
    return true;
  }
}


