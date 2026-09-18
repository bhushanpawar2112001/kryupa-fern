import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { CorrectionStatus } from '../../database/schemas/data-correction.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class ReviewCorrectionDto {
  @ApiPropertyOptional({ enum: CorrectionStatus })
  @IsEnum(CorrectionStatus)
  status: CorrectionStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewNote?: string;
}

class SetRoleDto {
  @ApiPropertyOptional({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async dashboard() {
    const data = await this.adminService.getDashboardStats();
    return ApiResponseDto.success(data, 'Dashboard stats');
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async listUsers(@Query() pagination: PaginationDto) {
    const { items, total, limit, offset } = await this.adminService.listUsers(pagination);
    return ApiResponseDto.paginated(items, total, limit, offset, 'Users fetched');
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate a user account' })
  @ApiParam({ name: 'id' })
  async activateUser(@Param('id') id: string) {
    const data = await this.adminService.setUserActive(id, true);
    return ApiResponseDto.success(data, 'User activated');
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user account' })
  @ApiParam({ name: 'id' })
  async deactivateUser(@Param('id') id: string) {
    const data = await this.adminService.setUserActive(id, false);
    return ApiResponseDto.success(data, 'User deactivated');
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id' })
  async setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    const data = await this.adminService.setUserRole(id, dto.role);
    return ApiResponseDto.success(data, 'Role updated');
  }

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products/pending')
  @ApiOperation({ summary: 'List community-submitted products pending review' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async pendingProducts(@Query() pagination: PaginationDto) {
    const { items, total, limit, offset } = await this.adminService.listPendingProducts(pagination);
    return ApiResponseDto.paginated(items, total, limit, offset, 'Pending products');
  }

  @Patch('products/:id/approve')
  @ApiOperation({ summary: 'Approve a pending product' })
  @ApiParam({ name: 'id' })
  async approveProduct(@Param('id') id: string) {
    const data = await this.adminService.approveProduct(id);
    return ApiResponseDto.success(data, 'Product approved');
  }

  @Patch('products/:id/reject')
  @ApiOperation({ summary: 'Reject a pending product' })
  @ApiParam({ name: 'id' })
  async rejectProduct(@Param('id') id: string) {
    const data = await this.adminService.rejectProduct(id);
    return ApiResponseDto.success(data, 'Product rejected');
  }

  // ── Data Corrections ──────────────────────────────────────────────────────

  @Get('corrections')
  @ApiOperation({ summary: 'List data correction reports' })
  @ApiQuery({ name: 'status', enum: CorrectionStatus, required: false })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async listCorrections(
    @Query('status') status: CorrectionStatus,
    @Query() pagination: PaginationDto,
  ) {
    const { items, total, limit, offset } = await this.adminService.listCorrections(
      status,
      pagination,
    );
    return ApiResponseDto.paginated(items, total, limit, offset, 'Corrections fetched');
  }

  @Patch('corrections/:id/review')
  @ApiOperation({ summary: 'Approve or reject a data correction' })
  @ApiParam({ name: 'id' })
  async reviewCorrection(
    @Param('id') id: string,
    @Body() dto: ReviewCorrectionDto,
    @CurrentUser('userId') adminId: string,
  ) {
    const data = await this.adminService.reviewCorrection(id, adminId, dto.status, dto.reviewNote);
    return ApiResponseDto.success(data, 'Correction reviewed');
  }
}
