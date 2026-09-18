import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus();

    const raw = exception.getResponse();

    // NestJS validation errors come as { message: string[], error: string, statusCode: number }
    // Flatten the array to a readable string for the mobile client
    let message: string;
    if (typeof raw === 'string') {
      message = raw;
    } else if (typeof raw === 'object' && raw !== null) {
      const r = raw as Record<string, any>;
      if (Array.isArray(r.message)) {
        message = r.message.join('; ');
      } else {
        message = r.message ?? r.error ?? 'Request failed';
      }
    } else {
      message = 'Request failed';
    }

    this.logger.error(`${request.method} ${request.url} → ${status}`);

    // Return the unified envelope the Flutter client expects:
    // { success, statusCode, message, data, error, timestamp }
    response.status(status).json({
      success:    false,
      statusCode: status,
      message,
      data:       null,
      error:      message,
      timestamp:  new Date().toISOString(),
      path:       request.url,
    });
  }
}
