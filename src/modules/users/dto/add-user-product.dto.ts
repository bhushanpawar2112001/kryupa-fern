import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { UserProductType } from '../../../database/schemas/user-product.schema';

export class AddUserProductDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ enum: UserProductType })
  @IsEnum(UserProductType)
  type: UserProductType;
}
