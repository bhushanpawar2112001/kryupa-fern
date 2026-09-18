import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Rankings')
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get ranked leaderboard for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { items, total, limit, offset } = await this.rankingsService.findByCategory(
      categoryId,
      pagination,
    );
    return ApiResponseDto.paginated(items, total, limit, offset, 'Rankings fetched');
  }

  @Get('category/:categoryId/product/:productId')
  @ApiOperation({ summary: 'Get rank of a specific product in a category (e.g. "#2 in Oat Milk")' })
  @ApiParam({ name: 'categoryId', description: 'Category UUID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findProductRank(
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ) {
    const data = await this.rankingsService.findProductRank(categoryId, productId);
    return ApiResponseDto.success(data, 'Rank fetched');
  }
}
