"use client";

import { Calendar } from "lucide-react";

interface RevenueFilterBarProps {
  tempFromDate: string;
  tempToDate: string;
  tempGroupBy: "day" | "week" | "month";
  fromDateRef: React.RefObject<HTMLInputElement | null>;
  toDateRef: React.RefObject<HTMLInputElement | null>;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onGroupByChange: (v: "day" | "week" | "month") => void;
  onApply: () => void;
  onReset: () => void;
}

export function RevenueFilterBar({
  tempFromDate,
  tempToDate,
  tempGroupBy,
  fromDateRef,
  toDateRef,
  onFromDateChange,
  onToDateChange,
  onGroupByChange,
  onApply,
  onReset,
}: RevenueFilterBarProps) {
  return (
    <div className="filters">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <span className="over hidden sm:inline">Thời gian:</span>
        <div
          onClick={() => fromDateRef.current?.showPicker()}
          className="search-box flex items-center gap-1 cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={fromDateRef}
            type="date"
            value={tempFromDate}
            onClick={(e) => {
              e.stopPropagation();
              fromDateRef.current?.showPicker();
            }}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-[105px] min-w-0 font-sans text-xs cursor-pointer text-center px-1 font-medium bg-transparent"
          />
          <span className="text-slate-400 font-sans font-medium shrink-0 select-none">
            →
          </span>
          <input
            ref={toDateRef}
            type="date"
            value={tempToDate}
            onClick={(e) => {
              e.stopPropagation();
              toDateRef.current?.showPicker();
            }}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-[105px] min-w-0 font-sans text-xs cursor-pointer text-center px-1 font-medium bg-transparent"
          />
        </div>
      </div>

      {/* Group By */}
      <div className="flex items-center gap-2">
        <span className="over hidden sm:inline">Nhóm theo:</span>
        <select
          value={tempGroupBy}
          onChange={(e) =>
            onGroupByChange(e.target.value as "day" | "week" | "month")
          }
          className="select-trigger text-xs font-medium"
        >
          <option value="day">Theo ngày</option>
          <option value="week">Theo tuần</option>
          <option value="month">Theo tháng</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={onReset}
          className="btn btn-secondary btn-sm"
        >
          Mặc định
        </button>
        <button
          onClick={onApply}
          className="btn btn-primary btn-sm"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}
