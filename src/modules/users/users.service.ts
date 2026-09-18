import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import {
  UserProduct,
  UserProductDocument,
  UserProductType,
} from '../../database/schemas/user-product.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserProductDto } from './dto/add-user-product.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserProduct.name) private readonly userProductModel: Model<UserProductDocument>,
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

  async getScanHistory(userId: string) {
    return this.getUserProducts(userId, UserProductType.HISTORY);
  }

  async getWatchlist(userId: string) {
    return this.getUserProducts(userId, UserProductType.WATCHLIST);
  }

  async addToHistory(userId: string, productId: string): Promise<void> {
    await this.addUserProduct(userId, { productId, type: UserProductType.HISTORY });
  }
}
