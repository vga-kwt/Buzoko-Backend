import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new address for current user' })
  @ApiCreatedResponse({ description: 'Address created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.createForUser(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List addresses for current user' })
  @ApiOkResponse({ description: 'Array of addresses' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async findAll(@Req() req: any) {
    return this.addressesService.listForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an address by id (owned by user)' })
  @ApiOkResponse({ description: 'Address found' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.findByIdForUser(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address by id' })
  @ApiOkResponse({ description: 'Updated address' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.updateForUser(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address by id' })
  @ApiOkResponse({ description: 'Delete status' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.removeForUser(req.user.id, id);
  }

}

