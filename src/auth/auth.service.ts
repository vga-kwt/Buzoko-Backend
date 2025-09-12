import * as bcrypt from 'bcryptjs';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../users/schemas/user.enums';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpTtl = Number(process.env.OTP_TTL || 300);
  private otpRateLimit = Number(process.env.OTP_RATE_LIMIT || 5);
  private otpRateWindow = Number(process.env.OTP_RATE_WINDOW || 3600);
  private saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

  constructor(
    private readonly redis: RedisService,
    private readonly smsService: SmsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  private otpKey(identity: string) {
    return `otp:${identity}`;
  }
  private otpRateKey(identity: string) {
    return `otp:rate:${identity}`;
  }
  private refreshKey(userId: string) {
    return `refresh:${userId}`;
  }

  /** Issue OTP: rate-limit, persist to Redis, send SMS */
  async issueOtp(phoneE164: string): Promise<{ success: boolean; ttl: number }> {
    // rate limit
    const rateKey = this.otpRateKey(phoneE164);
    const cur = await this.redis.incr(rateKey);
    if (cur === 1) {
      await this.redis.expire(rateKey, this.otpRateWindow);
    }
    if (cur > this.otpRateLimit) {
      throw new BadRequestException('Exceeded max OTP requests. Try later.');
    }

    // generate code (4-digit)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('Generated OTP:', code);

    // store in redis with ttl
    await this.redis.set(this.otpKey(phoneE164), code, this.otpTtl);

    // send SMS via provided SmsService
    const message = `Your verification code is ${code}. It will expire in ${Math.floor(
      this.otpTtl / 60
    )} minutes.`;
    const smsResult = await this.smsService.sendSms(phoneE164, message);

    if (!smsResult.success) {
      this.logger.warn('Failed to send OTP SMS', smsResult);
      throw new BadRequestException('Failed to send OTP');
    }

    return { success: true, ttl: this.otpTtl };
  }

  /** Issue OTP to email: rate-limit, persist to Redis, send Email */
  async issueEmailOtp(email: string): Promise<{ success: boolean; ttl: number }> {
    const normalized = (email || '').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new BadRequestException('Invalid email address');
    }

    const rateKey = this.otpRateKey(normalized);
    const cur = await this.redis.incr(rateKey);
    if (cur === 1) {
      await this.redis.expire(rateKey, this.otpRateWindow);
    }
    if (cur > this.otpRateLimit) {
      throw new BadRequestException('Exceeded max OTP requests. Try later.');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await this.redis.set(this.otpKey(normalized), code, this.otpTtl);

    const subject = 'Your verification code';
    const minutes = Math.floor(this.otpTtl / 60);
    const text = `Your verification code is ${code}. It will expire in ${minutes} minutes.`;
    const html = `<p>Your verification code is <b>${code}</b>.<br/>It will expire in ${minutes} minutes.</p>`;
    await this.mailService.sendMail({ to: normalized, subject, text, html }).catch((e) => {
      this.logger.warn('Failed to send OTP Email', e);
      throw new BadRequestException('Failed to send OTP');
    });

    return { success: true, ttl: this.otpTtl };
  }

  /** Verify OTP: check redis, create or fetch user, issue tokens */
  async verifyOtp(phoneE164: string, code: string): Promise<AuthTokensDto> {
    const cached = await this.redis.get(this.otpKey(phoneE164));
    if (!cached) {
      throw new BadRequestException('OTP expired or not found');
    }
    if (cached !== code) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // OTP is valid — delete it
    await this.redis.del(this.otpKey(phoneE164));

    // find or create user (UsersService.create is idempotent by phone)
    const createdOrExisting = await this.usersService.create({ phoneE164 } as any);
    // Normalize id to a string robustly (handles ObjectId or string)
    const rawId = (createdOrExisting as any).id ?? (createdOrExisting as any)._id;
    const userId = typeof rawId === 'string' ? rawId : rawId?.toString?.();
    if (!userId) {
      this.logger.error('Failed to resolve userId after OTP verification', { createdOrExisting });
      throw new BadRequestException('Unable to resolve user id');
    }
    const roles = (createdOrExisting as any).roles || ['client'];

    // issue tokens
    const tokens = await this.issueTokens(userId, roles);
    // set lastLogin and phoneVerifiedAt
    await this.usersService.markPhoneVerified(userId);
    await this.usersService.setLastLogin(userId).catch(() => null);
    // if user has client role, set status to ACTIVE (redundant safeguard)
    await this.usersService.activateIfClient(userId).catch(() => null);

    return tokens;
  }

  /** Verify OTP by email */
  async verifyEmailOtp(email: string, code: string): Promise<AuthTokensDto> {
    const normalized = (email || '').toLowerCase();
    const cached = await this.redis.get(this.otpKey(normalized));
    if (!cached) {
      throw new BadRequestException('OTP expired or not found');
    }
    if (cached !== code) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.redis.del(this.otpKey(normalized));

    // find or create user by email
    const existing = await this.usersService.findByEmail(normalized);
    let userId: string;
    if (existing) {
      userId = ((existing as any).id || (existing as any)._id)?.toString();
    } else {
      const created = await this.usersService.createByEmail(normalized);
      userId = (created as any).id?.toString();
    }
    if (!userId) {
      this.logger.error('Failed to resolve userId after email OTP verification', { email: normalized });
      throw new BadRequestException('Unable to resolve user id');
    }

    const roles = (existing as any)?.roles || ['client'];
    const tokens = await this.issueTokens(userId, roles);
    await this.usersService.markEmailVerified(userId);
    await this.usersService.setLastLogin(userId).catch(() => null);
    await this.usersService.activateIfClient(userId).catch(() => null);
    return tokens;
  }

  private async issueTokens(userId: string, roles: string[]): Promise<AuthTokensDto> {
    const payload = { sub: userId, roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRY || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });

    // store refresh token in Redis (single refresh per user behavior)
    await this.redis.set(
      this.refreshKey(userId),
      refreshToken,
      this.parseExpiry(process.env.JWT_REFRESH_EXPIRY || '7d')
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirySeconds(process.env.JWT_EXPIRY || '15m'),
    };
  }

  /** Refresh token flow: validate refresh token and issue new pair */
  async refreshTokens(refreshToken: string): Promise<AuthTokensDto> {
    // verify token structure
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_SECRET });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const userId = payload.sub;
    const stored = await this.redis.get(this.refreshKey(userId));
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh token revoked or mismatched');
    }

    // issue new tokens and replace stored refresh
    return await this.issueTokens(userId, payload.roles || []);
  }

  /** Logout / revoke refresh token */
  async revokeRefresh(userId: string) {
    await this.redis.del(this.refreshKey(userId));
    return { success: true };
  }

  // helper: parse expiry strings like '15m', '7d', or '900s' to seconds (basic)
  private parseExpirySeconds(str: string): number {
    if (/^\d+s$/.test(str)) return Number(str.replace('s', ''));
    if (/^\d+m$/.test(str)) return Number(str.replace('m', '')) * 60;
    if (/^\d+h$/.test(str)) return Number(str.replace('h', '')) * 3600;
    if (/^\d+d$/.test(str)) return Number(str.replace('d', '')) * 86400;
    const n = Number(str);
    return Number.isNaN(n) ? 0 : n;
  }

  private parseExpiry(str: string): number {
    return this.parseExpirySeconds(str);
  }

  /**
   * Register with phone (required), password (required), email optional.
   * Behavior:
   * - If user exists with password -> Conflict (409)
   * - If user exists without password -> set passwordHash and update email (if provided)
   * - If user does not exist -> create user with passwordHash
   * Returns PublicUserDto or simple success; we do NOT auto-login (optional).
   */
  async registerWithPassword(dto: RegisterDto) {
    const phone = dto.phoneE164;
    // check existing
    const existing = await this.usersService.findByPhone(phone);

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    if (existing) {
      // If password already set -> conflict
      const existingWithPassword = await this.usersService.findByPhoneWithPassword(phone);
      if (existingWithPassword && existingWithPassword.passwordHash) {
        throw new ConflictException('User already registered. Use login or reset password.');
      }
      // set password on existing user
      const updated = await this.usersService.setPasswordHash(
        (existing as any).id || (existing as any)._id,
        passwordHash
      );
      // optionally update email
      if (dto.email) {
        await this.usersService.update((existing as any).id || (existing as any)._id, {
          email: dto.email,
        } as any);
      }
      return { success: true, message: 'Password set. Please verify phone before login.' };
    }

    // create user with hashed password
    await this.usersService.createWithPassword(
      { phoneE164: phone, email: dto.email },
      passwordHash
    );
    return { success: true, message: 'Registered. Please verify phone before login.' };
  }

  /**
   * Login with phone + password:
   * - user must exist
   * - user.status must be active
   * - phoneVerifiedAt must be set
   * - password must match
   * On success returns AuthTokensDto (issueTokens handles refresh storage)
   */
  async loginWithPassword(dto: LoginDto) {
    const phone = dto.phoneE164;
    const userDoc = await this.usersService.findByPhoneWithPassword(phone);
    if (!userDoc) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ensure active
    if (userDoc.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    // ensure phone verified
    if (!userDoc.phoneVerifiedAt) {
      throw new ForbiddenException('Phone number not verified');
    }

    // compare password
    const match = await bcrypt.compare(dto.password, (userDoc as any).passwordHash || '');
    if (!match) {
      // TODO: increment login attempt counter in Redis to prevent brute force
      throw new UnauthorizedException('Invalid credentials');
    }

    // issue tokens
    const userId = (userDoc as any).id || (userDoc as any)._id?.toString();
    const roles = (userDoc as any).roles || ['client'];

    const tokens = await this.issueTokens(userId, roles);
    await this.usersService.setLastLogin(userId).catch(() => null);
    return tokens;
  }

  async resetPassword(dto: ResetPasswordDto, requesterId: any) {
    // Determine the new password from either newPassword or legacy password field
    const newPass = (dto as any).password;
    if (!newPass) {
      throw new BadRequestException('New password is required');
    }

    // Load user with passwordHash for verification
    const user = await this.usersService.findByIdWithPassword(String(requesterId));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Hash and set new password
    const passwordHash = await bcrypt.hash(newPass, this.saltRounds);
    try {
      await this.usersService.setPasswordHash(String(requesterId), passwordHash);
      // Revoke refresh token to logout other sessions
      await this.revokeRefresh(String(requesterId)).catch(() => null);
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to set password' };
    }
    return { success: true, message: 'Password updated successfully.' };
  }
}
