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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('FAQs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  // Public
  @Get()
  @ApiOperation({ summary: 'List all FAQs (public)' })
  @ApiOkResponse({ description: 'Array of FAQs' })
  async findAll() {
    return this.faqsService.findAll();
  }

  // Public single read is allowed by requirement? It said only list public, others protected.
  // We'll keep GET by id also public for convenience; if you want, we can protect it.
  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by id (admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'FAQ id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'FAQ found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @ApiNotFoundResponse({ description: 'FAQ not found' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.faqsService.findOne(id);
  }

  // Admin-only below
  @Post()
  @ApiOperation({ summary: 'Create FAQ (admin only)' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'FAQ created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateFaqDto, @Req() req: any) {
    return this.faqsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update FAQ (admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'FAQ id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Updated FAQ' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto, @Req() req: any) {
    return this.faqsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete FAQ (admin only)' })
  @ApiParam({ name: 'id', required: true, description: 'FAQ id' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Delete status' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires admin role' })
  @ApiNotFoundResponse({ description: 'FAQ not found' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.faqsService.remove(id);
  }
}
