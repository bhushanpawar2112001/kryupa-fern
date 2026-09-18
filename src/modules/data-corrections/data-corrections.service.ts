import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DataCorrection,
  DataCorrectionDocument,
  CorrectionStatus,
} from '../../database/schemas/data-correction.schema';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class DataCorrectionsService {
  constructor(
    @InjectModel(DataCorrection.name) private readonly model: Model<DataCorrectionDocument>,
  ) {}

  async create(userId: string, dto: CreateCorrectionDto): Promise<DataCorrectionDocument> {
    return this.model.create({ _id: generateUuid(), userId, ...dto });
  }

  async findByProduct(productId: string, pagination: PaginationDto) {
    const { limit, offset } = pagination;
    const [items, total] = await Promise.all([
      this.model.find({ productId }).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.model.countDocuments({ productId }).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async findAll(status: CorrectionStatus, pagination: PaginationDto) {
    const filter = status ? { status } : {};
    const { limit, offset } = pagination;
    const [items, total] = await Promise.all([
      this.model.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total, limit, offset };
  }

  async review(
    id: string,
    adminId: string,
    status: CorrectionStatus,
    reviewNote?: string,
  ): Promise<DataCorrectionDocument> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { status, reviewedBy: adminId, reviewNote, reviewedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Correction not found');
    return doc;
  }
}
