import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type ScoreDocument = Score & Document;

export enum LetterGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}
export enum ScoreLabel {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

@Schema({ _id: false })
export class ScoreFactor {
  @ApiProperty({ example: 'fiber' })
  @Prop({ required: true })
  key: string;

  @ApiProperty({ example: 'High in fiber' })
  @Prop({ required: true })
  label: string;

  @ApiProperty({ enum: ['positive', 'negative'] })
  @Prop({ required: true })
  impact: 'positive' | 'negative';

  @ApiProperty({ example: 8 })
  @Prop({ required: true })
  points: number;

  @ApiProperty({ example: '+ High in fiber supports digestive health' })
  @Prop({ required: true })
  reason: string;

  @ApiPropertyOptional()
  @Prop()
  detail: string;

  @ApiPropertyOptional()
  @Prop()
  ingredientRef: string;

  @ApiPropertyOptional()
  @Prop()
  citationSource: string;

  @ApiPropertyOptional()
  @Prop()
  citationUrl: string;
}

@Schema({ timestamps: true, collection: 'scores' })
export class Score {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'product-uuid' })
  @Prop({ type: String, ref: 'Product', required: true })
  productId: string;

  @ApiProperty({ example: 82 })
  @Prop({ required: true, min: 0, max: 100 })
  overallScore: number;

  @ApiProperty({ enum: LetterGrade })
  @Prop({ type: String, enum: LetterGrade, required: true })
  grade: LetterGrade;

  @ApiProperty({ enum: ScoreLabel })
  @Prop({ type: String, enum: ScoreLabel, required: true })
  label: ScoreLabel;

  @ApiProperty({ type: [ScoreFactor] })
  @Prop({ type: [ScoreFactor], default: [] })
  factors: ScoreFactor[];

  @ApiProperty({ example: ['People with diabetes', 'Tree nut allergy'] })
  @Prop({ type: [String], default: [] })
  avoidIf: string[];

  @ApiProperty({ example: ['High-protein diets', 'Post-workout nutrition'] })
  @Prop({ type: [String], default: [] })
  goodFor: string[];

  @ApiProperty()
  @Prop({ required: true })
  lastCalculatedAt: Date;

  @ApiProperty({ example: '1.0' })
  @Prop({ default: '1.0' })
  scoringEngineVersion: string;
}

export const ScoreSchema = SchemaFactory.createForClass(Score);

ScoreSchema.index({ productId: 1 }, { unique: true });
ScoreSchema.index({ overallScore: -1 });
ScoreSchema.index({ grade: 1 });
