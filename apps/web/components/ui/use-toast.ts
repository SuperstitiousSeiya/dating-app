"use client";

import { useState, useCallback } from "react";

type ToastVariant = "default" | "destructive";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

let externalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function toast(options: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  externalSetToasts?.((prev) => [...prev, { ...options, id }]);
  setTimeout(() => {
    externalSetToasts?.((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  externalSetToasts = setToasts;

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
