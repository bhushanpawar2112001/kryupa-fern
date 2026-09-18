import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ranking, RankingDocument } from '../../database/schemas/ranking.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class RankingsService {
  constructor(@InjectModel(Ranking.name) private readonly rankingModel: Model<RankingDocument>) {}

  async findByCategory(categoryId: string, pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const [items, total] = await Promise.all([
      this.rankingModel
        .find({ categoryId })
        .populate('productId')
        .sort({ rank: 1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.rankingModel.countDocuments({ categoryId }).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async findProductRank(categoryId: string, productId: string): Promise<RankingDocument> {
    const ranking = await this.rankingModel.findOne({ categoryId, productId }).exec();
    if (!ranking)
      throw new NotFoundException('Ranking not found for this product in this category');
    return ranking;
  }

  async recomputeCategory(
    categoryId: string,
    entries: { productId: string; score: number }[],
  ): Promise<void> {
    // Sort by score desc, assign ranks, upsert one by one to avoid bulkWrite type issues
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    await Promise.all(
      sorted.map((entry, idx) =>
        this.rankingModel
          .findOneAndUpdate(
            { categoryId, productId: entry.productId },
            {
              $set: { rank: idx + 1, score: entry.score, computedAt: new Date() },
              $setOnInsert: { _id: generateUuid(), categoryId, productId: entry.productId },
            },
            { upsert: true, new: true },
          )
          .exec(),
      ),
    );
  }
}
