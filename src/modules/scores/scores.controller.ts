import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Scores')
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get health score for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Score not yet calculated' })
  async findByProduct(@Param('productId') productId: string) {
    const data = await this.scoresService.findByProduct(productId);
    return ApiResponseDto.success(data, 'Score fetched');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get score by score UUID' })
  @ApiParam({ name: 'id', description: 'Score UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.scoresService.findById(id);
    return ApiResponseDto.success(data, 'Score fetched');
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Create or update a product score' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async upsert(@Body() dto: CreateScoreDto) {
    const data = await this.scoresService.upsertScore(dto);
    return ApiResponseDto.success(data, 'Score saved');
  }
}
