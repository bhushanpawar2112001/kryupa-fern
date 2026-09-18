import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GuestLoginDto {
  @ApiPropertyOptional({ description: 'Stable device ID — same guest user returned on every call' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
