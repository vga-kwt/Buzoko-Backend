import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private usersService: UsersService;

  constructor(usersService: UsersService) {
    // ensure JWT_SECRET exists at runtime (fail fast)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(opts);

    // assign after super
    this.usersService = usersService;
  }

  // payload is whatever we signed (we sign { sub, roles })
  async validate(payload: any) {
    // Optionally confirm user exists and is active
    try {
      const user = await this.usersService.findById(payload.sub);
      return {
        id: user._id?.toString ? user._id.toString() : payload.sub,
        roles: payload.roles || user.roles,
      };
    } catch (err) {
      // If user not found, return payload minimally; guard will fail later if needed
      return { id: payload.sub, roles: payload.roles || [] };
    }
  }
}
