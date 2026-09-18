import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
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
}

export const UserProductSchema = SchemaFactory.createForClass(UserProduct);

UserProductSchema.index({ userId: 1, type: 1 });
UserProductSchema.index({ userId: 1, productId: 1, type: 1 }, { unique: true });
