import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Firebase ID token (Google / Email OTP) for Vero token' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async firebaseLogin(@Body() dto: FirebaseAuthDto): Promise<ApiResponseDto<AuthResponseDto>> {
    const data = await this.authService.loginWithFirebaseToken(dto.idToken);
    return ApiResponseDto.success(data, 'Signed in successfully');
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (email/phone/social)' })
  @ApiResponse({ status: 201, description: 'User registered', type: ApiResponseDto })
  @ApiResponse({ status: 409, description: 'Email or phone already registered' })
  async register(@Body() dto: RegisterDto): Promise<ApiResponseDto<AuthResponseDto>> {
    const data = await this.authService.register(dto);
    return ApiResponseDto.success(data, 'Registration successful', HttpStatus.CREATED);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone + password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: ApiResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<ApiResponseDto<AuthResponseDto>> {
    const data = await this.authService.login(dto);
    return ApiResponseDto.success(data, 'Login successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: ApiResponseDto })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async refresh(
    @CurrentUser('userId') userId: string,
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiResponseDto<AuthTokensDto>> {
    const data = await this.authService.refreshTokens(userId, dto.refreshToken);
    return ApiResponseDto.success(data, 'Tokens refreshed');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser('userId') userId: string): Promise<ApiResponseDto<null>> {
    await this.authService.logout(userId);
    return ApiResponseDto.success(null, 'Logged out successfully');
  }

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get or create a guest session — same user returned for same deviceId' })
  @ApiResponse({ status: 200, description: 'Guest session', type: ApiResponseDto })
  async guestLogin(@Body() dto: GuestLoginDto): Promise<ApiResponseDto<AuthResponseDto>> {
    const data = await this.authService.loginAsGuest(dto.deviceId);
    return ApiResponseDto.success(data, 'Guest session ready');
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user info from token' })
  @ApiResponse({ status: 200, description: 'Current user info', type: ApiResponseDto })
  async me(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
    return ApiResponseDto.success(user, 'Current user');
  }
}
