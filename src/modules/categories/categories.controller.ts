import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { CategoryType } from '../../database/schemas/category.schema';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all top-level categories (optionally filter by type)' })
  @ApiQuery({ name: 'type', enum: CategoryType, required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@Query('type') type?: CategoryType) {
    const data = await this.categoriesService.findAll(type);
    return ApiResponseDto.success(data, 'Categories fetched');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  @ApiParam({ name: 'slug', example: 'greek-yogurt' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.categoriesService.findBySlug(slug);
    return ApiResponseDto.success(data, 'Category fetched');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.categoriesService.findById(id);
    return ApiResponseDto.success(data, 'Category fetched');
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories of a parent category' })
  @ApiParam({ name: 'id', description: 'Parent category UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findSubcategories(@Param('id') id: string) {
    const data = await this.categoriesService.findSubcategories(id);
    return ApiResponseDto.success(data, 'Subcategories fetched');
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Create a new category' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return ApiResponseDto.success(data, 'Category created', 201);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    const data = await this.categoriesService.update(id, dto);
    return ApiResponseDto.success(data, 'Category updated');
  }
}
