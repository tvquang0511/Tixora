"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (msg: string, dur?: number) => toast(msg, "success", dur),
    [toast],
  );
  const error = useCallback(
    (msg: string, dur?: number) => toast(msg, "error", dur),
    [toast],
  );
  const info = useCallback(
    (msg: string, dur?: number) => toast(msg, "info", dur),
    [toast],
  );
  const warning = useCallback(
    (msg: string, dur?: number) => toast(msg, "warning", dur),
    [toast],
  );

  const styles = {
    success:
      "bg-white border-slate-300 text-slate-800 shadow-lg border-l-4 border-l-emerald-600",
    error:
      "bg-white border-slate-300 text-slate-800 shadow-lg border-l-4 border-l-red-600",
    info: "bg-white border-slate-300 text-slate-800 shadow-lg border-l-4 border-l-blue-600",
    warning:
      "bg-white border-slate-300 text-slate-800 shadow-lg border-l-4 border-l-amber-600",
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />,
    info: <Info className="h-5 w-5 shrink-0 text-blue-600" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />,
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed top-16 right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-3rem)] md:w-96 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 text-xs font-medium shadow-lg transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2 ${styles[t.type]}`}
          >
            {icons[t.type]}
            <div className="flex-1 pr-4 leading-relaxed text-left">
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-md p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
