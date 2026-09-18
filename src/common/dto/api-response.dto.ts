import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiPropertyOptional({ example: 'Operation successful' })
  message?: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ example: null })
  error?: string | null;

  @ApiProperty({ example: '2026-09-17T08:00:00.000Z' })
  timestamp: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'Success', statusCode = 200): ApiResponseDto<T> {
    return new ApiResponseDto<T>({ success: true, statusCode, message, data, error: null });
  }

  static error(message: string, statusCode = 400, error?: string): ApiResponseDto<null> {
    return new ApiResponseDto<null>({
      success: false,
      statusCode,
      message,
      data: null,
      error: error ?? message,
    });
  }

  static paginated<T>(
    items: T[],
    total: number,
    limit: number,
    offset: number,
    message = 'Success',
  ): ApiResponseDto<{ items: T[]; total: number; limit: number; offset: number; pages: number }> {
    return new ApiResponseDto({
      success: true,
      statusCode: 200,
      message,
      data: { items, total, limit, offset, pages: Math.ceil(total / limit) },
      error: null,
    });
  }
}
