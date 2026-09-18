import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findByProduct(@Param('productId') productId: string, @Query() pagination: PaginationDto) {
    const { items, total, limit, offset } = await this.reviewsService.findByProduct(
      productId,
      pagination,
    );
    return ApiResponseDto.paginated(items, total, limit, offset, 'Reviews fetched');
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update your review for a product' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateReviewDto) {
    const data = await this.reviewsService.create(userId, dto);
    return ApiResponseDto.success(data, 'Review saved');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete your review (admin can delete any)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.reviewsService.delete(id, user.userId, user.role === 'admin');
    return ApiResponseDto.success(null, 'Review removed');
  }
}
