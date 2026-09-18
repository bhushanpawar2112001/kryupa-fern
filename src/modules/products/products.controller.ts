import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List / search products with pagination' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async findAll(@Query() query: QueryProductDto) {
    const { items, total, limit, offset } = await this.productsService.findAll(query);
    return ApiResponseDto.paginated(items, total, limit, offset, 'Products fetched');
  }

  @Get('barcode/:barcode')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Look up a product by barcode (scan flow)',
    description:
      'Returns the full scan result: product info, health score (A-F grade), ' +
      'plain-language summary, allergens, good-for/avoid-if lists. ' +
      'Automatically records scan history when called with a valid Bearer token.',
  })
  @ApiParam({ name: 'barcode', example: '8901030862013' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'No product found for this barcode' })
  async findByBarcode(
    @Param('barcode') barcode: string,
    @CurrentUser() currentUser?: { userId: string },
  ) {
    const data = await this.productsService.scanByBarcode(barcode);

    // Auto-record history — fire-and-forget, never delays the response
    if (currentUser?.userId) {
      this.usersService.addToHistory(currentUser.userId, data.productId, barcode).catch(() => {});
    }

    return ApiResponseDto.success(data, 'Product found');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by UUID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  @ApiResponse({ status: 404 })
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findById(id);
    return ApiResponseDto.success(data, 'Product fetched');
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Community-submit a product (OCR / manual entry)' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async submit(@Body() dto: CreateProductDto, @CurrentUser('userId') userId: string) {
    const data = await this.productsService.create(dto, userId);
    return ApiResponseDto.success(data, 'Product submitted for review', HttpStatus.CREATED);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update product (admin / data team)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const data = await this.productsService.update(id, dto);
    return ApiResponseDto.success(data, 'Product updated');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Archive / remove a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return ApiResponseDto.success(null, 'Product archived');
  }
}
