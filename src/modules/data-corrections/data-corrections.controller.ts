import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DataCorrectionsService } from './data-corrections.service';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Data Corrections')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('data-corrections')
export class DataCorrectionsController {
  constructor(private readonly service: DataCorrectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a data correction for a product' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateCorrectionDto) {
    const data = await this.service.create(userId, dto);
    return ApiResponseDto.success(data, 'Correction submitted', HttpStatus.CREATED);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get corrections for a product' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findByProduct(@Param('productId') productId: string, @Query() pagination: PaginationDto) {
    const { items, total, limit, offset } = await this.service.findByProduct(productId, pagination);
    return ApiResponseDto.paginated(items, total, limit, offset);
  }
}
