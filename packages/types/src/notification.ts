import type { NotificationType } from "@dating-app/validators";

export type Notification = {
  _id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};
