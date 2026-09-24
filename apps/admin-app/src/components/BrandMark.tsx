import React from "react";
import { Ticket } from "lucide-react";

export function BrandMark({
  compact = false,
  showIcon = true,
  size = "normal",
}: {
  compact?: boolean;
  showIcon?: boolean;
  size?: "normal" | "large";
}) {
  if (!showIcon && size === "large") {
    return (
      <div className="flex flex-col items-center">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
          Tixora
        </div>
        {!compact ? (
          <div className="text-xs font-medium text-slate-500 mt-1">
            Hệ thống Quản trị Nội bộ
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {showIcon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm shrink-0">
          <Ticket className="w-5 h-5 text-white" />
        </div>
      )}
      <div>
        <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
          Tixora
        </div>
        {!compact ? (
          <div className="text-[11px] font-medium text-slate-500 leading-tight">
            Quản trị hệ thống
          </div>
        ) : null}
      </div>
    </div>
  );
}
