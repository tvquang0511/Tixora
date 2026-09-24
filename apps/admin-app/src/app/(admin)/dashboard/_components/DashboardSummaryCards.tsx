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
      <div className="bg-white p-5 border border-slate-200 rounded-none shadow-none flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            SỰ KIỆN MỞ BÁN
          </span>
          <div className="p-2 bg-slate-100 border border-slate-200 rounded-none text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-none" />
            ) : (
              formatSummaryNumber(summary?.published_events ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Sự kiện đang hoạt động trên hệ thống
          </p>
        </div>
      </div>

      {/* Tickets Sold */}
      <div className="bg-white p-5 border border-slate-200 rounded-none shadow-none flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            VÉ ĐÃ BÁN
          </span>
          <div className="p-2 bg-slate-100 border border-slate-200 rounded-none text-slate-700">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-none" />
            ) : (
              formatSummaryNumber(summary?.tickets_sold ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Tổng vé thanh toán thành công
          </p>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white p-5 border border-slate-200 rounded-none shadow-none flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            TỔNG DOANH THU
          </span>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-none text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3
            className="font-mono text-3xl font-extrabold text-emerald-700 truncate cursor-help tracking-tight"
            title={summary ? formatConcertCurrency(summary.total_revenue) : ""}
          >
            {isLoadingSummary ? (
              <div className="h-8 w-28 bg-slate-200 animate-pulse rounded-none" />
            ) : (
              formatSummaryNumber(summary?.total_revenue ?? 0, "currency")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Tích lũy toàn thời gian hệ thống
          </p>
        </div>
      </div>

      {/* Registered Users */}
      <div className="bg-white p-5 border border-slate-200 rounded-none shadow-none flex flex-col justify-between">
        <div className="flex justify-between items-start mb-3">
          <span className="text-slate-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            NGƯỜI DÙNG ĐĂNG KÝ
          </span>
          <div className="p-2 bg-slate-100 border border-slate-200 rounded-none text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLoadingSummary ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-none" />
            ) : (
              formatSummaryNumber(summary?.total_users ?? 0, "number")
            )}
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Tài khoản người dùng toàn hệ thống
          </p>
        </div>
      </div>
    </section>
  );
}
