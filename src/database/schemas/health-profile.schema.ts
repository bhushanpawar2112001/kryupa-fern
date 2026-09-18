import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type HealthProfileDocument = HealthProfile & Document;

export enum DietType {
  NONE = 'none',
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  KETO = 'keto',
  PALEO = 'paleo',
  HALAL = 'halal',
  KOSHER = 'kosher',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
}

export enum SkinType {
  NORMAL = 'normal',
  DRY = 'dry',
  OILY = 'oily',
  COMBINATION = 'combination',
  SENSITIVE = 'sensitive',
}

@Schema({ timestamps: true, collection: 'health_profiles' })
export class HealthProfile {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @ApiProperty({ example: ['peanuts', 'tree nuts'] })
  @Prop({ type: [String], default: [] })
  allergies: string[];

  @ApiProperty({ example: ['diabetes', 'hypertension'] })
  @Prop({ type: [String], default: [] })
  conditions: string[];

  @ApiProperty({ enum: DietType, default: DietType.NONE })
  @Prop({ type: String, enum: DietType, default: DietType.NONE })
  dietType: DietType;

  @ApiProperty({ enum: SkinType, default: SkinType.NORMAL })
  @Prop({ type: String, enum: SkinType, default: SkinType.NORMAL })
  skinType: SkinType;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isPregnant: boolean;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isBreastfeeding: boolean;

  @ApiProperty({ example: ['metformin'] })
  @Prop({ type: [String], default: [] })
  medications: string[];
}

export const HealthProfileSchema = SchemaFactory.createForClass(HealthProfile);

HealthProfileSchema.index({ userId: 1 }, { unique: true });
