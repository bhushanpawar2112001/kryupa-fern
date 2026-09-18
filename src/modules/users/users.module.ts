import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { UserProduct, UserProductSchema } from '../../database/schemas/user-product.schema';
import { Score, ScoreSchema } from '../../database/schemas/score.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProduct.name, schema: UserProductSchema },
      { name: Score.name, schema: ScoreSchema },
    ]),
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
