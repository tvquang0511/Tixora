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
  fromDate: string;
  toDate: string;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}

export function RevenueTrendChart({
  trendItems,
  isTrendLoading,
  groupBy,
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
      return d.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
    }
    return period;
  };

  const formatFullPeriod = (period: string) => {
    if (!period) return "";
    const parts = period.split("-");
    if (parts.length === 3)
      return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      ).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    if (parts.length === 2) return `Tháng ${parts[1]}, ${parts[0]}`;
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
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[480px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 rounded-lg border border-teal-100 text-teal-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
            Biểu đồ xu hướng doanh thu
          </h3>
          <span className="text-xs font-sans text-slate-500">
            [{formatDateRangeLabel()}]
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-teal-700 font-medium">
            <span className="w-2.5 h-1 rounded-full bg-teal-600 inline-block" />
            Doanh thu (VND)
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2.5 h-1 rounded-full bg-emerald-600 inline-block" />
            Đơn hoàn tất
          </div>
          <div className="flex items-center gap-1.5 text-violet-700 font-medium">
            <span className="w-2.5 h-1 rounded-full bg-violet-600 inline-block" />
            Vé đã bán
          </div>
        </div>
      </div>

      <div className="grow relative min-h-[300px] w-full select-none">
        {isTrendLoading ? (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-xs text-slate-500 gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
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
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
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
                    strokeDasharray={idx === 4 ? "" : "3 3"}
                  />
                );
              })}

              {/* Y Axis Left - Revenue */}
              {yTicksLeft.map((val, idx) => (
                <text
                  key={`ytick-rev-${idx}`}
                  x={paddingLeft - 10}
                  y={paddingTop + (idx / 4) * chartHeight + 4}
                  fill="#94a3b8"
                  fontSize={10}
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {formatConciseNumber(val)}
                </text>
              ))}

              {/* Y Axis Right - Orders */}
              {yTicksRightOrders.map((val, idx) => (
                <text
                  key={`ytick-orders-${idx}`}
                  x={svgWidth - paddingRight + 15}
                  y={paddingTop + (idx / 4) * chartHeight + 4}
                  fill="#059669"
                  fontSize={10}
                  textAnchor="start"
                  fontFamily="inherit"
                >
                  {Math.round(val)}
                </text>
              ))}

              {/* Y Axis Right - Tickets */}
              {yTicksRightTickets.map((val, idx) => (
                <text
                  key={`ytick-tickets-${idx}`}
                  x={svgWidth - paddingRight + 65}
                  y={paddingTop + (idx / 4) * chartHeight + 4}
                  fill="#7c3aed"
                  fontSize={10}
                  textAnchor="start"
                  fontFamily="inherit"
                >
                  {Math.round(val)}
                </text>
              ))}

              {/* Legend headers on axis */}
              <text
                x={paddingLeft - 10}
                y={paddingTop - 15}
                fill="#0d9488"
                fontSize={9}
                fontWeight="600"
                textAnchor="end"
                fontFamily="inherit"
              >
                DOANH THU (VND)
              </text>
              <text
                x={svgWidth - paddingRight + 15}
                y={paddingTop - 15}
                fill="#059669"
                fontSize={9}
                fontWeight="600"
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
                fontWeight="600"
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
                  stroke="#0d9488"
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
                      fill={isHovered ? "#0d9488" : "#ffffff"}
                      stroke="#0d9488"
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
                  left: `${((paddingLeft + (trendItems.length > 1 ? (hoveredIndex / (trendItems.length - 1)) * chartWidth : chartWidth / 2)) / svgWidth) * 100}%`,
                  top: `${((paddingTop + chartHeight - (trendItems[hoveredIndex].revenue / maxRevenue) * chartHeight) / svgHeight) * 100 - 10}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="font-sans text-slate-300 text-[11px] border-b border-slate-700/60 pb-1 mb-1.5 font-medium">
                  {formatFullPeriod(trendItems[hoveredIndex].period)}
                </div>
                <div className="space-y-1 font-sans text-[11px]">
                  <div className="flex items-center justify-between gap-4 text-teal-400 font-semibold">
                    <span>Doanh thu:</span>
                    <span>{formatVND(trendItems[hoveredIndex].revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-emerald-400 font-semibold">
                    <span>Đơn hoàn tất:</span>
                    <span>
                      {trendItems[hoveredIndex].paid_orders.toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-violet-400 font-semibold">
                    <span>Vé bán ra:</span>
                    <span>
                      {trendItems[hoveredIndex].tickets_sold.toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
