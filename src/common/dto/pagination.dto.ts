import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset: number = 0;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
