import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../../../database/schemas/subscription.schema';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'External subscription ID from payment provider' })
  @IsOptional()
  @IsString()
  externalSubscriptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalCustomerId?: string;
}
