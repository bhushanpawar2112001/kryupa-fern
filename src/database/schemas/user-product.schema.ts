import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type UserProductDocument = UserProduct & Document;

export enum UserProductType {
  FAVORITE = 'favorite',
  HISTORY = 'history',
  WATCHLIST = 'watchlist',
}

@Schema({ timestamps: true, collection: 'user_products' })
export class UserProduct {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @ApiProperty({ example: 'product-uuid' })
  @Prop({ type: String, ref: 'Product', required: true })
  productId: string;

  @ApiProperty({ enum: UserProductType })
  @Prop({ type: String, enum: UserProductType, required: true })
  type: UserProductType;

  /**
   * For history entries: the exact moment the barcode was scanned.
   * Stored separately from Mongoose `createdAt` so re-scans (duplicate
   * prevention) still update this timestamp correctly.
   */
  @ApiPropertyOptional({ example: '2026-09-18T10:30:00.000Z' })
  @Prop({ type: Date })
  scannedAt: Date;

  /**
   * Raw barcode string as scanned by the client, stored for history display.
   */
  @ApiPropertyOptional({ example: '8901030862013' })
  @Prop({ type: String })
  barcode: string;
}

export const UserProductSchema = SchemaFactory.createForClass(UserProduct);

UserProductSchema.index({ userId: 1, type: 1, scannedAt: -1 });
// Note: removed unique constraint on (userId, productId, type) for history so
// the same product can appear multiple times if scanned on different days.
// Uniqueness is enforced at the service layer for favorites/watchlist only.
UserProductSchema.index({ userId: 1, productId: 1, type: 1 });
