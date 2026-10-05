import React from "react";
import { Ticket } from "lucide-react";

export function BrandMark({
  compact = false,
  showIcon = true,
  size = "normal",
  theme = "light",
}: {
  compact?: boolean;
  showIcon?: boolean;
  size?: "normal" | "large";
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  if (!showIcon && size === "large") {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`text-3xl font-extrabold tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Tixora
        </div>
        {!compact ? (
          <div
            className={`text-xs font-medium mt-1 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Hệ thống Quản trị Nội bộ
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {showIcon && (
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-xs shrink-0 ${
            isDark ? "bg-white text-[#0e54a3]" : "bg-[#0e54a3] text-white"
          }`}
        >
          <Ticket className="w-4.5 h-4.5" />
        </div>
      )}
      <div>
        <div
          className={`text-[24px] font-black tracking-tight leading-none ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          TIXORA
        </div>
        {!compact ? (
          <div
            className={`text-[10px] font-bold uppercase tracking-wider mt-1 leading-none ${
              isDark ? "text-white/75" : "text-slate-500"
            }`}
          >
            Quản trị nền tảng
          </div>
        ) : null}
      </div>
    </div>
  );
}
