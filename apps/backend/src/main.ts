import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    logger: process.env["NODE_ENV"] !== "production",
    bodyLimit: 10 * 1024 * 1024, // 10MB — for photo uploads
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  const fastify = app.getHttpAdapter().getInstance();

  await fastify.register(cookie as unknown as Parameters<typeof fastify.register>[0], {
    secret: process.env["COOKIE_SECRET"] ?? "dev-cookie-secret",
  });
  await fastify.register(multipart as unknown as Parameters<typeof fastify.register>[0], {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.enableCors({
    origin: (process.env["ALLOWED_ORIGINS"] ?? "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env["NODE_ENV"] !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Dating App API")
      .setDescription("REST + WebSocket API for the dating application")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("auth")
      .addTag("profiles")
      .addTag("discovery")
      .addTag("swipes")
      .addTag("matches")
      .addTag("messages")
      .addTag("media")
      .addTag("notifications")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = Number(process.env["PORT"] ?? 3001);
  await app.listen(port, "0.0.0.0");
  console.warn(`Backend running on http://0.0.0.0:${port}`);
  console.warn(`Swagger docs at http://0.0.0.0:${port}/docs`);
}

bootstrap();
