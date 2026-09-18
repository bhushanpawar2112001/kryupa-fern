import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from '../../database/schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { generateUuid } from '../../common/utils';
import { CategoriesService } from '../categories/categories.service';
import { ScoresService } from '../scores/scores.service';
import { OpenFoodFactsService } from './catalog/open-food-facts.service';
import { barcodeVariants } from './catalog/barcode.util';
import { categorySlugFor } from './catalog/open-food-facts.mapper';
import { scoreFromCatalog } from './catalog/catalog-score';
import { CatalogProduct } from './catalog/open-food-facts.types';
import { CategoryType } from '../../database/schemas/category.schema';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly scoresService: ScoresService,
    private readonly openFoodFactsService: OpenFoodFactsService,
  ) {}

  async create(dto: CreateProductDto, userId?: string): Promise<ProductDocument> {
    return this.productModel.create({
      _id: generateUuid(),
      ...dto,
      submittedBy: userId,
      isCrowdsourced: !!userId,
      status: userId ? ProductStatus.PENDING_REVIEW : ProductStatus.ACTIVE,
    });
  }

  async findAll(query: QueryProductDto) {
    const { search, categoryId, brand, status, limit, offset } = query;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (categoryId) filter.categoryId = categoryId;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (status) filter.status = status;
    else filter.status = ProductStatus.ACTIVE; // default: active only

    const [items, total] = await Promise.all([
      this.productModel.find(filter).skip(offset).limit(limit).sort({ createdAt: -1 }).exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findByBarcode(barcode: string): Promise<ProductDocument> {
    const variants = barcodeVariants(barcode);
    const existing = await this.productModel.findOne({ barcode: { $in: variants } }).exec();
    if (existing) return existing;

    const catalog = await this.openFoodFactsService.lookup(barcode);
    if (!catalog) {
      throw new NotFoundException(`No product found with barcode ${barcode}`);
    }

    return this.importCatalogProduct(catalog);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async remove(id: string): Promise<void> {
    await this.productModel.findByIdAndUpdate(id, { status: ProductStatus.ARCHIVED }).exec();
  }

  private async importCatalogProduct(catalog: CatalogProduct): Promise<ProductDocument> {
    const variants = barcodeVariants(catalog.barcode);
    const raced = await this.productModel.findOne({ barcode: { $in: variants } }).exec();
    if (raced) return raced;

    const categoryId = await this.resolveCategoryId(catalog);
    const product = await this.productModel.create({
      _id: generateUuid(),
      name: catalog.name,
      brand: catalog.brand,
      categoryId,
      barcode: catalog.barcode,
      images: catalog.images,
      ingredients: catalog.ingredients,
      nutritionFacts: catalog.nutritionFacts,
      rawDataJson: {
        nutriscoreGrade: catalog.nutriscoreGrade,
        novaGroup: catalog.novaGroup,
        additivesCount: catalog.additivesCount,
        allergens: catalog.allergens,
        nutriments: catalog.nutriments,
      },
      description: catalog.description,
      tags: catalog.tags,
      status: ProductStatus.ACTIVE,
      isCrowdsourced: false,
      dataSource: catalog.dataSource,
      dataSourceUrl: catalog.dataSourceUrl,
    });

    const scored = scoreFromCatalog(catalog);
    await this.scoresService.upsertScore({
      productId: product._id,
      overallScore: scored.overallScore,
      grade: scored.grade,
      label: scored.label,
      factors: scored.factors,
      avoidIf: scored.avoidIf,
      goodFor: scored.goodFor,
      scoringEngineVersion: scored.scoringEngineVersion,
    });
    await this.productModel.updateOne(
      { _id: product._id },
      { $set: { 'rawDataJson.scoringEngineVersion': scored.scoringEngineVersion } },
    );

    this.logger.log(`Imported ${catalog.dataSource} product ${catalog.barcode} (${catalog.name})`);
    return product;
  }

  private async resolveCategoryId(catalog: CatalogProduct): Promise<string> {
    const preferred = categorySlugFor(catalog);
    const fallback = catalog.kind === 'beauty' ? 'skincare' : 'food';
    for (const slug of [preferred, fallback]) {
      try {
        const category = await this.categoriesService.findBySlug(slug);
        return category._id;
      } catch {
        // try next slug
      }
    }

    const type = catalog.kind === 'beauty' ? CategoryType.SKINCARE : CategoryType.FOOD;
    const top = await this.categoriesService.findAll(type);
    if (top[0]) return top[0]._id;
    throw new NotFoundException('No product categories are configured');
  }
}
