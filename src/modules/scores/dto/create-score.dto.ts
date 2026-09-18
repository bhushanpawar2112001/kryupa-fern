import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { LetterGrade, ScoreLabel } from '../../../database/schemas/score.schema';

export class ScoreFactorDto {
  @ApiProperty() @IsString() key: string;
  @ApiProperty() @IsString() label: string;
  @ApiProperty({ enum: ['positive', 'negative'] }) @IsString() impact: 'positive' | 'negative';
  @ApiProperty() @IsNumber() points: number;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() detail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ingredientRef?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() citationSource?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() citationUrl?: string;
}

export class CreateScoreDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 82 })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ enum: LetterGrade })
  @IsEnum(LetterGrade)
  grade: LetterGrade;

  @ApiProperty({ enum: ScoreLabel })
  @IsEnum(ScoreLabel)
  label: ScoreLabel;

  @ApiProperty({ type: [ScoreFactorDto] })
  @IsArray()
  factors: ScoreFactorDto[];

  @ApiPropertyOptional({ example: ['People with diabetes'] })
  @IsOptional()
  @IsArray()
  avoidIf?: string[];

  @ApiPropertyOptional({ example: ['High-protein diets'] })
  @IsOptional()
  @IsArray()
  goodFor?: string[];

  @ApiPropertyOptional({ example: 'off-1.0' })
  @IsOptional()
  @IsString()
  scoringEngineVersion?: string;
}
