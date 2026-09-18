import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, AuthProvider } from '../../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { generateUuid } from '../../common/utils';
import { verifyFirebaseToken } from '../../config/firebase.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Firebase Token Login (Google + Email OTP) ───────────────────────────

  async loginWithFirebaseToken(idToken: string): Promise<AuthResponseDto> {
    // Verify with Firebase Admin SDK
    const decoded = await verifyFirebaseToken(idToken);

    const { uid, email, name, picture } = decoded;

    // Determine provider
    const provider =
      decoded.firebase?.sign_in_provider === 'google.com'
        ? AuthProvider.GOOGLE
        : AuthProvider.EMAIL;

    // Upsert user by Firebase UID (stored in socialId)
    let user = await this.userModel.findOne({ socialId: uid }).exec();

    if (!user) {
      user = await this.userModel.create({
        _id: generateUuid(),
        email: email?.toLowerCase(),
        displayName: name,
        avatarUrl: picture,
        authProvider: provider,
        socialId: uid,
        isGuest: false,
      });
    } else {
      // Update profile info if changed
      user.email = email?.toLowerCase() ?? user.email;
      user.displayName = name ?? user.displayName;
      user.avatarUrl = picture ?? user.avatarUrl;
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    return this.buildAuthResponse(user, tokens);
  }

  // ─── Register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.email && !dto.phone && dto.authProvider === AuthProvider.EMAIL) {
      throw new BadRequestException('Email or phone is required');
    }

    // Check duplicate
    if (dto.email) {
      const exists = await this.userModel.findOne({ email: dto.email }).exec();
      if (exists) throw new ConflictException('Email already registered');
    }
    if (dto.phone) {
      const exists = await this.userModel.findOne({ phone: dto.phone }).exec();
      if (exists) throw new ConflictException('Phone already registered');
    }

    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;

    const user = await this.userModel.create({
      _id: generateUuid(),
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      displayName: dto.displayName,
      authProvider: dto.authProvider ?? AuthProvider.EMAIL,
      socialId: dto.socialId,
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const query = dto.email ? { email: dto.email } : { phone: dto.phone };
    const user = await this.userModel.findOne(query).select('+password').exec();

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const passwordMatch = await bcrypt.compare(dto.password, user.password ?? '');
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokensDto> {
    const user = await this.userModel.findById(userId).select('+refreshToken').exec();
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied');

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null }).exec();
  }

  // ─── Guest ────────────────────────────────────────────────────────────────

  async loginAsGuest(deviceId?: string): Promise<AuthResponseDto> {
    // If deviceId provided, reuse the same guest user every time
    if (deviceId) {
      const existing = await this.userModel
        .findOne({ authProvider: AuthProvider.GUEST, socialId: deviceId })
        .exec();
      if (existing) {
        const tokens = await this.generateTokens(existing);
        await this.saveRefreshToken(existing._id, tokens.refreshToken);
        existing.lastLoginAt = new Date();
        await existing.save();
        return this.buildAuthResponse(existing, tokens);
      }
    }

    // Create new guest (with deviceId stored in socialId for future lookups)
    const user = await this.userModel.create({
      _id: generateUuid(),
      authProvider: AuthProvider.GUEST,
      isGuest: true,
      displayName: 'Guest',
      socialId: deviceId ?? generateUuid(),
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    return this.buildAuthResponse(user, tokens);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateTokens(user: UserDocument): Promise<AuthTokensDto> {
    const payload = { sub: user._id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 604800 };
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed }).exec();
  }

  private buildAuthResponse(user: UserDocument, tokens: AuthTokensDto): AuthResponseDto {
    return {
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tokens,
    };
  }
}
