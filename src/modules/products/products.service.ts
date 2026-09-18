import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from '../../database/schemas/product.schema';
import { Score, ScoreDocument } from '../../database/schemas/score.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ScanResultDto } from './dto/scan-result.dto';
import { generateUuid } from '../../common/utils';
import { CategoriesService } from '../categories/categories.service';
import { ScoresService } from '../scores/scores.service';
import { OpenFoodFactsService } from './catalog/open-food-facts.service';
import { IndiaCatalogService, isIndianBarcode } from './catalog/india-catalog.service';
import { barcodeVariants } from './catalog/barcode.util';
import { categorySlugFor } from './catalog/open-food-facts.mapper';
import { scoreFromCatalog } from './catalog/catalog-score';
import { buildPlainSummary } from './catalog/plain-language';
import { CatalogProduct } from './catalog/open-food-facts.types';
import { CategoryType } from '../../database/schemas/category.schema';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Score.name) private readonly scoreModel: Model<ScoreDocument>,
    private readonly categoriesService: CategoriesService,
    private readonly scoresService: ScoresService,
    private readonly openFoodFactsService: OpenFoodFactsService,
    private readonly indiaCatalogService: IndiaCatalogService,
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
    else filter.status = ProductStatus.ACTIVE;

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

  /**
   * Core scan flow — returns a fully enriched ScanResult with:
   *  - Product identity, images, ingredients, nutrition facts
   *  - Health score: overall score (0-100), letter grade (A-F), label
   *  - Score factors in plain language (what's good, what's bad)
   *  - goodFor / avoidIf lists
   *  - Plain-language summary (no jargon, Indian brand context)
   *  - Allergens, tags, data source
   *
   * Lookup priority:
   *  1. Local DB (cached)
   *  2. India catalog mirror (for 890-prefix barcodes — Amul, Parle, Dabur, etc.)
   *  3. Global Open Food Facts / Open Beauty Facts
   *  4. India catalog fallback (catches non-890 Indian products)
   */
  async scanByBarcode(barcode: string): Promise<ScanResultDto> {
    const product = await this.resolveProduct(barcode);
    const score = await this.scoreModel.findOne({ productId: product._id }).exec();
    return this.buildScanResult(product, score);
  }

  /** Still available for internal use — returns the raw product document. */
  async findByBarcode(barcode: string): Promise<ProductDocument> {
    return this.resolveProduct(barcode);
  }

  private async resolveProduct(barcode: string): Promise<ProductDocument> {
    const variants = barcodeVariants(barcode);

    // 1. Local DB cache
    const existing = await this.productModel.findOne({ barcode: { $in: variants } }).exec();
    if (existing) return existing;

    // 2. Indian barcodes (GS1 India prefix 890) — try India mirror first
    let catalog: CatalogProduct | null = null;
    if (isIndianBarcode(barcode)) {
      catalog = await this.indiaCatalogService.lookup(barcode);
    }

    // 3. Global OFF / Open Beauty Facts
    if (!catalog) {
      catalog = await this.openFoodFactsService.lookup(barcode);
    }

    // 4. India fallback for non-890 Indian products
    if (!catalog) {
      catalog = await this.indiaCatalogService.lookup(barcode);
    }

    if (!catalog) {
      throw new NotFoundException(`No product found with barcode ${barcode}`);
    }

    return this.importCatalogProduct(catalog);
  }

  /**
   * Assembles the ScanResultDto from a product document + optional score.
   * Works for both freshly imported and cached products.
   */
  private buildScanResult(product: ProductDocument, score: ScoreDocument | null): ScanResultDto {
    const raw = (product.rawDataJson ?? {}) as Record<string, any>;

    // Plain-language summary — stored at import time in rawDataJson
    const summary = raw.humanReadableSummary ?? null;

    // Allergens: stored in rawDataJson.allergens or fall back to empty
    const allergens: string[] = Array.isArray(raw.allergens) ? raw.allergens : [];

    // Kind: inferred from dataSource or stored tag
    const kind = raw.kind ?? (product.dataSource?.includes('Beauty') ? 'beauty' : 'food');

    return {
      productId: product._id,
      barcode: product.barcode ?? '',
      name: product.name,
      brand: product.brand,
      description: product.description ?? null,
      kind,
      categoryId: product.categoryId,
      images: product.images ?? [],
      ingredients: product.ingredients ?? [],
      nutritionFacts: (product.nutritionFacts ?? []).map((nf) => ({
        name: nf.name,
        value: nf.value,
        unit: nf.unit,
      })),
      score: score
        ? {
            overallScore: score.overallScore,
            grade: score.grade,
            label: score.label,
            factors: (score.factors ?? []).map((f) => ({
              label: f.label,
              impact: f.impact,
              reason: f.reason,
            })),
            goodFor: score.goodFor ?? [],
            avoidIf: score.avoidIf ?? [],
          }
        : null,
      summary,
      allergens,
      tags: product.tags ?? [],
      dataSource: product.dataSource ?? '',
      dataSourceUrl: product.dataSourceUrl ?? null,
    };
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

    // Build plain-language summary — stored in rawDataJson so it comes back
    // with the product without any extra query.
    const summary = buildPlainSummary(catalog);

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
        // Human-readable summary — displayed directly in the app
        humanReadableSummary: summary,
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

    this.logger.log(
      `Imported ${catalog.dataSource} product ${catalog.barcode} (${catalog.name}) [${catalog.kind}]`,
    );
    return product;
  }

  private async resolveCategoryId(catalog: CatalogProduct): Promise<string> {
    const preferred = categorySlugFor(catalog);

    let fallback: string;
    if (catalog.kind === 'pharma') {
      fallback = 'medicine';
    } else if (catalog.kind === 'beauty') {
      fallback = 'skincare';
    } else {
      fallback = 'food';
    }

    for (const slug of [preferred, fallback]) {
      try {
        const category = await this.categoriesService.findBySlug(slug);
        return category._id;
      } catch {
        // try next slug
      }
    }

    // Last resort: pick any root category of the matching type
    const type =
      catalog.kind === 'pharma'
        ? CategoryType.PHARMA
        : catalog.kind === 'beauty'
          ? CategoryType.SKINCARE
          : CategoryType.FOOD;

    const top = await this.categoriesService.findAll(type);
    if (top[0]) return top[0]._id;

    // Absolute fallback — any active root category
    const any = await this.categoriesService.findAll();
    if (any[0]) return any[0]._id;

    throw new NotFoundException('No product categories are configured');
  }
}
