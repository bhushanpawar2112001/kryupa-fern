import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../../database/schemas/user.schema';
import { Product, ProductDocument, ProductStatus } from '../../database/schemas/product.schema';
import {
  DataCorrection,
  DataCorrectionDocument,
  CorrectionStatus,
} from '../../database/schemas/data-correction.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(DataCorrection.name)
    private readonly correctionModel: Model<DataCorrectionDocument>,
  ) {}

  // ── Users ─────────────────────────────────────────────────────────────────

  async listUsers(pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const [items, total] = await Promise.all([
      this.userModel.find().skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.userModel.countDocuments().exec(),
    ]);
    return { items, total, limit, offset };
  }

  async setUserActive(userId: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, { isActive }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setUserRole(userId: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, { role }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async listPendingProducts(pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const filter = { status: ProductStatus.PENDING_REVIEW };
    const [items, total] = await Promise.all([
      this.productModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async approveProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { status: ProductStatus.ACTIVE }, { new: true })
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async rejectProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { status: ProductStatus.REJECTED }, { new: true })
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ── Data Corrections ──────────────────────────────────────────────────────

  async listCorrections(status: CorrectionStatus, pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.correctionModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.correctionModel.countDocuments(filter).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async reviewCorrection(
    id: string,
    adminId: string,
    status: CorrectionStatus,
    note?: string,
  ): Promise<DataCorrectionDocument> {
    const doc = await this.correctionModel
      .findByIdAndUpdate(
        id,
        { $set: { status, reviewedBy: adminId, reviewNote: note, reviewedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Correction not found');
    return doc;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, totalProducts, pendingProducts, pendingCorrections] = await Promise.all([
      this.userModel.countDocuments({ isGuest: false }).exec(),
      this.productModel.countDocuments({ status: ProductStatus.ACTIVE }).exec(),
      this.productModel.countDocuments({ status: ProductStatus.PENDING_REVIEW }).exec(),
      this.correctionModel.countDocuments({ status: CorrectionStatus.PENDING }).exec(),
    ]);
    return { totalUsers, totalProducts, pendingProducts, pendingCorrections };
  }
}
