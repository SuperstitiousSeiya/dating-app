import { z } from "zod";
import { ObjectIdSchema } from "./common";

export const SwipeActionSchema = z.enum(["like", "pass", "superlike"]);

export const CreateSwipeSchema = z.object({
  targetId: ObjectIdSchema,
  action: SwipeActionSchema,
});

export type SwipeAction = z.infer<typeof SwipeActionSchema>;
export type CreateSwipeDto = z.infer<typeof CreateSwipeSchema>;
