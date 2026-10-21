import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let code = 'DB_ERROR';

    // Duplicate key
    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
      code = 'DUPLICATE_KEY';
    }
    // Bad ObjectId
    else if (exception.name === 'CastError' || exception.code === 12345) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid ID format';
      code = 'INVALID_ID';
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message,
      code,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}