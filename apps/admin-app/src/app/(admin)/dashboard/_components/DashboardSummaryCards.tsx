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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Published Events */}
      <div className="card flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="over">
            Sự kiện mở bán
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052ff]">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
            ) : (
              formatSummaryNumber(summary?.published_events ?? 0, "number")
            )}
          </h3>
          <p className="sub mt-1">
            Sự kiện đang hoạt động trên hệ thống
          </p>
        </div>
      </div>

      {/* Tickets Sold */}
      <div className="card flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="over">
            Vé đã bán
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052ff]">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-20 bg-slate-200 rounded animate-pulse" />
            ) : (
              formatSummaryNumber(summary?.tickets_sold ?? 0, "number")
            )}
          </h3>
          <p className="sub mt-1">
            Tổng vé thanh toán thành công
          </p>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="card flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="over">
            Tổng doanh thu
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052ff]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3
            className="text-2xl font-bold text-[#0052ff] truncate cursor-help tracking-tight tabular-nums"
            title={summary ? formatConcertCurrency(summary.total_revenue) : ""}
          >
            {isLoadingSummary ? (
              <div className="h-7 w-28 bg-slate-200 rounded animate-pulse" />
            ) : (
              formatSummaryNumber(summary?.total_revenue ?? 0, "currency")
            )}
          </h3>
          <p className="sub mt-1">
            Tích lũy toàn thời gian hệ thống
          </p>
        </div>
      </div>

      {/* Registered Users */}
      <div className="card flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <span className="over">
            Người dùng đăng ký
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052ff]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {isLoadingSummary ? (
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
            ) : (
              formatSummaryNumber(summary?.total_users ?? 0, "number")
            )}
          </h3>
          <p className="sub mt-1">
            Tài khoản người dùng toàn hệ thống
          </p>
        </div>
      </div>
    </section>
  );
}
