"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { formatTime } from "@dating-app/utils";

import { apiClient } from "../../../../lib/api-client";
import { queryKeys } from "../../../../lib/query-keys";
import { useChatStore } from "../../../../stores/chat.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { getSocket, SOCKET_EVENTS } from "../../../../lib/socket";
import { cn } from "../../../../lib/cn";

type ChatViewProps = {
  matchId: string;
};

// Receives matchId as a plain prop from the async Server Component parent.
// No useParams() needed — keeps the component decoupled from routing.
export function ChatView({ matchId }: ChatViewProps) {
  const { user } = useAuthStore();
  const { addMessage } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: queryKeys.messages.byMatch(matchId),
    queryFn: ({ pageParam }) =>
      apiClient.messages.getMessages(matchId, {
        cursor: pageParam as string | undefined,
        limit: 30,
      }),
    getNextPageParam: (last) => last.pagination.nextCursor ?? undefined,
    initialPageParam: undefined,
    select: (d) => ({
      ...d,
      pages: [...d.pages].reverse(),
    }),
  });

  const messages = data?.pages.flatMap((p) => [...p.data].reverse()) ?? [];

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiClient.messages.send(matchId, content),
  });

  useEffect(() => {
    const socket = getSocket();
    socket.emit("match:join", { matchId });
    return () => {
      socket.off("match:join");
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    sendMutation.mutate(content);
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CHAT_TYPING, { matchId, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.CHAT_TYPING, { matchId, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/matches" className="rounded-lg p-1 hover:bg-secondary">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-semibold">Chat</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {hasNextPage && (
          <button
            onClick={() => void fetchNextPage()}
            className="w-full text-center text-xs text-brand-500 py-2 hover:underline"
          >
            Load earlier messages
          </button>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id;
          return (
            <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMine
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-secondary rounded-bl-sm",
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    isMine ? "text-brand-100" : "text-muted-foreground",
                  )}
                >
                  {formatTime(msg.createdAt)}
                  {isMine && msg.readAt && " · Read"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-2xl border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="shrink-0 rounded-full bg-brand-500 p-2.5 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
