import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type RankingDocument = Ranking & Document;

@Schema({ timestamps: true, collection: 'rankings' })
export class Ranking {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'category-uuid' })
  @Prop({ type: String, ref: 'Category', required: true })
  categoryId: string;

  @ApiProperty({ example: 'product-uuid' })
  @Prop({ type: String, ref: 'Product', required: true })
  productId: string;

  @ApiProperty({ example: 1 })
  @Prop({ required: true, min: 1 })
  rank: number;

  @ApiProperty({ example: 82 })
  @Prop({ required: true })
  score: number;

  @ApiProperty()
  @Prop({ required: true })
  computedAt: Date;
}

export const RankingSchema = SchemaFactory.createForClass(Ranking);

RankingSchema.index({ categoryId: 1, rank: 1 }, { unique: true });
RankingSchema.index({ categoryId: 1, productId: 1 }, { unique: true });
RankingSchema.index({ categoryId: 1, score: -1 });
