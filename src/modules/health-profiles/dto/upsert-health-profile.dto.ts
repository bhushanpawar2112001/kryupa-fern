import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DietType, SkinType } from '../../../database/schemas/health-profile.schema';

export class UpsertHealthProfileDto {
  @ApiPropertyOptional({ example: ['peanuts'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: ['diabetes'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @ApiPropertyOptional({ enum: DietType })
  @IsOptional()
  @IsEnum(DietType)
  dietType?: DietType;

  @ApiPropertyOptional({ enum: SkinType })
  @IsOptional()
  @IsEnum(SkinType)
  skinType?: SkinType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPregnant?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBreastfeeding?: boolean;

  @ApiPropertyOptional({ example: ['metformin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];
}
