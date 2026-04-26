import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { Observable, map } from "rxjs";
import { v4 as uuidv4 } from "uuid";

import type { ApiResponse } from "@dating-app/types";

/**
 * Wraps every successful controller response in the standard ApiResponse envelope.
 * Controllers should return plain data objects — this interceptor handles the wrapper.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const requestId =
      (request.headers["x-request-id"] as string | undefined) ?? uuidv4();

    return next.handle().pipe(
      map((data: T) => ({
        success: true as const,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      })),
    );
  }
}
