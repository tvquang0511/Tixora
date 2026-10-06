"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { type RevenueSummaryResponse } from "@/services/revenue.service";

interface RevenueSummaryCardsProps {
  summary: RevenueSummaryResponse | null;
  isLoading: boolean;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export function RevenueSummaryCards({
  summary,
  isLoading,
}: RevenueSummaryCardsProps) {
  const renderGrowthBadge = (growthPercent: number) => {
    const isPositive = growthPercent >= 0;
    const isZero = growthPercent === 0;

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
          isZero
            ? "bg-slate-100 text-slate-600"
            : isPositive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}
      >
        {isPositive && !isZero ? (
          <TrendingUp className="w-3 h-3" />
        ) : !isZero ? (
          <TrendingDown className="w-3 h-3" />
        ) : null}
        <span>
          {isPositive && !isZero ? "+" : ""}
          {growthPercent}%
        </span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Total GMV */}
      <div className="card p-4 transition-all hover:border-[#0e54a3]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="over">Tổng GMV toàn hệ thống</span>
          <div className="p-1.5 bg-blue-50 text-[#0e54a3] border border-blue-200 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {isLoading ? (
            <div className="h-7 w-32 bg-slate-200 animate-pulse rounded-md" />
          ) : (
            formatVND(summary?.total_gmv ?? 0)
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">So với kỳ trước</span>
          {summary ? (
            renderGrowthBadge(summary.growth.gmv)
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* Card 2: Platform Fee Net Revenue */}
      <div className="card p-4 transition-all hover:border-[#0e54a3]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="over">Doanh thu thuần sàn (5%)</span>
          <div className="p-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[#0e54a3] tabular-nums">
          {isLoading ? (
            <div className="h-7 w-28 bg-slate-200 animate-pulse rounded-md" />
          ) : (
            formatVND(summary?.total_platform_fee ?? 0)
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">Thu nhập từ phí nền tảng</span>
          {summary ? (
            renderGrowthBadge(summary.growth.platform_fee)
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* Card 3: Total Tickets Sold */}
      <div className="card p-4 transition-all hover:border-[#0e54a3]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="over">Khối lượng vé đã bán</span>
          <div className="p-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {isLoading ? (
            <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md" />
          ) : (
            `${formatNumber(summary?.total_tickets_sold ?? 0)} vé`
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">
            {formatNumber(summary?.paid_orders ?? 0)} đơn thành công
          </span>
          {summary ? (
            renderGrowthBadge(summary.growth.tickets_sold)
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* Card 4: AOV (Average Order Value) */}
      <div className="card p-4 transition-all hover:border-[#0e54a3]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="over">Giá trị đơn trung bình (AOV)</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {isLoading ? (
            <div className="h-7 w-24 bg-slate-200 animate-pulse rounded-md" />
          ) : (
            formatVND(summary?.aov ?? 0)
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">Sức chi tiêu / đơn hàng</span>
          {summary ? (
            renderGrowthBadge(summary.growth.aov)
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </div>
      </div>
    </div>
  );
}
