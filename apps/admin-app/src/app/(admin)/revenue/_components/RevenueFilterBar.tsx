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
    <section className="bg-white rounded-none border border-slate-200 p-5 shadow-none">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Date Range */}
        <div className="flex flex-col gap-1.5 md:col-span-5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Khoảng thời gian
          </span>
          <div
            onClick={() => fromDateRef.current?.showPicker()}
            className="flex items-center justify-start gap-1 bg-white border border-slate-300 rounded-none px-3 py-2 text-xs text-slate-900 transition-colors h-10 w-full cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              ref={fromDateRef}
              type="date"
              value={tempFromDate}
              onClick={(e) => {
                e.stopPropagation();
                fromDateRef.current?.showPicker();
              }}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="bg-transparent text-slate-900 focus:outline-none w-[105px] min-w-0 font-mono text-xs cursor-pointer text-center px-1 font-semibold"
            />
            <span className="text-slate-400 font-mono font-bold shrink-0 select-none">
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
              className="bg-transparent text-slate-900 focus:outline-none w-[105px] min-w-0 font-mono text-xs cursor-pointer text-center px-1 font-semibold"
            />
          </div>
        </div>

        {/* Group By */}
        <div className="flex flex-col gap-1.5 md:col-span-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Nhóm theo
          </span>
          <div className="relative">
            <select
              value={tempGroupBy}
              onChange={(e) =>
                onGroupByChange(e.target.value as "day" | "week" | "month")
              }
              className="appearance-none bg-white border border-slate-300 rounded-none pl-3 pr-8 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-800 w-full h-10 transition-colors cursor-pointer"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end h-10 md:col-span-4">
          <button
            onClick={onReset}
            className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono text-xs font-semibold py-2 px-3 rounded-none transition-colors cursor-pointer"
          >
            Mặc định
          </button>
          <button
            onClick={onApply}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2 px-3 rounded-none transition-colors cursor-pointer"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </section>
  );
}
