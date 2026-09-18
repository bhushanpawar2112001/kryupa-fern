import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM_MONTHLY = 'premium_monthly',
  PREMIUM_YEARLY = 'premium_yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
}

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiProperty({ example: 'user-uuid' })
  @Prop({ type: String, ref: 'User', required: true, unique: true })
  userId: string;

  @ApiProperty({ enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  @Prop({ type: String, enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiPropertyOptional()
  @Prop()
  renewalDate: Date;

  @ApiPropertyOptional()
  @Prop()
  cancelledAt: Date;

  @ApiPropertyOptional()
  @Prop()
  externalSubscriptionId: string;

  @ApiPropertyOptional()
  @Prop()
  externalCustomerId: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ status: 1 });
