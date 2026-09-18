import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { ScoresModule } from '../scores/scores.module';
import { OpenFoodFactsService } from './catalog/open-food-facts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    AuthModule,
    CategoriesModule,
    ScoresModule,
  ],
  providers: [ProductsService, OpenFoodFactsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
