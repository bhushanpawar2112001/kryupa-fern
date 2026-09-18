import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import {
  UserProduct,
  UserProductDocument,
  UserProductType,
} from '../../database/schemas/user-product.schema';
import { Score, ScoreDocument } from '../../database/schemas/score.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserProductDto } from './dto/add-user-product.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserProduct.name) private readonly userProductModel: Model<UserProductDocument>,
    @InjectModel(Score.name) private readonly scoreModel: Model<ScoreDocument>,
  ) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { isActive: false }).exec();
  }

  // ─── Favorites / History / Watchlist ──────────────────────────────────────

  async addUserProduct(userId: string, dto: AddUserProductDto): Promise<UserProduct> {
    // For favorites and watchlist, de-duplicate
    const existing = await this.userProductModel
      .findOne({ userId, productId: dto.productId, type: dto.type })
      .exec();
    if (existing) return existing;

    return this.userProductModel.create({
      _id: generateUuid(),
      userId,
      productId: dto.productId,
      type: dto.type,
    });
  }

  async removeUserProduct(userId: string, productId: string, type: UserProductType): Promise<void> {
    await this.userProductModel.findOneAndDelete({ userId, productId, type }).exec();
  }

  async getUserProducts(userId: string, type: UserProductType): Promise<UserProductDocument[]> {
    return this.userProductModel
      .find({ userId, type })
      .populate('productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFavorites(userId: string) {
    return this.getUserProducts(userId, UserProductType.FAVORITE);
  }

  /**
   * Returns scan history enriched with:
   *  - Full product document (populated)
   *  - Score (grade, overallScore, goodFor, avoidIf, plain-language factors)
   *  - Human-readable summary from rawDataJson
   *  - scannedAt timestamp
   *
   * Limited to the 50 most recent scans to keep the response fast.
   */
  async getScanHistory(userId: string) {
    const entries = await this.userProductModel
      .find({ userId, type: UserProductType.HISTORY })
      .populate('productId')
      .sort({ scannedAt: -1, createdAt: -1 })
      .limit(50)
      .exec();

    // Collect unique product IDs so we can batch-load scores
    const productIds = [
      ...new Set(
        entries
          .map((e) => {
            const p = e.productId as any;
            return typeof p === 'object' && p?._id ? String(p._id) : String(p);
          })
          .filter(Boolean),
      ),
    ];

    const scores = await this.scoreModel
      .find({ productId: { $in: productIds } })
      .exec();

    const scoreByProduct = new Map(scores.map((s) => [String(s.productId), s]));

    return entries.map((entry) => {
      const product = entry.productId as any;
      const productId = product?._id ? String(product._id) : String(entry.productId);
      const score = scoreByProduct.get(productId) ?? null;

      // Extract the plain-language summary stored at import time
      const summary = product?.rawDataJson?.humanReadableSummary ?? null;

      return {
        historyId: entry._id,
        scannedAt: entry.scannedAt ?? (entry as any).createdAt,
        barcode: entry.barcode ?? null,
        product: product ?? null,
        score: score
          ? {
              overallScore: score.overallScore,
              grade: score.grade,
              label: score.label,
              goodFor: score.goodFor,
              avoidIf: score.avoidIf,
              factors: score.factors.map((f) => ({
                label: f.label,
                impact: f.impact,
                reason: f.reason,
              })),
            }
          : null,
        summary,
      };
    });
  }

  async getWatchlist(userId: string) {
    return this.getUserProducts(userId, UserProductType.WATCHLIST);
  }

  /**
   * Records a scan-history entry.
   * History allows duplicates — same product scanned multiple times
   * creates multiple timestamped entries so the timeline is accurate.
   */
  async addToHistory(userId: string, productId: string, barcode?: string): Promise<void> {
    await this.userProductModel.create({
      _id: generateUuid(),
      userId,
      productId,
      type: UserProductType.HISTORY,
      scannedAt: new Date(),
      ...(barcode ? { barcode } : {}),
    });
  }

  /**
   * Clears the entire scan history for a user.
   */
  async clearHistory(userId: string): Promise<void> {
    await this.userProductModel.deleteMany({ userId, type: UserProductType.HISTORY }).exec();
  }
}
