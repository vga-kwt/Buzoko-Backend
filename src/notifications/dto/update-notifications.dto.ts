import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsDto {
  @ApiPropertyOptional({ type: Boolean, description: 'Receive offers and promotions notifications' })
  @IsOptional()
  @IsBoolean()
  offersAndPromotions?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Receive order status notifications' })
  @IsOptional()
  @IsBoolean()
  ordersStatus?: boolean;
}


