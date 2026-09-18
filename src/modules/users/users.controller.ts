import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserProductDto } from './dto/add-user-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { UserProductType } from '../../database/schemas/user-product.schema';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getProfile(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getProfile(userId);
    return ApiResponseDto.success(data, 'Profile fetched');
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update display name / avatar' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async updateProfile(@CurrentUser('userId') userId: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.updateProfile(userId, dto);
    return ApiResponseDto.success(data, 'Profile updated');
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete / deactivate account (GDPR right to erasure)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async deleteAccount(@CurrentUser('userId') userId: string) {
    await this.usersService.deleteAccount(userId);
    return ApiResponseDto.success(null, 'Account deactivated');
  }

  // ─── Favorites ────────────────────────────────────────────────────────────

  @Get('me/favorites')
  @ApiOperation({ summary: 'List saved favorite products' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getFavorites(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getFavorites(userId);
    return ApiResponseDto.success(data, 'Favorites fetched');
  }

  @Post('me/favorites')
  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async addFavorite(@CurrentUser('userId') userId: string, @Body() dto: AddUserProductDto) {
    const data = await this.usersService.addUserProduct(userId, {
      ...dto,
      type: UserProductType.FAVORITE,
    });
    return ApiResponseDto.success(data, 'Added to favorites');
  }

  @Delete('me/favorites/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async removeFavorite(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    await this.usersService.removeUserProduct(userId, productId, UserProductType.FAVORITE);
    return ApiResponseDto.success(null, 'Removed from favorites');
  }

  // ─── Scan History ─────────────────────────────────────────────────────────

  @Get('me/history')
  @ApiOperation({ summary: 'Get scan history (newest scan first)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getHistory(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getScanHistory(userId);
    return ApiResponseDto.success(data, 'Scan history fetched');
  }

  @Delete('me/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire scan history' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async clearHistory(@CurrentUser('userId') userId: string) {
    await this.usersService.clearHistory(userId);
    return ApiResponseDto.success(null, 'Scan history cleared');
  }

  @Delete('me/history/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific product from scan history' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async removeHistory(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    await this.usersService.removeUserProduct(userId, productId, UserProductType.HISTORY);
    return ApiResponseDto.success(null, 'Removed from history');
  }

  // ─── Watchlist ────────────────────────────────────────────────────────────

  @Get('me/watchlist')
  @ApiOperation({ summary: 'Get watchlist' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getWatchlist(@CurrentUser('userId') userId: string) {
    const data = await this.usersService.getWatchlist(userId);
    return ApiResponseDto.success(data, 'Watchlist fetched');
  }

  @Post('me/watchlist')
  @ApiOperation({ summary: 'Add a product to watchlist' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async addWatchlist(@CurrentUser('userId') userId: string, @Body() dto: AddUserProductDto) {
    const data = await this.usersService.addUserProduct(userId, {
      ...dto,
      type: UserProductType.WATCHLIST,
    });
    return ApiResponseDto.success(data, 'Added to watchlist');
  }

  @Delete('me/watchlist/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a product from watchlist' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async removeWatchlist(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    await this.usersService.removeUserProduct(userId, productId, UserProductType.WATCHLIST);
    return ApiResponseDto.success(null, 'Removed from watchlist');
  }
}
