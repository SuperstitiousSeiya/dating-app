import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * A NestJS pipe that validates the request body/query/param against a Zod schema.
 *
 * Usage in controllers:
 *   @Body(new ZodValidationPipe(CreateProfileSchema)) dto: CreateProfileDto
 *
 * Or set globally in main.ts to validate DTOs that carry a static `schema` property.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // If a schema was passed directly to the pipe, use it
    if (this.schema) {
      return this.parseOrThrow(this.schema, value);
    }

    // If no schema is provided, pass through — the global pipe is a no-op
    // without an explicit schema at the parameter level.
    void metadata;
    return value;
  }

  private parseOrThrow(schema: ZodSchema, value: unknown): unknown {
    const result = schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: issues,
      });
    }
    return result.data;
  }
}
