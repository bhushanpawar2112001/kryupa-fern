import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type CategoryDocument = Category & Document;

export enum CategoryType {
  FOOD = 'food',
  SKINCARE = 'skincare',
  SUPPLEMENTS = 'supplements',
  PHARMA = 'pharma',
}

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'Greek Yogurt' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'greek-yogurt' })
  @Prop({ required: true, trim: true, lowercase: true })
  slug: string;

  @ApiProperty({ enum: CategoryType })
  @Prop({ type: String, enum: CategoryType, required: true })
  type: CategoryType;

  @ApiPropertyOptional({ example: 'parent-category-uuid' })
  @Prop({ type: String, ref: 'Category', default: null })
  parentId: string;

  @ApiPropertyOptional()
  @Prop()
  description: string;

  @ApiPropertyOptional()
  @Prop()
  iconUrl: string;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  sortOrder: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ type: 1 });
