import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { Score, ScoreSchema } from '../../database/schemas/score.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { ScoresModule } from '../scores/scores.module';
import { UsersModule } from '../users/users.module';
import { OpenFoodFactsService } from './catalog/open-food-facts.service';
import { IndiaCatalogService } from './catalog/india-catalog.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Score.name, schema: ScoreSchema },
    ]),
    AuthModule,
    CategoriesModule,
    ScoresModule,
    UsersModule,
  ],
  providers: [ProductsService, OpenFoodFactsService, IndiaCatalogService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
