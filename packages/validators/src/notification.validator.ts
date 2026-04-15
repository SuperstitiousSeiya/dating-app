import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "match",
  "message",
  "superlike",
  "system",
]);

export const GetNotificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type GetNotificationsQueryDto = z.infer<typeof GetNotificationsQuerySchema>;
