import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicProfileDto } from './dto/public-profile.dto';

// NOTE: these guards/ decorators must be implemented in your auth module
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Create profile (protected). Anyone with a valid JWT can create their profile.
   * We enforce that req.user.sub === userId OR allow admins (owner check below).
   */
  @Post()
  @ApiOperation({ summary: 'Create profile for a user (owner or admin)' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PublicProfileDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: cannot create profile for other user' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProfileDto, @Req() req: any): Promise<PublicProfileDto> {
    // owner check: user can only create profile for themselves unless admin
    const requesterId = req.user?.sub || req.user?.id;
    if (!requesterId) throw new UnauthorizedException('Not authenticated'); // guard should handle
    if (requesterId !== dto.userId && !req.user?.roles?.includes('admin')) {
      throw new ForbiddenException('Forbidden: cannot create profile for other user');
    }
    return await this.profilesService.create(dto);
  }

  /**
   * Get profile by id (public)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get profile by id' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', required: true, description: 'Profile id' })
  @ApiOkResponse({ type: PublicProfileDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string): Promise<PublicProfileDto> {
    const doc = await this.profilesService.findById(id);
    return this.profilesService.toPublic(doc);
  }

  /**
   * Get profile for current user (protected)
   */
  @Get('/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: { oneOf: [{ $ref: getSchemaPath(PublicProfileDto) }, { type: 'null' }] },
    description: 'Returns current profile or null if not found',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any): Promise<PublicProfileDto | null> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) return null;
    const doc = await this.profilesService.findByUserId(userId);
    return doc ? this.profilesService.toPublic(doc) : null;
  }

  /**
   * Partial update — only owner or admin
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update profile by id.' })
  @ApiParam({ name: 'id', required: true, description: 'Profile id' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: PublicProfileDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: cannot update this profile' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto, @Req() req: any) {
    // ownership check (resolve profile owner and compare)
    const profile = await this.profilesService.findById(id);
    const requesterId = req.user?.sub || req.user?.id;
    if (profile.userId.toString() !== requesterId && !req.user?.roles?.includes('admin')) {
      throw new ForbiddenException('Forbidden: cannot update this profile');
    }
    return this.profilesService.update(id, dto);
  }

  /**
   * Delete profile — owner/admin only
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile by id (owner or admin)' })
  @ApiParam({ name: 'id', required: true, description: 'Profile id' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Delete status',
    schema: { properties: { success: { type: 'boolean', example: true } } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: cannot delete this profile' })
  @ApiNotFoundResponse({ description: 'Profile not found' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    const profile = await this.profilesService.findById(id);
    const requesterId = req.user?.sub || req.user?.id;
    if (profile.userId.toString() !== requesterId && !req.user?.roles?.includes('admin')) {
      throw new ForbiddenException('Forbidden: cannot delete this profile');
    }
    return this.profilesService.remove(id);
  }
}
