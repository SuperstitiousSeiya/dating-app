import { z } from "zod";

export const ObjectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const GenderSchema = z.enum(["man", "woman", "nonbinary", "other"]);

export const IntentSchema = z.enum([
  "relationship",
  "casual",
  "friendship",
  "unsure",
]);

export const SubscriptionTierSchema = z.enum(["free", "gold", "platinum"]);

export const GeoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;
