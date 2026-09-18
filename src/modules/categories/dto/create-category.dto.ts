import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';
import { CategoryType } from '../../../database/schemas/category.schema';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Greek Yogurt' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'greek-yogurt' })
  @IsString()
  slug: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({ example: 'parent-uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
