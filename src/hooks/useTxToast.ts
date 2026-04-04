import { useState, useCallback } from "react";

export interface TxToast {
  id: number;
  hash: string;
  status: "pending" | "ok" | "error";
  label: string;
}

let nextId = 0;

export function useTxToast() {
  const [toasts, setToasts] = useState<TxToast[]>([]);

  const addToast = useCallback((hash: string, label: string): number => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, hash, status: "pending", label }]);
    return id;
  }, []);

  const updateToast = useCallback((id: number, status: "ok" | "error") => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    // Auto-remove after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, updateToast, removeToast };
}
