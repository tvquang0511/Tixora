"use client";

import { Calendar, RotateCw } from "lucide-react";

interface RevenueFilterBarProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  preset: "7d" | "30d" | "90d" | "all";
  onPresetChange: (p: "7d" | "30d" | "90d" | "all") => void;
  groupBy: "day" | "week" | "month";
  onGroupByChange: (g: "day" | "week" | "month") => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function RevenueFilterBar({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  preset,
  onPresetChange,
  groupBy,
  onGroupByChange,
  onRefresh,
  isLoading,
}: RevenueFilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-slate-950/85 border border-slate-800/80 shadow-md">
      {/* Preset tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto shrink-0">
        {(
          [
            { key: "7d", label: "7 ngày qua" },
            { key: "30d", label: "30 ngày qua" },
            { key: "90d", label: "90 ngày qua" },
            { key: "all", label: "Tất cả" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onPresetChange(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              preset === tab.key
                ? "bg-slate-800 text-teal-400 border border-slate-700/80 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Pickers & GroupBy Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Custom date range */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="date"
            value={fromDate ? fromDate.slice(0, 10) : ""}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-[11px]"
          />
          <span className="text-slate-500">-</span>
          <input
            type="date"
            value={toDate ? toDate.slice(0, 10) : ""}
            onChange={(e) => onToDateChange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-[11px]"
          />
        </div>

        {/* Group By selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onGroupByChange("day")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              groupBy === "day"
                ? "bg-slate-800 text-teal-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ngày
          </button>
          <button
            type="button"
            onClick={() => onGroupByChange("week")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              groupBy === "week"
                ? "bg-slate-800 text-teal-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => onGroupByChange("month")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              groupBy === "month"
                ? "bg-slate-800 text-teal-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tháng
          </button>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          title="Làm mới dữ liệu"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-400" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
