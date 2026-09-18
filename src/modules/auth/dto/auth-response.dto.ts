import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 604800 })
  expiresIn: number;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://lh3.googleusercontent.com/photo.jpg' })
  avatarUrl?: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty()
  tokens: AuthTokensDto;
}
