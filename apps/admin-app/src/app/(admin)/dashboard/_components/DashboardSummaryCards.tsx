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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Published Events */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-wider">
            Sự kiện mở bán
          </span>
          <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              formatSummaryNumber(summary?.published_events ?? 0, "number")
            )}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Sự kiện đang hoạt động trên hệ thống
          </p>
        </div>
      </div>

      {/* Tickets Sold */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-wider">
            Vé đã bán
          </span>
          <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              formatSummaryNumber(summary?.tickets_sold ?? 0, "number")
            )}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Tổng vé thanh toán thành công
          </p>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-wider">
            Tổng doanh thu
          </span>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3
            className="font-sans text-2xl sm:text-3xl font-bold text-emerald-700 truncate cursor-help tracking-tight"
            title={summary ? formatConcertCurrency(summary.total_revenue) : ""}
          >
            {isLoadingSummary ? (
              <div className="h-8 w-28 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              formatSummaryNumber(summary?.total_revenue ?? 0, "currency")
            )}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Tích lũy toàn thời gian hệ thống
          </p>
        </div>
      </div>

      {/* Registered Users */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-sans text-xs font-semibold uppercase tracking-wider">
            Người dùng đăng ký
          </span>
          <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg" />
            ) : (
              formatSummaryNumber(summary?.total_users ?? 0, "number")
            )}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Tài khoản người dùng toàn hệ thống
          </p>
        </div>
      </div>
    </section>
  );
}
