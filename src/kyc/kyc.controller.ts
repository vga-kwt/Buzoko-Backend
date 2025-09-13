import { Body, Controller, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors, UsePipes, ValidationPipe, Req, Delete } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { KycService } from './kyc.service';
import { CreateKycDto, UpdateKycDto } from './dto/create-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { VendorGuard } from '../auth/vendor.guard';
import { KycStatus } from './schemas/kyc.schema';
import { Messages } from '../common/constants/messages';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { BadRequestException, NotFoundException } from '@nestjs/common';
@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @ApiOperation({ summary: 'Create KYC record' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'KYC record created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ResponseMessage(Messages.CREATE_SUCCESS)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createKyc(@Body() dto: CreateKycDto, @Req() req: any) {
    return this.kycService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your KYC by id' })
  @ApiParam({ name: 'id', required: true, description: 'KYC id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Updated KYC' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ResponseMessage(Messages.UPDATE_SUCCESS)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateKyc(@Param('id') id: string, @Body() dto: UpdateKycDto, @Req() req: any) {
    try {
      return await this.kycService.updateKyc(id, dto, req.user.id);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new BadRequestException(Messages.UPDATE_FAILURE);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all your KYC records' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Array of KYC records' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ResponseMessage(Messages.FETCH_SUCCESS)
  async listKyc(@Req() req: any) {
    return this.kycService.listKyc(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete your KYC by id' })
  @ApiParam({ name: 'id', required: true, description: 'KYC id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'KYC deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ResponseMessage(Messages.DELETE_SUCCESS)
  async deleteKyc(@Param('id') id: string, @Req() req: any) {
    return this.kycService.deleteKyc(id, req.user.id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve/Reject KYC (admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'KYC id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Updated KYC' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ResponseMessage(Messages.UPDATE_SUCCESS)
  async approve(@Param('id') id: string, @Body() body: ApproveKycDto) {
    return this.kycService.approve(id, body.status as KycStatus);
  }

}


