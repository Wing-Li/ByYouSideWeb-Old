import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AlreadyWrappedResponse, ApiResponseBody } from './api-response.types';

@Injectable()
export class ResponseInterceptor<TData> implements NestInterceptor<
  TData,
  ApiResponseBody<TData>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<ApiResponseBody<TData>> {
    return next.handle().pipe(
      map((data: TData): ApiResponseBody<TData> => {
        if (this.isWrappedResponse(data)) {
          return data as ApiResponseBody<TData>;
        }

        return {
          code: 200,
          message: 'success',
          data,
        };
      }),
    );
  }

  private isWrappedResponse(data: unknown): data is AlreadyWrappedResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      'message' in data &&
      'data' in data
    );
  }
}
