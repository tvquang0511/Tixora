"use client";

import { X, Calendar, MapPin } from "lucide-react";
import { getConcertPosterUrl } from "@/services/concert.service";
import { motion, AnimatePresence } from "framer-motion";
import { type ConcertRevenueDetailResponse } from "@/services/revenue.service";
import { StatusBadge } from "../../_components/StatusBadge";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatConcertDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBA";
  return (
    d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
};

interface ConcertDetailDrawerProps {
  selectedConcertId: string | null;
  detailData: ConcertRevenueDetailResponse | null;
  isDetailLoading: boolean;
  fromDate: string;
  toDate: string;
  tierTotals: {
    total_quantity: number;
    tickets_sold: number;
    remaining_quantity: number;
    revenue: number;
  };
  onClose: () => void;
}

export function ConcertDetailDrawer({
  selectedConcertId,
  detailData,
  isDetailLoading,
  fromDate,
  toDate,
  tierTotals,
  onClose,
}: ConcertDetailDrawerProps) {
  return (
    <AnimatePresence>
      {selectedConcertId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-2xl bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block font-sans">
                  Chi tiết tài chính
                </span>
                <h3 className="font-sans text-sm font-semibold text-slate-900">
                  Báo cáo doanh thu sự kiện
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Đóng ngăn chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isDetailLoading ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                  <span>Đang tải thông tin chi tiết sự kiện...</span>
                </div>
              ) : !detailData ? (
                <div className="py-20 text-center text-slate-500 font-sans text-xs">
                  Không tìm thấy dữ liệu sự kiện.
                </div>
              ) : (
                <>
                  {/* Concert Header Card */}
                  <div className="flex items-center gap-3 p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getConcertPosterUrl(detailData.concert.poster_url)}
                        alt={detailData.concert.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                          {detailData.concert.name}
                        </h4>
                        <StatusBadge
                          status={detailData.concert.status}
                          variant="concert"
                        />
                      </div>
                      <p className="text-slate-600 font-sans text-[11px]">
                        {formatConcertDate(detailData.concert.start_time)}
                      </p>
                      {detailData.concert.location && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 font-sans">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[320px]">
                            {detailData.concert.location}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date Range Indicator */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Khoảng thời gian:</span>
                    <span className="text-slate-900 font-semibold">
                      {fromDate
                        ? new Date(fromDate).toLocaleDateString("vi-VN")
                        : "Từ đầu"}
                    </span>
                    <span>→</span>
                    <span className="text-slate-900 font-semibold">
                      {toDate
                        ? new Date(toDate).toLocaleDateString("vi-VN")
                        : "Hiện tại"}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                        Tổng doanh thu
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 truncate font-sans">
                        {formatVND(detailData.total_revenue)}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                        Đơn hoàn tất
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 font-sans">
                        {detailData.paid_orders.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
                        Vé đã bán
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 font-sans">
                        {detailData.tickets_sold.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* Tier Breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
                      Phân tích theo từng hạng vé
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 font-sans text-[11px] font-semibold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
                            <th className="p-2.5">Hạng vé</th>
                            <th className="p-2.5 text-right">Giá</th>
                            <th className="p-2.5 text-center">Tổng</th>
                            <th className="p-2.5 text-center">Đã bán</th>
                            <th className="p-2.5 text-center">Còn lại</th>
                            <th className="p-2.5 text-right">Doanh thu</th>
                            <th className="p-2.5 text-center">Cổng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {detailData.ticket_tiers?.map((tier) => (
                            <tr
                              key={tier.category_id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="p-2.5 font-medium text-slate-900">
                                {tier.name}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-900">
                                {formatVND(tier.price)}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-900">
                                {tier.total_quantity.toLocaleString("vi-VN")}
                              </td>
                              <td className="p-2.5 text-center font-mono font-medium text-emerald-700">
                                {tier.tickets_sold.toLocaleString("vi-VN")}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-700">
                                {tier.remaining_quantity.toLocaleString(
                                  "vi-VN",
                                )}
                              </td>
                              <td className="p-2.5 text-right font-mono font-medium text-slate-900">
                                {formatVND(tier.revenue)}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-500">
                                {tier.gate_number !== null
                                  ? `Cổng ${tier.gate_number}`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/80 font-bold border-t border-slate-200 font-mono">
                            <td className="p-2.5 text-slate-900 font-sans">Tổng cộng</td>
                            <td className="p-2.5 text-right text-slate-400">
                              —
                            </td>
                            <td className="p-2.5 text-center text-slate-900">
                              {tierTotals.total_quantity.toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="p-2.5 text-center text-emerald-700">
                              {tierTotals.tickets_sold.toLocaleString("vi-VN")}
                            </td>
                            <td className="p-2.5 text-center text-slate-900">
                              {tierTotals.remaining_quantity.toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="p-2.5 text-right text-slate-900">
                              {formatVND(tierTotals.revenue)}
                            </td>
                            <td className="p-2.5 text-center text-slate-400">
                              —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
