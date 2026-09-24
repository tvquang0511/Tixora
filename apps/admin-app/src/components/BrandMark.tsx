import React from "react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-bold text-sm rounded-none border border-slate-900 select-none">
        T
      </div>
      <div>
        <div className="font-display text-base font-bold tracking-tight text-slate-900">
          Tixora Admin
        </div>
        {!compact ? (
          <div className="text-[10px] font-medium tracking-wider uppercase text-slate-500">
            Hệ thống nội bộ
          </div>
        ) : null}
      </div>
    </div>
  );
}
