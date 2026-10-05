import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = this.deriveErrorCode(statusCode, message);
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || exception.message;
        code = (obj.code as string) || this.deriveErrorCode(statusCode, message);
        details = obj.details || (Array.isArray(obj.message) ? obj.message : undefined);
        if (Array.isArray(obj.message)) {
          message = obj.message.join('; ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'INTERNAL_ERROR';
    }

    const payload: ApiErrorResponse = {
      statusCode,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(statusCode).json(payload);
  }

  private deriveErrorCode(status: number, message: string): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'AUTH_UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'AUTH_FORBIDDEN';
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_FAILED';
    if (status === HttpStatus.CONFLICT) {
      if (message.includes('transition')) return 'RIDE_INVALID_TRANSITION';
      if (message.includes('active ride')) return 'RIDE_ACTIVE_EXISTS';
      if (message.includes('taken')) return 'OFFER_ALREADY_TAKEN';
      return 'CONFLICT';
    }
    if (status === HttpStatus.GONE) return 'OFFER_EXPIRED';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'OUT_OF_SERVICE_AREA';
    return `HTTP_${status}`;
  }
}
