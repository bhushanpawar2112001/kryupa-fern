import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCorrectionDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'The ingredients list is missing sunflower oil.' })
  @IsString()
  @MaxLength(2000)
  note: string;
}
