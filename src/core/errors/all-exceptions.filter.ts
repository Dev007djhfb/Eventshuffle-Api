import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  requestId: string;
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse();

    const requestId =
      (req as any).id || (req as any).headers?.['x-request-id'] || randomUUID();

    const timestamp = new Date().toISOString();
    const path = (req as any).url;
    const method = (req as any).method;

    let status: number;
    let code: string;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        code = responseObj.code || this.getCodeFromStatus(status);
        message = responseObj.message || exception.message;
        details =
          responseObj.details || responseObj.field
            ? { field: responseObj.field }
            : undefined;
      } else {
        code = this.getCodeFromStatus(status);
        message = exception.message;
      }
    } else if (this.isDatabaseError(exception)) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'DATABASE_ERROR';
      message = 'Database operation failed';

      // Log detailed database error for developers
      this.logger.error(
        `Database Error [${requestId}] ${method} ${path}:`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (this.isValidationError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = this.extractValidationMessage(exception);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'Internal server error';

      // Log unexpected errors with full details
      this.logger.error(
        `Unexpected Error [${requestId}] ${method} ${path}:`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Always log the error for monitoring
    if (status >= 500) {
      this.logger.error(
        `${status} ${code} [${requestId}] ${method} ${path}: ${message}`,
      );
    } else {
      this.logger.warn(
        `${status} ${code} [${requestId}] ${method} ${path}: ${message}`,
      );
    }

    // Never expose internal details in production
    const errorResponse: ErrorResponse = {
      requestId,
      statusCode: status,
      code,
      message:
        status >= 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
      timestamp,
      path,
    };

    // Only include details for client errors (4xx) and in development
    if (details && (status < 500 || process.env.NODE_ENV === 'development')) {
      errorResponse.details = details;
    }

    httpAdapter.reply(res as any, errorResponse, status);
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'HTTP_ERROR';
    }
  }

  private isDatabaseError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    const message = exception.message.toLowerCase();
    const stack = exception.stack?.toLowerCase() || '';

    return (
      message.includes('connect econnrefused') ||
      message.includes('database') ||
      message.includes('relation') ||
      message.includes('column') ||
      message.includes('constraint') ||
      stack.includes('node_modules/pg') ||
      stack.includes('drizzle') ||
      exception.name === 'DatabaseError'
    );
  }

  private isValidationError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    return (
      exception.name === 'ValidationError' ||
      exception.message.includes('validation') ||
      exception.message.includes('invalid') ||
      exception.message.includes('required')
    );
  }

  private extractValidationMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Validation failed';
  }
}
