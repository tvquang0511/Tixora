"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  ShoppingBag,
  Percent,
  CreditCard,
} from "lucide-react";
import { OrganizerRevenueSummaryResponse } from "@/services/organizer-revenue.service";

interface RevenueSummaryCardsProps {
  summary: OrganizerRevenueSummaryResponse | null;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
};

export function RevenueSummaryCards({
  summary,
  isLoading,
}: RevenueSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-950/85 border border-slate-800/80 animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Tổng Doanh Thu (GMV)",
      value: formatCurrency(summary.total_gmv),
      growth: summary.growth.gmv,
      icon: DollarSign,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
    },
    {
      title: "Thực Nhận (Net Payout)",
      value: formatCurrency(summary.total_net_revenue),
      subtext: `Sau phí sàn ${(summary.platform_fee_rate * 100).toFixed(0)}%`,
      growth: summary.growth.net_revenue,
      icon: CreditCard,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Tổng Vé Đã Bán",
      value: `${summary.total_tickets_sold.toLocaleString("vi-VN")} vé`,
      growth: summary.growth.tickets_sold,
      icon: Ticket,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
    },
    {
      title: "Đơn Hàng Thành Công",
      value: `${summary.paid_orders.toLocaleString("vi-VN")} đơn`,
      growth: summary.growth.paid_orders,
      icon: ShoppingBag,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Giá Trị Đơn TB (AOV)",
      value: formatCurrency(summary.aov),
      growth: summary.growth.aov,
      icon: Percent,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isPositive = card.growth >= 0;

        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/85 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-400 line-clamp-1">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 rounded-xl ${card.bgColor} ${card.borderColor} border flex items-center justify-center shrink-0 ${card.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                {card.value}
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <div
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {card.growth}%
                  </span>
                  <span className="text-slate-500 font-normal">
                    so với kỳ trước
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
