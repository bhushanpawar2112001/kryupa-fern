import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Chobani Plain Greek Yogurt' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Chobani' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: '012345678901' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: ['https://cdn.vero.app/img.jpg'] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({ example: ['water', 'milk', 'live cultures'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['high-protein', 'probiotic'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Open Food Facts' })
  @IsOptional()
  @IsString()
  dataSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  dataSourceUrl?: string;
}
