"use client";

import { Calendar, Filter, RotateCcw } from "lucide-react";
import { type PresetRange } from "../_hooks/useAdminRevenue";
import { type RevenueByOrganizerItem } from "@/services/revenue.service";

interface RevenueFilterBarProps {
  preset: PresetRange;
  tempFromDate: string;
  tempToDate: string;
  tempOrganizerId: string;
  organizers: RevenueByOrganizerItem[];
  fromDateRef: React.RefObject<HTMLInputElement | null>;
  toDateRef: React.RefObject<HTMLInputElement | null>;
  onSelectPreset: (p: PresetRange) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onOrganizerChange: (orgId: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function RevenueFilterBar({
  preset,
  tempFromDate,
  tempToDate,
  tempOrganizerId,
  organizers,
  fromDateRef,
  toDateRef,
  onSelectPreset,
  onFromDateChange,
  onToDateChange,
  onOrganizerChange,
  onApply,
  onReset,
}: RevenueFilterBarProps) {
  return (
    <div className="card p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Presets segment */}
        <div className="flex items-center gap-2.5">
          <span className="over hidden sm:inline">Kỳ báo cáo:</span>
          <div className="htcaa-segmented">
            <button
              type="button"
              onClick={() => onSelectPreset("7d")}
              className={`htcaa-segmented-btn ${preset === "7d" ? "active" : ""}`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("30d")}
              className={`htcaa-segmented-btn ${preset === "30d" ? "active" : ""}`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("90d")}
              className={`htcaa-segmented-btn ${preset === "90d" ? "active" : ""}`}
            >
              Quý (90d)
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("year")}
              className={`htcaa-segmented-btn ${preset === "year" ? "active" : ""}`}
            >
              Năm nay
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("all")}
              className={`htcaa-segmented-btn ${preset === "all" ? "active" : ""}`}
            >
              Toàn bộ
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onReset}
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            title="Khôi phục bộ lọc mặc định 30 ngày qua"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Mặc định</span>
          </button>
          <button
            type="button"
            onClick={onApply}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Áp dụng</span>
          </button>
        </div>
      </div>

      {/* Date Pickers & Organizer Dropdown */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
        {/* Custom Range */}
        <div className="flex items-center gap-2">
          <span className="over">Tùy chỉnh:</span>
          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={fromDateRef}
                type="date"
                value={tempFromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="w-[118px] font-sans text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
              />
            </div>
            <span className="text-slate-400 font-medium text-xs px-0.5 select-none">
              →
            </span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={toDateRef}
                type="date"
                value={tempToDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="w-[118px] font-sans text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Organizer Filter */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <span className="over">Ban tổ chức:</span>
          <select
            value={tempOrganizerId}
            onChange={(e) => onOrganizerChange(e.target.value)}
            className="select-trigger text-xs font-semibold min-w-[220px] max-w-[320px] truncate"
          >
            <option value="ALL">Toàn hệ thống (Tất cả BTC)</option>
            {organizers.map((org) => (
              <option key={org.organizer_id} value={org.organizer_id}>
                {org.organization_name} ({org.total_concerts} show)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
