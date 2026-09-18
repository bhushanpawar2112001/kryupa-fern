import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../../database/schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    const existing = await this.reviewModel.findOne({ userId, productId: dto.productId }).exec();
    if (existing) {
      existing.rating = dto.rating;
      existing.text = dto.text;
      return existing.save();
    }
    return this.reviewModel.create({ _id: generateUuid(), userId, ...dto });
  }

  async findByProduct(productId: string, pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const filter = { productId, isVisible: true };
    const [items, total] = await Promise.all([
      this.reviewModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.userId !== userId)
      throw new ForbiddenException("Cannot delete another user's review");
    await this.reviewModel.findByIdAndUpdate(id, { isVisible: false }).exec();
  }
}
