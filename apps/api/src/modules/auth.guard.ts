import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) throw new UnauthorizedException('No token');

    try {
      req.user = this.jwt.verify(token, { secret: process.env.JWT_SECRET || 'dev_secret' });
      return true;
    } catch {
      throw new UnauthorizedException('Bad token');
    }
  }
}
