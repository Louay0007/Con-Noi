import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Single global exception filter.
 *
 * Previously two filters were registered (`MongoExceptionFilter` and this one),
 * which made precedence ambiguous. Mongo/Mongoose errors are now handled here
 * so there is exactly one place that shapes an error response — and so a
 * duplicate e-mail, for example, returns 409 instead of 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (exResponse && typeof exResponse === 'object') {
        const r = exResponse as Record<string, unknown>;
        const rawMessage = r.message;
        // class-validator returns an array of messages.
        if (Array.isArray(rawMessage)) {
          message = rawMessage.join('; ');
          code = 'VALIDATION_ERROR';
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
        if (typeof r.code === 'string') code = r.code;
      }
    } else {
      const err = exception as {
        name?: string;
        code?: number | string;
        keyPattern?: Record<string, unknown>;
        message?: string;
      };

      if (err?.code === 11000) {
        status = HttpStatus.CONFLICT;
        const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
        message = field ? `Resource already exists (${field})` : 'Resource already exists';
        code = 'DUPLICATE_KEY';
      } else if (err?.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
      } else if (err?.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
      } else if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongoNetworkError') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database unavailable';
        code = 'DB_UNAVAILABLE';
        this.logger.error(`Database unavailable: ${err.message ?? ''}`);
      } else {
        // Unexpected: log the stack, never leak internals to the client.
        this.logger.error(
          `Unhandled error on ${request?.url ?? 'unknown'}`,
          exception instanceof Error ? exception.stack : String(exception),
        );
      }
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      code = 'RATE_LIMITED';
      message = 'Too many requests. Try again shortly.';
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request?.url,
    });
  }
}
