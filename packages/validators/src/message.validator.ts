import { z } from "zod";
import { ObjectIdSchema } from "./common";

export const MessageTypeSchema = z.enum(["text", "gif", "image", "audio"]);

export const SendMessageSchema = z.object({
  matchId: ObjectIdSchema,
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  type: MessageTypeSchema.default("text"),
});

export const GetMessagesQuerySchema = z.object({
  cursor: ObjectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export type MessageType = z.infer<typeof MessageTypeSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type GetMessagesQueryDto = z.infer<typeof GetMessagesQuerySchema>;
