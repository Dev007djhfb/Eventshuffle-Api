import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR') {
    super(
      {
        message,
        code,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DatabaseException extends HttpException {
  constructor(
    message: string = 'Database operation failed',
    originalError?: Error,
  ) {
    super(
      {
        message: 'Internal server error',
        code: 'DATABASE_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    // Log original error for debugging but don't expose it
    if (originalError) {
      console.error('Database error:', originalError);
    }
  }
}

export class ValidationException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        message,
        code: 'VALIDATION_ERROR',
        statusCode: HttpStatus.BAD_REQUEST,
        field,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string | number) {
    super(
      {
        message: `${resource} with ID ${id} not found`,
        code: 'RESOURCE_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
        resource,
        id,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, code: string = 'CONFLICT_ERROR') {
    super(
      {
        message,
        code,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}
