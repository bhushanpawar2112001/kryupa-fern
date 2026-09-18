import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HealthProfile, HealthProfileDocument } from '../../database/schemas/health-profile.schema';
import { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class HealthProfilesService {
  constructor(
    @InjectModel(HealthProfile.name) private readonly profileModel: Model<HealthProfileDocument>,
  ) {}

  async upsert(userId: string, dto: UpsertHealthProfileDto): Promise<HealthProfileDocument> {
    return this.profileModel
      .findOneAndUpdate(
        { userId },
        { $set: dto, $setOnInsert: { _id: generateUuid(), userId } },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByUser(userId: string): Promise<HealthProfileDocument | null> {
    return this.profileModel.findOne({ userId }).exec();
  }

  async delete(userId: string): Promise<void> {
    await this.profileModel.findOneAndDelete({ userId }).exec();
  }
}
