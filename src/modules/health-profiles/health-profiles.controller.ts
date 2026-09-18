import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HealthProfilesService } from './health-profiles.service';
import { UpsertHealthProfileDto } from './dto/upsert-health-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Health Profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('health-profiles')
export class HealthProfilesController {
  constructor(private readonly service: HealthProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my health profile (allergies, conditions, diet, etc.)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async get(@CurrentUser('userId') userId: string) {
    const data = await this.service.findByUser(userId);
    return ApiResponseDto.success(data, 'Health profile fetched');
  }

  @Put('me')
  @ApiOperation({ summary: 'Create or update my health profile' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async upsert(@CurrentUser('userId') userId: string, @Body() dto: UpsertHealthProfileDto) {
    const data = await this.service.upsert(userId, dto);
    return ApiResponseDto.success(data, 'Health profile saved');
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete my health profile (GDPR erasure)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async delete(@CurrentUser('userId') userId: string) {
    await this.service.delete(userId);
    return ApiResponseDto.success(null, 'Health profile deleted');
  }
}
