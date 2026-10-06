"use client";

import { CalendarOff, ChevronRight, RotateCw } from "lucide-react";
import { ConcertRevenueItem } from "@/services/organizer-revenue.service";
import { getConcertPosterUrl } from "@/services/concert.service";
import {
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
} from "../../events/_components/EventDetailDrawer";

interface ConcertRevenueTableProps {
  concerts: ConcertRevenueItem[];
  isLoading: boolean;
  onSelectConcert: (concertId: string) => void;
}

const formatCurrency = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;

export function ConcertRevenueTable({
  concerts,
  isLoading,
  onSelectConcert,
}: ConcertRevenueTableProps) {
  return (
    <div className="rounded-3xl bg-slate-950/85 border border-slate-800/80 overflow-hidden shadow-xl shadow-black/30">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Doanh Thu Theo Từng Sự Kiện
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Chi tiết hiệu quả bán vé, doanh thu gộp và thực nhận theo từng show
            diễn
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-teal-400 border border-slate-800">
          {concerts.length} sự kiện
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40">
              <th className="py-3.5 px-5">SỰ KIỆN</th>
              <th className="py-3.5 px-4">TRẠNG THÁI</th>
              <th className="py-3.5 px-4">DOANH THU (GMV)</th>
              <th className="py-3.5 px-4">THỰC NHẬN (NET)</th>
              <th className="py-3.5 px-4">VÉ BÁN / SỨC CHỨA</th>
              <th className="py-3.5 px-4">ĐƠN HÀNG</th>
              <th className="py-3.5 px-5 text-right"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCw className="w-5 h-5 animate-spin text-teal-400" />
                    <p className="text-xs">
                      Đang tải dữ liệu doanh thu sự kiện...
                    </p>
                  </div>
                </td>
              </tr>
            ) : concerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CalendarOff className="w-8 h-8 text-slate-700" />
                    <p className="text-xs font-medium text-slate-400">
                      Chưa có dữ liệu doanh thu cho sự kiện nào trong khoảng
                      thời gian này.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              concerts.map((concert) => {
                return (
                  <tr
                    key={concert.concert_id}
                    onClick={() => onSelectConcert(concert.concert_id)}
                    className="group hover:bg-slate-900/60 transition-colors cursor-pointer"
                    title="Bấm vào để xem báo cáo chi tiết & phân tích hạng vé"
                  >
                    {/* SỰ KIỆN */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getConcertPosterUrl(concert.poster_url)}
                            alt={concert.concert_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs sm:text-sm group-hover:text-teal-400 transition-colors line-clamp-1">
                            {concert.concert_name}
                          </div>
                          <div className="font-mono text-[10px] text-teal-400/90 font-medium">
                            TIX-{concert.concert_id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          STATUS_BADGE_STYLES[concert.status] ||
                          "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            concert.status === "PUBLISHED"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        />
                        {STATUS_LABELS[concert.status] || concert.status}
                      </span>
                    </td>

                    {/* DOANH THU (GMV) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {formatCurrency(concert.revenue)}
                      </span>
                    </td>

                    {/* THỰC NHẬN (NET) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400 text-xs sm:text-sm">
                        {formatCurrency(concert.net_revenue)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Phí sàn: {formatCurrency(concert.platform_fee)}
                      </div>
                    </td>

                    {/* VÉ BÁN / SỨC CHỨA */}
                    <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-white font-mono">
                          {concert.tickets_sold}
                        </span>
                        <span className="text-slate-500 font-mono">
                          /{concert.total_capacity} chỗ
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-teal-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, concert.occupancy_rate)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Lấp đầy {concert.occupancy_rate}%
                      </span>
                    </td>

                    {/* ĐƠN HÀNG */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-300">
                      {concert.paid_orders} đơn
                    </td>

                    {/* CHI TIẾT */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="text-slate-500 group-hover:text-teal-400 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold">
                        <span>Chi tiết</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
