import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { Product, ProductSchema } from '../../database/schemas/product.schema';
import {
  DataCorrection,
  DataCorrectionSchema,
} from '../../database/schemas/data-correction.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: DataCorrection.name, schema: DataCorrectionSchema },
    ]),
    AuthModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
