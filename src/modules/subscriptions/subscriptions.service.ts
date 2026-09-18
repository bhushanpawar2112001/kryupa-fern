import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../database/schemas/subscription.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private readonly subModel: Model<SubscriptionDocument>,
  ) {}

  async getOrCreate(userId: string): Promise<SubscriptionDocument> {
    const existing = await this.subModel.findOne({ userId }).exec();
    if (existing) return existing;
    return this.subModel.create({
      _id: generateUuid(),
      userId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
    });
  }

  async upsert(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    return this.subModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            plan: dto.plan,
            status: SubscriptionStatus.ACTIVE,
            externalSubscriptionId: dto.externalSubscriptionId,
            externalCustomerId: dto.externalCustomerId,
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          $setOnInsert: { _id: generateUuid(), userId },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async cancel(userId: string): Promise<SubscriptionDocument> {
    return this.subModel
      .findOneAndUpdate(
        { userId },
        { $set: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
