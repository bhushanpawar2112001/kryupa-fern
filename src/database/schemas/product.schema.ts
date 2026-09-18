import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type ProductDocument = Product & Document;

export enum ProductStatus {
  ACTIVE = 'active',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
class NutritionFact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  unit: string;

  @Prop()
  dailyValue: string;
}

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'Chobani Plain Greek Yogurt' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'Chobani' })
  @Prop({ required: true, trim: true })
  brand: string;

  @ApiProperty({ example: 'category-uuid' })
  @Prop({ type: String, ref: 'Category', required: true })
  categoryId: string;

  @ApiPropertyOptional({ example: '012345678901' })
  @Prop({ sparse: true, trim: true })
  barcode: string;

  @ApiProperty({ example: ['https://cdn.vero.app/products/abc.jpg'] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty({ example: ['water', 'milk', 'live cultures'] })
  @Prop({ type: [String], default: [] })
  ingredients: string[];

  @ApiProperty()
  @Prop({ type: [NutritionFact], default: [] })
  nutritionFacts: NutritionFact[];

  @Prop({ type: Object, default: {} })
  rawDataJson: Record<string, any>;

  @ApiPropertyOptional()
  @Prop({ trim: true })
  description: string;

  @ApiProperty({ example: ['high-protein', 'probiotic'] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ enum: ProductStatus, default: ProductStatus.PENDING_REVIEW })
  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.PENDING_REVIEW })
  status: ProductStatus;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isCrowdsourced: boolean;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User' })
  submittedBy: string;

  @ApiPropertyOptional({ example: 'Open Food Facts' })
  @Prop()
  dataSource: string;

  @ApiPropertyOptional()
  @Prop()
  dataSourceUrl: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ barcode: 1 }, { sparse: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ name: 'text', brand: 'text', tags: 'text' });
