import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type DataCorrectionDocument = DataCorrection & Document;

export enum CorrectionStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'data_corrections' })
export class DataCorrection {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'product-uuid' })
  @Prop({ type: String, ref: 'Product', required: true })
  productId: string;

  @ApiProperty({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @ApiProperty({ example: 'The ingredients list is missing sunflower oil.' })
  @Prop({ required: true, trim: true, maxlength: 2000 })
  note: string;

  @ApiProperty({ enum: CorrectionStatus, default: CorrectionStatus.PENDING })
  @Prop({ type: String, enum: CorrectionStatus, default: CorrectionStatus.PENDING })
  status: CorrectionStatus;

  @ApiPropertyOptional({ example: 'admin-uuid' })
  @Prop({ type: String, ref: 'User' })
  reviewedBy: string;

  @ApiPropertyOptional()
  @Prop()
  reviewNote: string;

  @ApiPropertyOptional()
  @Prop()
  reviewedAt: Date;
}

export const DataCorrectionSchema = SchemaFactory.createForClass(DataCorrection);

DataCorrectionSchema.index({ productId: 1, status: 1 });
DataCorrectionSchema.index({ userId: 1 });
