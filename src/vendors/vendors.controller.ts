import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../auth/vendor.guard';
import { PublicVendorDto } from './dto/public-vendor.dto';
import { Messages } from '../common/constants/messages';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiCreatedResponse({ type: PublicVendorDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires vendor role' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ResponseMessage(Messages.CREATE_SUCCESS)
  async create(@Body() dto: CreateVendorDto, @Req() req: any): Promise<PublicVendorDto> {
    // Set userId from token, not from payload
    const userId = req.user?.sub || req.user?.id;
    return this.vendorsService.create({ ...dto, userId });
  }

  @Get()
  @ApiOperation({ summary: 'List all vendors' })
  @ApiOkResponse({ type: [PublicVendorDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires vendor role' })
  @ResponseMessage(Messages.FETCH_SUCCESS)
  async findAll(): Promise<PublicVendorDto[]> {
    return this.vendorsService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vendor by id' })
  @ApiParam({ name: 'id', required: true, description: 'Vendor id' })
  @ApiOkResponse({ type: PublicVendorDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires vendor role' })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ResponseMessage(Messages.UPDATE_SUCCESS)
  async update(@Param('id') id: string, @Body() dto: UpdateVendorDto): Promise<PublicVendorDto> {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vendor by id' })
  @ApiParam({ name: 'id', required: true, description: 'Vendor id' })
  @ApiOkResponse({ description: 'Delete status', schema: { properties: { success: { type: 'boolean', example: true } } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires vendor role' })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  @ResponseMessage(Messages.DELETE_SUCCESS)
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.vendorsService.remove(id);
  }
}
