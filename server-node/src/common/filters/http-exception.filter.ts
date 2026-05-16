import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { COMMON_ERROR_CODES } from '../errors/error-codes';
import { ApiResponseBody } from '../response/api-response.types';

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

type HttpExceptionPayload = {
  message?: string | string[];
  error?: string;
  code?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const body = this.buildBody(exception, payload, status);
    response.status(status).json(body);
  }

  private buildBody(
    exception: unknown,
    payload: string | object | undefined,
    status: number,
  ): ApiResponseBody<null> {
    if (typeof payload === 'string') {
      return {
        code: this.mapStatusToCode(status),
        message: payload,
        data: null,
      };
    }

    const exceptionPayload = this.isHttpPayload(payload) ? payload : undefined;
    const message = this.resolveMessage(exception, exceptionPayload, status);

    return {
      code: exceptionPayload?.code ?? this.mapStatusToCode(status),
      message,
      data: null,
    };
  }

  private resolveMessage(
    exception: unknown,
    payload: HttpExceptionPayload | undefined,
    status: number,
  ): string {
    const payloadMessage = payload?.message;

    if (Array.isArray(payloadMessage)) {
      return payloadMessage.join('; ');
    }

    if (typeof payloadMessage === 'string') {
      return payloadMessage;
    }

    if (exception instanceof Error && exception.message) {
      return exception.message;
    }

    if (status === HTTP_NOT_FOUND) {
      return 'Resource not found';
    }

    return 'Internal server error';
  }

  private mapStatusToCode(status: number): number {
    if (status === HTTP_BAD_REQUEST) {
      return COMMON_ERROR_CODES.VALIDATION_ERROR;
    }
    if (status === HTTP_UNAUTHORIZED) {
      return COMMON_ERROR_CODES.UNAUTHORIZED;
    }
    if (status === HTTP_FORBIDDEN) {
      return COMMON_ERROR_CODES.FORBIDDEN;
    }
    if (status === HTTP_NOT_FOUND) {
      return COMMON_ERROR_CODES.NOT_FOUND;
    }
    return COMMON_ERROR_CODES.INTERNAL_SERVER_ERROR;
  }

  private isHttpPayload(payload: unknown): payload is HttpExceptionPayload {
    return typeof payload === 'object' && payload !== null;
  }
}
