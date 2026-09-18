import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument, CategoryType } from '../../database/schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { generateUuid } from '../../common/utils';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.categoryModel.create({ _id: generateUuid(), ...dto });
  }

  async findAll(type?: CategoryType): Promise<CategoryDocument[]> {
    const filter: Record<string, any> = { isActive: true, parentId: null };
    if (type) filter.type = type;
    return this.categoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findOne({ slug }).exec();
    if (!cat) throw new NotFoundException(`Category '${slug}' not found`);
    return cat;
  }

  async findSubcategories(parentId: string): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parentId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }
}
