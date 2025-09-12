import { Body, Controller, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { KycStatus } from './schemas/kyc.schema';

const storage = diskStorage({
  destination: 'uploads',
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload KYC documents (stores file paths in urls)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'KYC record created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, { storage }))
  async upload(
    @Body() dto: Omit<CreateKycDto, 'urls'>,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const urls = (files || []).map((f) => `uploads/${f.filename}`);
    return this.kycService.create({ ...dto, urls });
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve/Reject KYC (admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'KYC id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Updated KYC' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approve(@Param('id') id: string, @Body() body: ApproveKycDto) {
    return this.kycService.approve(id, body.status as KycStatus);
  }

  @Get('summaries')
  @ApiOperation({ summary: 'List KYC labels and status' })
  @ApiOkResponse({ description: 'Array of KYC summaries' })
  async summaries() {
    return this.kycService.listSummaries();
  }
}


