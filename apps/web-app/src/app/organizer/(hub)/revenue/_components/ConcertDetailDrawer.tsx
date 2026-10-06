"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ExternalLink, Ticket, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  organizerRevenueService,
  ConcertRevenueDetailResponse,
} from "@/services/organizer-revenue.service";
import {
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
} from "../../events/_components/EventDetailDrawer";

interface ConcertDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concertId: string | null;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function ConcertDetailDrawer({
  isOpen,
  onClose,
  concertId,
}: ConcertDetailDrawerProps) {
  const [data, setData] = useState<ConcertRevenueDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !concertId) return;

    let active = true;
    const timer = setTimeout(() => {
      setIsLoading(true);
      organizerRevenueService
        .getConcertDetail(concertId)
        .then((res) => {
          if (active) setData(res);
        })
        .catch((err) => {
          console.error("Failed to load concert revenue detail", err);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, concertId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body text-xs text-slate-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full pl-6 flex">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-screen max-w-2xl sm:max-w-3xl bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {data?.concert.name || "Báo Cáo Doanh Thu Sự Kiện"}
                  </h2>
                  {data && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        STATUS_BADGE_STYLES[data.concert.status] ||
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[data.concert.status] ||
                        data.concert.status}
                    </span>
                  )}
                </div>
                {concertId && (
                  <p className="text-[11px] font-mono text-teal-400">
                    Mã: TIX-{concertId.slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {data?.concert.status === "PUBLISHED" && (
                  <a
                    href={`/concerts/${concertId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Trang bán vé</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick stats strip */}
            {data && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-400 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-500">
                    Doanh thu gộp (GMV)
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {formatVND(data.total_revenue)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-500">
                    Thực nhận (Net Payout)
                  </span>
                  <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                    {formatVND(data.net_revenue)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-500">
                    Vé đã bán
                  </span>
                  <span className="font-bold text-sky-400 text-xs sm:text-sm">
                    {data.tickets_sold} vé
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <span className="block text-[10px] text-slate-500">
                    Đơn hàng
                  </span>
                  <span className="font-bold text-amber-400 text-xs sm:text-sm">
                    {data.paid_orders} đơn
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {isLoading ? (
              <div className="py-24 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
                Đang tải chi tiết doanh thu sự kiện...
              </div>
            ) : !data ? (
              <div className="py-24 text-center text-slate-500">
                Không tìm thấy dữ liệu doanh thu cho sự kiện này.
              </div>
            ) : (
              <>
                {/* 1. Bảng phân tích chi tiết theo từng Hạng Vé */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-teal-400" />
                    Hiệu Quả Doanh Thu Theo Hạng Vé
                  </h4>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                          <th className="py-3 px-4">HẠNG VÉ</th>
                          <th className="py-3 px-3">GIÁ NIÊM YẾT</th>
                          <th className="py-3 px-3">PHÁT HÀNH</th>
                          <th className="py-3 px-3">ĐÃ BÁN</th>
                          <th className="py-3 px-3">TỶ LỆ</th>
                          <th className="py-3 px-4 text-right">DOANH THU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.ticket_tiers.map((tier) => {
                          const rate =
                            tier.total_quantity > 0
                              ? Math.round(
                                  (tier.tickets_sold / tier.total_quantity) *
                                    100,
                                )
                              : 0;

                          return (
                            <tr
                              key={tier.category_id}
                              className="hover:bg-slate-900/50"
                            >
                              <td className="py-3 px-4 font-semibold text-white">
                                {tier.name}
                                {tier.gate_number && (
                                  <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                                    (Cổng {tier.gate_number})
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-300">
                                {formatVND(tier.price)}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-400">
                                {tier.total_quantity}
                              </td>
                              <td className="py-3 px-3 font-mono text-sky-400 font-bold">
                                {tier.tickets_sold}
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                  {rate}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-white font-mono">
                                {formatVND(tier.revenue)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Timeline Doanh thu tích lũy */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    Tiến Độ Bán Vé Theo Thời Gian
                  </h4>

                  {data.sales_timeline.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-slate-500">
                      Chưa có đơn hàng nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 max-h-60 overflow-y-auto space-y-2">
                        {data.sales_timeline.map((point) => (
                          <div
                            key={point.date}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
                          >
                            <span className="font-mono text-slate-300">
                              {point.date}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-sky-400">
                                +{point.tickets_sold} vé
                              </span>
                              <span className="font-bold text-white">
                                {formatVND(point.revenue)}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                (Lũy kế: {formatVND(point.cumulative_revenue)})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 shrink-0 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
