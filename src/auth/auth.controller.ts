import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IssueOtpDto } from './dto/issue-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { IssueEmailOtpDto } from './dto/issue-email-otp.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/issue')
  @ApiOperation({ summary: 'Issue OTP to a phone number' })
  @ApiOkResponse({
    description: 'OTP issued and sent via SMS',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        ttl: { type: 'number', example: 300 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error or rate-limit exceeded' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async issueOtp(@Body() dto: IssueOtpDto) {
    return this.auth.issueOtp(dto.phoneE164);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and issue JWT access/refresh tokens' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiBadRequestResponse({ description: 'OTP expired or not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid OTP code' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phoneE164, dto.code);
  }
  @Post('otp/email/issue')
  @ApiOperation({ summary: 'Issue OTP to an email' })
  @ApiOkResponse({
    description: 'OTP issued and sent via Email',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        ttl: { type: 'number', example: 300 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error or rate-limit exceeded' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async issueEmailOtp(@Body() dto: IssueEmailOtpDto) {
    return this.auth.issueEmailOtp(dto.email);
  }

  @Post('otp/email/verify')
  @ApiOperation({ summary: 'Verify email OTP and issue JWT access/refresh tokens' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiBadRequestResponse({ description: 'OTP expired or not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid OTP code' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    return this.auth.verifyEmailOtp(dto.email, dto.code);
  }
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access/refresh tokens' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or revoked refresh token' })
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout by revoking refresh token' })
  @ApiOkResponse({
    description: 'Logout status',
    schema: { properties: { success: { type: 'boolean', example: true } } },
  })
  @HttpCode(200)
  async logout(@Body() dto: RefreshTokenDto) {
    // we extract userId from token and revoke
    try {
      const payload = this.auth['jwtService'].verify(dto.refreshToken, {
        secret: process.env.JWT_SECRET,
      }) as any;
      const userId = payload.sub;
      await this.auth.revokeRefresh(userId);
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Register with phone and password; sends OTP for phone verification' })
  @ApiOkResponse({
    description: 'Registration result with OTP status',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        otp: {
          type: 'object',
          properties: {
            sent: { type: 'boolean' },
            ttl: { type: 'number', example: 300 },
            error: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'User already registered. Use login or reset password.' })
  @ApiBadRequestResponse({ description: 'Validation error or failed to send OTP' })
  @HttpCode(200)
  async register(@Body() dto: RegisterDto) {
    const result = await this.auth.registerWithPassword(dto);
    let otp: any;
    try {
      const issued = await this.auth.issueOtp(dto.phoneE164);
      otp = { sent: true, ttl: issued.ttl };
    } catch (e: any) {
      otp = { sent: false, error: e?.message || 'Failed to send OTP' };
    }
    return { ...result, otp };
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiOkResponse({ type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.auth.loginWithPassword(dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Reset password for existing user; update password fo the current logged in user',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Reset password result',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'User not found' })
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any) {
    const requesterId = req.user?.id || req.user?.sub;
    if (!requesterId) throw new UnauthorizedException('Not authenticated');
    return this.auth.resetPassword(dto, requesterId);
  }
}
