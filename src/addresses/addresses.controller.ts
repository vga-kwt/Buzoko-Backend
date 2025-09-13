import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Messages } from '../common/constants/messages';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
@ApiTags('Addresses')
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
  @ResponseMessage(Messages.CREATE_SUCCESS)
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    try {
      const created = await this.addressesService.createForUser(req.user.id, dto);
      return created;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e; // Re-throw NotFoundException as-is
      }
      throw new BadRequestException(Messages.CREATE_FAILURE);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List addresses for current user' })
  @ApiOkResponse({ description: 'Array of addresses' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ResponseMessage(Messages.FETCH_SUCCESS)
  async findAll(@Req() req: any) {
    try {
      const list = await this.addressesService.listForUser(req.user.id);
      return list;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e; // Re-throw NotFoundException as-is
      }
      throw new InternalServerErrorException(Messages.FETCH_FAILURE);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an address by id (owned by user)' })
  @ApiOkResponse({ description: 'Address found' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ResponseMessage(Messages.FETCH_SUCCESS)
  async findOne(@Req() req: any, @Param('id') id: string) {
    try {
      const doc = await this.addressesService.findByIdForUser(req.user.id, id);
      return doc;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e; // Re-throw NotFoundException as-is
      }
      throw new InternalServerErrorException(Messages.FETCH_FAILURE);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address by id' })
  @ApiOkResponse({ description: 'Updated address' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ResponseMessage(Messages.UPDATE_SUCCESS)
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    try {
      const updated = await this.addressesService.updateForUser(req.user.id, id, dto);
      return updated;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e; // Re-throw NotFoundException as-is
      }
      throw new BadRequestException(Messages.UPDATE_FAILURE);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address by id' })
  @ApiOkResponse({ description: 'Delete status' })
  @ApiNotFoundResponse({ description: 'Address not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ResponseMessage(Messages.DELETE_SUCCESS)
  async remove(@Req() req: any, @Param('id') id: string) {
    try {
      const removed = await this.addressesService.removeForUser(req.user.id, id);
      return removed;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e; // Re-throw NotFoundException as-is
      }
      throw new InternalServerErrorException(Messages.DELETE_FAILURE);
    }
  }
}
