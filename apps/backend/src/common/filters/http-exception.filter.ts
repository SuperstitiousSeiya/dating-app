import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";

import type { ApiError } from "@dating-app/types";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttpException ? exception.getResponse() : null;

    const code =
      typeof rawResponse === "object" && rawResponse !== null && "code" in rawResponse
        ? String((rawResponse as Record<string, unknown>)["code"])
        : this.statusToCode(statusCode);

    const message =
      typeof rawResponse === "object" && rawResponse !== null && "message" in rawResponse
        ? String((rawResponse as Record<string, unknown>)["message"])
        : isHttpException
          ? exception.message
          : "An unexpected error occurred";

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${statusCode} [${code}]`);
    }

    const errorResponse: ApiError = {
      success: false,
      error: {
        code,
        message: process.env["NODE_ENV"] === "production" && statusCode >= 500
          ? "An unexpected error occurred"
          : message,
        statusCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers["x-request-id"] as string | undefined) ?? uuidv4(),
      },
    };

    void reply.status(statusCode).send(errorResponse);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_SERVER_ERROR",
    };
    return map[status] ?? "UNKNOWN_ERROR";
  }
}
