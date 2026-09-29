"use client";

import { Building2, Ticket, DollarSign, Users } from "lucide-react";
import { formatConcertCurrency } from "@/services/concert.service";
import { type DashboardSummary } from "@/services/dashboard.service";

interface DashboardSummaryCardsProps {
  summary: DashboardSummary | null;
  isLoadingSummary: boolean;
  formatSummaryNumber: (value: number, type: "number" | "currency") => string;
}

export function DashboardSummaryCards({
  summary,
  isLoadingSummary,
  formatSummaryNumber,
}: DashboardSummaryCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Published Events */}
      <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-lg shadow-2xs flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-600 font-sans text-[11px] font-semibold uppercase tracking-wider">
            Sự kiện mở bán
          </span>
          <div className="p-1.5 bg-teal-50 border border-teal-200 rounded text-teal-700">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-16 bg-slate-200 rounded" />
            ) : (
              formatSummaryNumber(summary?.published_events ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Sự kiện đang hoạt động trên hệ thống
          </p>
        </div>
      </div>

      {/* Tickets Sold */}
      <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-lg shadow-2xs flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-600 font-sans text-[11px] font-semibold uppercase tracking-wider">
            Vé đã bán
          </span>
          <div className="p-1.5 bg-teal-50 border border-teal-200 rounded text-teal-700">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-20 bg-slate-200 rounded" />
            ) : (
              formatSummaryNumber(summary?.tickets_sold ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Tổng vé thanh toán thành công
          </p>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-lg shadow-2xs flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-600 font-sans text-[11px] font-semibold uppercase tracking-wider">
            Tổng doanh thu
          </span>
          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3
            className="text-xl sm:text-2xl font-bold text-emerald-800 truncate cursor-help tracking-tight tabular-nums"
            title={summary ? formatConcertCurrency(summary.total_revenue) : ""}
          >
            {isLoadingSummary ? (
              <div className="h-7 w-28 bg-slate-200 rounded" />
            ) : (
              formatSummaryNumber(summary?.total_revenue ?? 0, "currency")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Tích lũy toàn thời gian hệ thống
          </p>
        </div>
      </div>

      {/* Registered Users */}
      <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-lg shadow-2xs flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="text-slate-600 font-sans text-[11px] font-semibold uppercase tracking-wider">
            Người dùng đăng ký
          </span>
          <div className="p-1.5 bg-teal-50 border border-teal-200 rounded text-teal-700">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-16 bg-slate-200 rounded" />
            ) : (
              formatSummaryNumber(summary?.total_users ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Tài khoản người dùng toàn hệ thống
          </p>
        </div>
      </div>
    </section>
  );
}
