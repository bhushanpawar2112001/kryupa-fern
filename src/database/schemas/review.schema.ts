import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @ApiProperty({ example: 'product-uuid' })
  @Prop({ type: String, ref: 'Product', required: true })
  productId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Great product, very clean ingredients.' })
  @Prop({ trim: true, maxlength: 2000 })
  text: string;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isVisible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, isVisible: 1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
