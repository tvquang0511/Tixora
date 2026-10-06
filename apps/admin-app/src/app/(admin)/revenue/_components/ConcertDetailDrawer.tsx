"use client";

import { useState } from "react";
import { X, Calendar, MapPin, TrendingUp, Clock } from "lucide-react";
import { getConcertPosterUrl } from "@/services/concert.service";
import { motion, AnimatePresence } from "framer-motion";
import { type ConcertRevenueDetailResponse } from "@/services/revenue.service";
import { StatusBadge } from "../../_components/StatusBadge";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatConciseVND = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}k`;
  }
  return `${value}đ`;
};

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

const formatDateOnly = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatShortDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

interface ConcertDetailDrawerProps {
  selectedConcertId: string | null;
  detailData: ConcertRevenueDetailResponse | null;
  isDetailLoading: boolean;
  fromDate: string;
  toDate: string;
  tierTotals?: {
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
  const [chartMode, setChartMode] = useState<"cumulative" | "daily">(
    "cumulative",
  );
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );

  const computedTierTotals =
    tierTotals ||
    (detailData?.ticket_tiers || []).reduce(
      (acc, t) => ({
        total_quantity: acc.total_quantity + t.total_quantity,
        tickets_sold: acc.tickets_sold + t.tickets_sold,
        remaining_quantity: acc.remaining_quantity + t.remaining_quantity,
        revenue: acc.revenue + t.revenue,
      }),
      {
        total_quantity: 0,
        tickets_sold: 0,
        remaining_quantity: 0,
        revenue: 0,
      },
    );

  // Timeline data & calculation
  const timeline = detailData?.sales_timeline || [];

  const svgWidth = 650;
  const svgHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const currentValues = timeline.map((p) =>
    chartMode === "cumulative" ? p.cumulative_revenue : p.revenue,
  );
  const maxValue = Math.max(...currentValues, 100_000);

  const yTicks = [maxValue, maxValue * 0.66, maxValue * 0.33, 0];

  const getX = (idx: number) => {
    if (timeline.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (idx / (timeline.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxValue) * chartHeight;
  };

  const linePath =
    timeline.length > 0
      ? timeline
          .map(
            (p, idx) =>
              `${idx === 0 ? "M" : "L"} ${getX(idx).toFixed(1)} ${getY(currentValues[idx]).toFixed(1)}`,
          )
          .join(" ")
      : "";

  const areaPath =
    timeline.length > 0
      ? `${linePath} L ${getX(timeline.length - 1).toFixed(1)} ${paddingTop + chartHeight} L ${getX(0).toFixed(1)} ${paddingTop + chartHeight} Z`
      : "";

  const activePoint =
    hoveredPointIndex !== null && timeline[hoveredPointIndex]
      ? timeline[hoveredPointIndex]
      : timeline.length > 0
        ? timeline[timeline.length - 1]
        : null;

  const peakDay =
    timeline.length > 0
      ? [...timeline].sort((a, b) => b.revenue - a.revenue)[0]
      : null;

  const salesStartLabel = detailData?.sales_start_at
    ? formatDateOnly(detailData.sales_start_at)
    : timeline.length > 0
      ? formatDateOnly(timeline[0].date)
      : "Chưa mở";

  const salesEndLabel = detailData?.sales_end_at
    ? formatDateOnly(detailData.sales_end_at)
    : detailData?.concert?.start_time
      ? formatDateOnly(detailData.concert.start_time)
      : "Đóng bán";

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
                <span className="over block text-[#0052ff]">
                  Chi tiết tài chính
                </span>
                <h3 className="font-bold text-sm text-slate-900">
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
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
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
                    <Calendar className="w-3.5 h-3.5 text-[#0052ff]" />
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
                    <div className="card p-3.5 flex flex-col gap-1">
                      <span className="over">Tổng doanh thu</span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 truncate tabular-nums font-mono">
                        {formatVND(detailData.total_revenue)}
                      </span>
                    </div>
                    <div className="card p-3.5 flex flex-col gap-1">
                      <span className="over">Đơn hoàn tất</span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums font-mono">
                        {detailData.paid_orders.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="card p-3.5 flex flex-col gap-1">
                      <span className="over">Vé đã bán</span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums font-mono">
                        {detailData.tickets_sold.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* ── BIỂU ĐỒ DOANH THU SỰ KIỆN: TỪ MỞ BÁN → ĐÓNG BÁN VÉ ── */}
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#0052ff]" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            Tiến trình doanh thu sự kiện
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[#0052ff] font-semibold">
                              <Clock className="w-3 h-3" /> Mở bán:{" "}
                              {salesStartLabel}
                            </span>
                            <span>→</span>
                            <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                              Đóng bán: {salesEndLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mode switch: Tích lũy vs Từng ngày */}
                      <div className="htcaa-segmented">
                        <button
                          type="button"
                          onClick={() => setChartMode("cumulative")}
                          className={`htcaa-segmented-item text-xs py-1 px-2.5 ${chartMode === "cumulative" ? "active" : ""}`}
                        >
                          Tích lũy
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMode("daily")}
                          className={`htcaa-segmented-item text-xs py-1 px-2.5 ${chartMode === "daily" ? "active" : ""}`}
                        >
                          Theo ngày
                        </button>
                      </div>
                    </div>

                    {/* Chart Container */}
                    {timeline.length === 0 ? (
                      <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                        <p className="font-semibold text-xs text-slate-700">
                          Chưa có dữ liệu bán vé
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Sự kiện chưa phát sinh đơn thanh toán thành công trong
                          giai đoạn này.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Active hover info banner */}
                        {activePoint && (
                          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-[#0052ff]">
                                {formatDateOnly(activePoint.date)}:
                              </span>
                              <span className="font-mono font-bold text-slate-900 tabular-nums">
                                {formatVND(
                                  chartMode === "cumulative"
                                    ? activePoint.cumulative_revenue
                                    : activePoint.revenue,
                                )}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                (
                                {chartMode === "cumulative"
                                  ? "tích lũy"
                                  : "trong ngày"}
                                )
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-[11.5px] text-slate-600 font-medium">
                              <span>
                                {activePoint.tickets_sold} vé (tổng{" "}
                                {activePoint.cumulative_tickets})
                              </span>
                              <span>·</span>
                              <span>{activePoint.paid_orders} đơn</span>
                            </div>
                          </div>
                        )}

                        {/* Interactive SVG Chart */}
                        <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto select-none overflow-visible"
                          >
                            <defs>
                              <linearGradient
                                id="concertRevenueGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#0052ff"
                                  stopOpacity="0.25"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#0052ff"
                                  stopOpacity="0.01"
                                />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Grid lines & Y Ticks */}
                            {yTicks.map((val, idx) => {
                              const y = getY(val);
                              return (
                                <g key={idx}>
                                  <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={paddingLeft + chartWidth}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={paddingLeft - 8}
                                    y={y + 3.5}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#64748b"
                                    fontFamily="monospace"
                                  >
                                    {formatConciseVND(val)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area Gradient Fill */}
                            {areaPath && (
                              <path
                                d={areaPath}
                                fill="url(#concertRevenueGrad)"
                              />
                            )}

                            {/* Line Stroke */}
                            {linePath && (
                              <path
                                d={linePath}
                                fill="none"
                                stroke="#0052ff"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Hover Guide Line */}
                            {hoveredPointIndex !== null && (
                              <line
                                x1={getX(hoveredPointIndex)}
                                y1={paddingTop}
                                x2={getX(hoveredPointIndex)}
                                y2={paddingTop + chartHeight}
                                stroke="#0052ff"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                            )}

                            {/* Data points & Interactive Hover targets */}
                            {timeline.map((point, idx) => {
                              const x = getX(idx);
                              const y = getY(currentValues[idx]);
                              const isHovered = hoveredPointIndex === idx;

                              return (
                                <g
                                  key={point.date}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredPointIndex(idx)}
                                  onMouseLeave={() =>
                                    setHoveredPointIndex(null)
                                  }
                                >
                                  {/* Invisible wide hover target */}
                                  <rect
                                    x={x - 12}
                                    y={paddingTop}
                                    width={24}
                                    height={chartHeight}
                                    fill="transparent"
                                  />
                                  {/* Dot */}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={
                                      isHovered
                                        ? 5.5
                                        : timeline.length < 15
                                          ? 3.5
                                          : 2
                                    }
                                    fill={isHovered ? "#0052ff" : "#0e54a3"}
                                    stroke="#ffffff"
                                    strokeWidth={isHovered ? "2.5" : "1.5"}
                                  />
                                </g>
                              );
                            })}

                            {/* X-axis date labels */}
                            {timeline.map((point, idx) => {
                              // Only show some date labels if many points
                              const showLabel =
                                timeline.length <= 8 ||
                                idx === 0 ||
                                idx === timeline.length - 1 ||
                                idx % Math.ceil(timeline.length / 5) === 0;

                              if (!showLabel) return null;

                              return (
                                <text
                                  key={`x-${point.date}`}
                                  x={getX(idx)}
                                  y={paddingTop + chartHeight + 18}
                                  textAnchor="middle"
                                  fontSize="9.5"
                                  fill="#64748b"
                                  fontFamily="sans-serif"
                                >
                                  {formatShortDate(point.date)}
                                </text>
                              );
                            })}
                          </svg>
                        </div>

                        {/* Summary Badges below chart */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {peakDay && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-500 text-[11px]">
                                Ngày cao điểm nhất:
                              </span>
                              <span className="font-bold text-slate-800">
                                {formatShortDate(peakDay.date)} (
                                {formatConciseVND(peakDay.revenue)})
                              </span>
                            </div>
                          )}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">
                              Số ngày phát sinh vé:
                            </span>
                            <span className="font-bold text-slate-800">
                              {timeline.length} ngày
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tier Breakdown */}
                  <div className="space-y-2">
                    <span className="sub">Phân tích theo từng hạng vé</span>
                    <div className="htcaa-table-wrap">
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
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/80 font-bold border-t border-slate-200 font-mono">
                            <td className="p-2.5 text-slate-900 font-sans">
                              Tổng cộng
                            </td>
                            <td className="p-2.5 text-right text-slate-400">
                              -
                            </td>
                            <td className="p-2.5 text-center text-slate-900">
                              {computedTierTotals.total_quantity.toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="p-2.5 text-center text-emerald-700">
                              {computedTierTotals.tickets_sold.toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="p-2.5 text-center text-slate-900">
                              {computedTierTotals.remaining_quantity.toLocaleString(
                                "vi-VN",
                              )}
                            </td>
                            <td className="p-2.5 text-right text-slate-900">
                              {formatVND(computedTierTotals.revenue)}
                            </td>
                            <td className="p-2.5 text-center text-slate-400">
                              -
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
