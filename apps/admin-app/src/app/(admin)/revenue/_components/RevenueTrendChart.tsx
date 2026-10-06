"use client";

import { TrendingUp } from "lucide-react";
import { type RevenueTrendItem } from "@/services/revenue.service";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatConciseNumber = (value: number) => {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })} tỷ`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 0 })} tr`;
  if (value >= 1_000)
    return `${(value / 1_000).toLocaleString("en-US", { maximumFractionDigits: 0 })}k`;
  return value.toString();
};

interface RevenueTrendChartProps {
  trendItems: RevenueTrendItem[];
  isTrendLoading: boolean;
  groupBy: "day" | "week" | "month";
  onGroupByChange?: (g: "day" | "week" | "month") => void;
  fromDate: string;
  toDate: string;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}

export function RevenueTrendChart({
  trendItems,
  isTrendLoading,
  groupBy,
  onGroupByChange,
  fromDate,
  toDate,
  hoveredIndex,
  onHover,
}: RevenueTrendChartProps) {
  const svgWidth = 1000;
  const svgHeight = 400;
  const paddingLeft = 85;
  const paddingRight = 120;
  const paddingTop = 45;
  const paddingBottom = 55;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxRevenue =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.revenue), 1000000)
      : 1000000;
  const maxPaidOrders =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.paid_orders), 10)
      : 10;
  const maxTicketsSold =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.tickets_sold), 10)
      : 10;

  const yTicksLeft = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0,
  ];
  const yTicksRightOrders = [
    maxPaidOrders,
    maxPaidOrders * 0.75,
    maxPaidOrders * 0.5,
    maxPaidOrders * 0.25,
    0,
  ];
  const yTicksRightTickets = [
    maxTicketsSold,
    maxTicketsSold * 0.75,
    maxTicketsSold * 0.5,
    maxTicketsSold * 0.25,
    0,
  ];

  const getX = (index: number) =>
    paddingLeft +
    (trendItems.length > 1
      ? (index / (trendItems.length - 1)) * chartWidth
      : chartWidth / 2);
  const getY = (value: number, maxValue: number) =>
    paddingTop + chartHeight - (value / maxValue) * chartHeight;

  const getLinePath = (
    valueExtractor: (item: RevenueTrendItem) => number,
    maxValue: number,
  ) => {
    if (trendItems.length === 0) return "";
    return trendItems
      .map(
        (item, index) =>
          `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(valueExtractor(item), maxValue)}`,
      )
      .join(" ");
  };

  const revenuePath = getLinePath((i) => i.revenue, maxRevenue);
  const ordersPath = getLinePath((i) => i.paid_orders, maxPaidOrders);
  const ticketsPath = getLinePath((i) => i.tickets_sold, maxTicketsSold);

  const revenueAreaPath =
    trendItems.length > 0
      ? `${revenuePath} L ${getX(trendItems.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`
      : "";

  const formatPeriodLabel = (period: string) => {
    if (!period) return "";
    const parts = period.split("-");
    if (groupBy === "month" && parts.length >= 2)
      return `${parts[1]}/${parts[0].slice(2)}`;
    if (parts.length === 3) {
      const d = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      if (groupBy === "week") {
        return `T${Math.ceil(d.getDate() / 7)}/${d.getMonth() + 1}`;
      }
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }
    return period;
  };

  const formatDateRangeLabel = () => {
    const formatDate = (date: string) =>
      new Date(date).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    if (fromDate && toDate)
      return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    if (fromDate) return `Từ ${formatDate(fromDate)}`;
    if (toDate) return `Đến ${formatDate(toDate)}`;
    return "Tất cả thời gian";
  };

  return (
    <div className="card p-5 flex flex-col min-h-[480px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100 text-[#0e54a3]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
              Xu hướng Doanh thu & Tăng trưởng
            </h3>
            <span className="text-[11px] font-sans text-slate-500">
              [{formatDateRangeLabel()}]
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Granularity Switcher */}
          {onGroupByChange && (
            <div className="htcaa-segmented text-xs">
              <button
                type="button"
                onClick={() => onGroupByChange("day")}
                className={`htcaa-segmented-btn ${groupBy === "day" ? "active" : ""}`}
              >
                Ngày
              </button>
              <button
                type="button"
                onClick={() => onGroupByChange("week")}
                className={`htcaa-segmented-btn ${groupBy === "week" ? "active" : ""}`}
              >
                Tuần
              </button>
              <button
                type="button"
                onClick={() => onGroupByChange("month")}
                className={`htcaa-segmented-btn ${groupBy === "month" ? "active" : ""}`}
              >
                Tháng
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-[#0e54a3] font-semibold">
              <span className="w-2.5 h-1 rounded-full bg-[#0e54a3] inline-block" />
              Doanh thu (GMV)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2.5 h-1 rounded-full bg-emerald-600 inline-block" />
              Đơn hàng
            </div>
            <div className="flex items-center gap-1.5 text-violet-700 font-semibold">
              <span className="w-2.5 h-1 rounded-full bg-violet-600 inline-block" />
              Vé đã bán
            </div>
          </div>
        </div>
      </div>

      <div className="grow relative min-h-[300px] w-full select-none">
        {isTrendLoading ? (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-xs text-slate-500 gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0e54a3] border-t-transparent" />
            Đang tải dữ liệu xu hướng...
          </div>
        ) : trendItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-xs text-slate-500">
            Không có dữ liệu trong khoảng thời gian đã lọc.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full min-h-[300px]"
            >
              <defs>
                <linearGradient
                  id="revenue-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0e54a3" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0e54a3" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {yTicksLeft.map((_, idx) => {
                const y = paddingTop + (idx / 4) * chartHeight;
                return (
                  <line
                    key={`grid-${idx}`}
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Y-Axis Left (Revenue) */}
              {yTicksLeft.map((val, idx) => {
                const y = paddingTop + (idx / 4) * chartHeight;
                return (
                  <text
                    key={`y-left-${idx}`}
                    x={paddingLeft - 12}
                    y={y + 3.5}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {formatConciseNumber(val)}
                  </text>
                );
              })}

              {/* Y-Axis Right 1 (Orders) */}
              {yTicksRightOrders.map((val, idx) => {
                const y = paddingTop + (idx / 4) * chartHeight;
                return (
                  <text
                    key={`y-right-orders-${idx}`}
                    x={svgWidth - paddingRight + 20}
                    y={y + 3.5}
                    fill="#059669"
                    fontSize={10}
                    textAnchor="start"
                    fontFamily="monospace"
                  >
                    {Math.round(val)}
                  </text>
                );
              })}

              {/* Y-Axis Right 2 (Tickets) */}
              {yTicksRightTickets.map((val, idx) => {
                const y = paddingTop + (idx / 4) * chartHeight;
                return (
                  <text
                    key={`y-right-tickets-${idx}`}
                    x={svgWidth - paddingRight + 70}
                    y={y + 3.5}
                    fill="#7c3aed"
                    fontSize={10}
                    textAnchor="start"
                    fontFamily="monospace"
                  >
                    {Math.round(val)}
                  </text>
                );
              })}

              {/* Axis Labels */}
              <text
                x={paddingLeft - 12}
                y={paddingTop - 15}
                fill="#0e54a3"
                fontSize={9}
                fontWeight="700"
                textAnchor="end"
                fontFamily="inherit"
              >
                DOANH SỐ (VND)
              </text>
              <text
                x={svgWidth - paddingRight + 15}
                y={paddingTop - 15}
                fill="#059669"
                fontSize={9}
                fontWeight="700"
                textAnchor="start"
                fontFamily="inherit"
              >
                ĐƠN HÀNG
              </text>
              <text
                x={svgWidth - paddingRight + 65}
                y={paddingTop - 15}
                fill="#7c3aed"
                fontSize={9}
                fontWeight="700"
                textAnchor="start"
                fontFamily="inherit"
              >
                VÉ BÁN
              </text>

              {revenueAreaPath && (
                <path d={revenueAreaPath} fill="url(#revenue-gradient)" />
              )}
              {revenuePath && (
                <path
                  d={revenuePath}
                  fill="none"
                  stroke="#0e54a3"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {ordersPath && (
                <path
                  d={ordersPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {ticketsPath && (
                <path
                  d={ticketsPath}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {hoveredIndex !== null && trendItems[hoveredIndex] && (
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop}
                  x2={getX(hoveredIndex)}
                  y2={paddingTop + chartHeight}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              )}

              {trendItems.map((item, index) => {
                const x = getX(index);
                const isHovered = hoveredIndex === index;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={getY(item.revenue, maxRevenue)}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? "#0e54a3" : "#ffffff"}
                      stroke="#0e54a3"
                      strokeWidth={2}
                    />
                    <circle
                      cx={x}
                      cy={getY(item.paid_orders, maxPaidOrders)}
                      r={isHovered ? 4 : 2.5}
                      fill={isHovered ? "#059669" : "#ffffff"}
                      stroke="#059669"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={x}
                      cy={getY(item.tickets_sold, maxTicketsSold)}
                      r={isHovered ? 4 : 2.5}
                      fill={isHovered ? "#7c3aed" : "#ffffff"}
                      stroke="#7c3aed"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}

              {trendItems.map((item, idx) => {
                const x = getX(idx);
                const showLabel =
                  trendItems.length <= 15 ||
                  idx % Math.ceil(trendItems.length / 8) === 0 ||
                  idx === trendItems.length - 1;
                if (!showLabel) return null;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={svgHeight - 15}
                    fill="#94a3b8"
                    fontSize={10}
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    {formatPeriodLabel(item.period)}
                  </text>
                );
              })}

              {trendItems.map((_, idx) => {
                const barWidth =
                  chartWidth / Math.max(trendItems.length - 1, 1);
                const x = getX(idx);
                return (
                  <rect
                    key={idx}
                    x={x - barWidth / 2}
                    y={paddingTop}
                    width={barWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => onHover(idx)}
                    onMouseLeave={() => onHover(null)}
                  />
                );
              })}
            </svg>

            {hoveredIndex !== null && trendItems[hoveredIndex] && (
              <div
                className="absolute z-20 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl pointer-events-none transition-all duration-75 text-xs text-white"
                style={{
                  left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
                  top: "20px",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="font-bold text-slate-200 border-b border-slate-700/60 pb-1.5 mb-2">
                  Thời gian: {trendItems[hoveredIndex].period}
                </div>
                <div className="space-y-1.5 font-sans">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#7dd3fc]" />
                      Doanh số GMV:
                    </span>
                    <span className="font-bold font-mono text-[#7dd3fc]">
                      {formatVND(trendItems[hoveredIndex].revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Phí sàn Tixora (5%):
                    </span>
                    <span className="font-semibold font-mono text-blue-300">
                      {formatVND(
                        trendItems[hoveredIndex].platform_fee ??
                          Math.round(trendItems[hoveredIndex].revenue * 0.05),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Đơn hàng hoàn tất:
                    </span>
                    <span className="font-semibold font-mono text-emerald-400">
                      {trendItems[hoveredIndex].paid_orders} đơn
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-violet-400" />
                      Tổng vé bán ra:
                    </span>
                    <span className="font-semibold font-mono text-violet-400">
                      {trendItems[hoveredIndex].tickets_sold} vé
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
