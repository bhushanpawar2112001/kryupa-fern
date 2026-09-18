import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Score, ScoreDocument } from '../../database/schemas/score.schema';
import { CreateScoreDto } from './dto/create-score.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class ScoresService {
  constructor(@InjectModel(Score.name) private readonly scoreModel: Model<ScoreDocument>) {}

  async upsertScore(dto: CreateScoreDto): Promise<ScoreDocument> {
    return this.scoreModel
      .findOneAndUpdate(
        { productId: dto.productId },
        {
          $set: {
            ...dto,
            lastCalculatedAt: new Date(),
            scoringEngineVersion: dto.scoringEngineVersion ?? '1.0',
          },
          $setOnInsert: { _id: generateUuid() },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByProduct(productId: string): Promise<ScoreDocument> {
    const score = await this.scoreModel.findOne({ productId }).exec();
    if (!score) throw new NotFoundException(`No score found for product ${productId}`);
    return score;
  }

  async findById(id: string): Promise<ScoreDocument> {
    const score = await this.scoreModel.findById(id).exec();
    if (!score) throw new NotFoundException(`Score ${id} not found`);
    return score;
  }
}
