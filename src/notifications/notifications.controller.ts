import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user notification preferences (creates defaults if missing)' })
  @ApiParam({ name: 'userId', required: true, description: 'User id (Mongo ObjectId)' })
  async getByUser(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update/toggle notification preferences for a user' })
  @ApiParam({ name: 'userId', required: true, description: 'User id (Mongo ObjectId)' })
  async updateByUser(@Param('userId') userId: string, @Body() body: UpdateNotificationsDto) {
    return this.notificationsService.updateUserNotifications(userId, body);
  }
}
