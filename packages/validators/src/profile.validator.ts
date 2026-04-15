import { z } from "zod";
import { GenderSchema, IntentSchema, GeoPointSchema } from "./common";

export const PhotoSchema = z.object({
  cloudinaryId: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  order: z.number().int().min(0).max(5),
  isVerificationPhoto: z.boolean().default(false),
});

export const PromptSchema = z.object({
  question: z.string().min(1).max(120),
  answer: z.string().min(1).max(300),
});

export const PreferencesSchema = z.object({
  ageRange: z.object({
    min: z.number().int().min(18).max(99),
    max: z.number().int().min(18).max(99),
  }).refine((v) => v.min <= v.max, "Min age must be ≤ max age"),
  maxDistanceKm: z.number().int().min(1).max(300),
  genders: z.array(GenderSchema).min(1, "Select at least one gender"),
  intent: IntentSchema,
});

export const CreateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be at most 30 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  birthDate: z.string().datetime({ message: "Invalid date format" }),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  gender: GenderSchema,
  interestedIn: z.array(GenderSchema).min(1, "Select at least one gender"),
  location: GeoPointSchema,
  preferences: PreferencesSchema.optional(),
});

export const UpdateProfileSchema = CreateProfileSchema.partial().extend({
  prompts: z.array(PromptSchema).max(3, "Maximum 3 prompts allowed").optional(),
});

export const UpdatePreferencesSchema = PreferencesSchema;

export type PhotoDto = z.infer<typeof PhotoSchema>;
export type PromptDto = z.infer<typeof PromptSchema>;
export type PreferencesDto = z.infer<typeof PreferencesSchema>;
export type CreateProfileDto = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesDto = z.infer<typeof UpdatePreferencesSchema>;
