import type { MessageType } from "@dating-app/validators";

export type Message = {
  _id: string;
  matchId: string;
  senderId: string;
  type: MessageType;
  content: string;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type TypingIndicatorPayload = {
  matchId: string;
  userId: string;
  isTyping: boolean;
};

export type ReadReceiptPayload = {
  matchId: string;
  messageId: string;
  readAt: string;
};
