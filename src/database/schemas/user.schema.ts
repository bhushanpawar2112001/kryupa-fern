import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { generateUuid } from '../../common/utils';

export type UserDocument = User & Document;

export enum AuthProvider {
  EMAIL = 'email',
  PHONE = 'phone',
  APPLE = 'apple',
  GOOGLE = 'google',
  GUEST = 'guest',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @ApiProperty({ example: 'uuid-v4-string' })
  @Prop({ type: String, default: () => generateUuid() })
  _id: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @Prop({ trim: true, lowercase: true })
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @Prop()
  phone: string;

  @Prop({ select: false })
  password: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @Prop({ trim: true })
  displayName: string;

  @ApiPropertyOptional()
  @Prop()
  avatarUrl: string;

  @ApiProperty({ enum: AuthProvider, default: AuthProvider.EMAIL })
  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.EMAIL })
  authProvider: AuthProvider;

  @Prop({ sparse: true })
  socialId: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isGuest: boolean;

  @ApiPropertyOptional()
  @Prop()
  lastLoginAt: Date;

  @Prop({ select: false })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
