import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUserDto } from './dto/public-user.dto';

// Uncomment when Auth guard is available
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly auth: AuthService) {}

  /**
   * Create user (idempotent by phone). This endpoint is suitable for issuing an OTP-BACKED
   * user record or for phone-first registration.
   *
   * Note: actual auth (OTP issuance and verification) will be implemented in the Auth module.
   */
  @Post()
  @ApiOperation({ summary: 'Create or return existing user by phone (idempotent)' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    await this.auth.issueOtp(createUserDto.phoneE164);
    return user;
  }

  /**
   * Protected endpoint - current user. Requires JWT guard to be enabled.
   * Once your auth module is ready, enable UseGuards(JwtAuthGuard) and
   * ensure req.user contains the authenticated user id.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: { oneOf: [{ $ref: getSchemaPath(PublicUserDto) }, { type: 'null' }] },
    description: 'Returns current user or null if not authenticated',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    // NOTE: when guarded, req.user should contain userId (or whole user object)
    console.log('req.use ----------------------- r', req.user);
    const userId = req.user?.sub || req.user?.id;
    if (!userId) return null;
    const userDoc = await this.usersService.findById(userId);
    return this.usersService.toPublic(userDoc);
  }

  /**
   * Public user lookup by id. Returns PublicUserDto.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getById(@Param('id') id: string) {
    const userDoc = await this.usersService.findById(id);
    if (!userDoc) throw new NotFoundException('User not found');
    return this.usersService.toPublic(userDoc);
  }

  /**
   * Get user by phone: /users?phone=+1555...
   * Useful for frontend pre-checks (does user exist).
   */
  @Get()
  @ApiOperation({ summary: 'Find user by phone (E.164) via query param' })
  @ApiQuery({ name: 'phone', required: true, example: '+15551234567' })
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(PublicUserDto) }, { type: 'null' }] } })
  @ApiBadRequestResponse({ description: 'Missing phone query param' })
  async getByPhone(@Query('phone') phone?: string) {
    if (!phone) return { message: 'phone query param required' };
    const userDoc = await this.usersService.findByPhone(phone);
    return userDoc ? this.usersService.toPublic(userDoc) : null;
  }

  /**
   * Update user (only owner or admin should be allowed). Guard this endpoint with
   * JwtAuthGuard + a Roles guard in the future.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', required: true, description: 'User id' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: PublicUserDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: insufficient permissions' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.usersService.update(id, dto);
  }
}
