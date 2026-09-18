import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current subscription plan' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async get(@CurrentUser('userId') userId: string) {
    const data = await this.service.getOrCreate(userId);
    return ApiResponseDto.success(data, 'Subscription fetched');
  }

  @Post('me')
  @ApiOperation({ summary: 'Subscribe to a plan (or upgrade/downgrade)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async subscribe(@CurrentUser('userId') userId: string, @Body() dto: CreateSubscriptionDto) {
    const data = await this.service.upsert(userId, dto);
    return ApiResponseDto.success(data, 'Subscription updated');
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async cancel(@CurrentUser('userId') userId: string) {
    const data = await this.service.cancel(userId);
    return ApiResponseDto.success(data, 'Subscription cancelled');
  }
}
