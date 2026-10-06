"use client";

import { useState } from "react";
import { TrendingUp, Ticket, ShoppingBag, DollarSign } from "lucide-react";
import { RevenueTrendItem } from "@/services/organizer-revenue.service";

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
  fromDate?: string;
  toDate?: string;
}

export function RevenueTrendChart({
  trendItems,
  isTrendLoading,
  groupBy,
}: RevenueTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showTickets, setShowTickets] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  const toggleMetric = (metric: "revenue" | "tickets" | "orders") => {
    if (metric === "revenue") {
      if (showRevenue && !showTickets && !showOrders) return;
      setShowRevenue((prev) => !prev);
    } else if (metric === "tickets") {
      if (showTickets && !showRevenue && !showOrders) return;
      setShowTickets((prev) => !prev);
    } else if (metric === "orders") {
      if (showOrders && !showRevenue && !showTickets) return;
      setShowOrders((prev) => !prev);
    }
  };

  const svgWidth = 1000;
  const svgHeight = 380;
  const paddingLeft = 80;
  const paddingRight = 80;
  const paddingTop = 40;
  const paddingBottom = 50;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxRevenue =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.revenue), 1000000)
      : 1000000;
  const maxTicketsSold =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.tickets_sold), 10)
      : 10;
  const maxPaidOrders =
    trendItems.length > 0
      ? Math.max(...trendItems.map((i) => i.paid_orders), 10)
      : 10;

  const yTicksLeft = [
    maxRevenue,
    maxRevenue * 0.75,
    maxRevenue * 0.5,
    maxRevenue * 0.25,
    0,
  ];

  const yTicksRight = [
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
    paddingTop +
    chartHeight -
    (maxValue > 0 ? (value / maxValue) * chartHeight : 0);

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
  const ticketsPath = getLinePath((i) => i.tickets_sold, maxTicketsSold);
  const ordersPath = getLinePath((i) => i.paid_orders, maxPaidOrders);

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
      return `${parts[2]}/${parts[1]}`;
    }
    return period;
  };

  const hoveredItem =
    hoveredIndex !== null && trendItems[hoveredIndex]
      ? trendItems[hoveredIndex]
      : null;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/85 border border-slate-800/80 shadow-xl shadow-black/30 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Biểu Đồ Tăng Trưởng Doanh Thu
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Diễn biến doanh thu thực nhận, số vé phát hành và số lượng đơn hàng
            theo chu kỳ
          </p>
        </div>

        {/* Metric Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => toggleMetric("revenue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showRevenue
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs"
                : "text-slate-500 hover:text-slate-300 border border-transparent line-through opacity-60"
            }`}
            title="Bật/tắt hiển thị Doanh thu (GMV)"
          >
            <span
              className={`w-2 h-2 rounded-full ${showRevenue ? "bg-teal-400" : "bg-slate-500"}`}
            />
            Doanh thu (GMV)
          </button>
          <button
            type="button"
            onClick={() => toggleMetric("tickets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showTickets
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs"
                : "text-slate-500 hover:text-slate-300 border border-transparent line-through opacity-60"
            }`}
            title="Bật/tắt hiển thị Vé đã bán"
          >
            <span
              className={`w-2 h-2 rounded-full ${showTickets ? "bg-sky-400" : "bg-slate-500"}`}
            />
            Vé đã bán
          </button>
          <button
            type="button"
            onClick={() => toggleMetric("orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showOrders
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-slate-500 hover:text-slate-300 border border-transparent line-through opacity-60"
            }`}
            title="Bật/tắt hiển thị Đơn hàng"
          >
            <span
              className={`w-2 h-2 rounded-full ${showOrders ? "bg-amber-400" : "bg-slate-500"}`}
            />
            Đơn hàng
          </button>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div className="relative w-full overflow-hidden pt-2">
        {isTrendLoading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : trendItems.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-xs">
            Chưa có phát sinh giao dịch trong khoảng thời gian này.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient
                  id="organizerRevenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {yTicksLeft.map((tick, index) => {
                const y =
                  paddingTop + (index / (yTicksLeft.length - 1)) * chartHeight;
                return (
                  <g key={index}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeOpacity="0.4"
                    />
                    {showRevenue && (
                      <text
                        x={paddingLeft - 10}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        fontWeight="500"
                      >
                        {formatConciseNumber(tick)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Right Y-Axis Ticks (Tickets sold) */}
              {showTickets &&
                yTicksRight.map((tick, index) => {
                  const y =
                    paddingTop +
                    (index / (yTicksRight.length - 1)) * chartHeight;
                  return (
                    <text
                      key={`r-${index}`}
                      x={svgWidth - paddingRight + 10}
                      y={y + 3}
                      fill="#38bdf8"
                      fontSize="10"
                      textAnchor="start"
                      fontWeight="500"
                    >
                      {Math.round(tick)} vé
                    </text>
                  );
                })}

              {/* Revenue Area */}
              {showRevenue && revenueAreaPath && (
                <path
                  d={revenueAreaPath}
                  fill="url(#organizerRevenueGradient)"
                />
              )}

              {/* Revenue Line */}
              {showRevenue && revenuePath && (
                <path
                  d={revenuePath}
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Tickets Line */}
              {showTickets && ticketsPath && (
                <path
                  d={ticketsPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Orders Line */}
              {showOrders && ordersPath && (
                <path
                  d={ordersPath}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X-Axis Labels */}
              {trendItems.map((item, index) => {
                const step = Math.ceil(trendItems.length / 10);
                if (
                  index % step !== 0 &&
                  index !== trendItems.length - 1 &&
                  index !== 0
                )
                  return null;
                const x = getX(index);
                const y = paddingTop + chartHeight + 20;

                return (
                  <text
                    key={`xlabel-${index}`}
                    x={x}
                    y={y}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {formatPeriodLabel(item.period)}
                  </text>
                );
              })}

              {/* Interactive Hover Elements */}
              {trendItems.map((_, index) => {
                const x = getX(index);

                return (
                  <rect
                    key={`hit-${index}`}
                    x={x - chartWidth / (trendItems.length * 2)}
                    y={paddingTop}
                    width={chartWidth / trendItems.length}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}

              {/* Crosshair indicator */}
              {hoveredIndex !== null && (
                <g pointerEvents="none">
                  <line
                    x1={getX(hoveredIndex)}
                    y1={paddingTop}
                    x2={getX(hoveredIndex)}
                    y2={paddingTop + chartHeight}
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {showRevenue && (
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(trendItems[hoveredIndex].revenue, maxRevenue)}
                      r="5"
                      fill="#14b8a6"
                      stroke="#042f2e"
                      strokeWidth="2"
                    />
                  )}
                  {showTickets && (
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(
                        trendItems[hoveredIndex].tickets_sold,
                        maxTicketsSold,
                      )}
                      r="4"
                      fill="#38bdf8"
                      stroke="#082f49"
                      strokeWidth="2"
                    />
                  )}
                  {showOrders && (
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(
                        trendItems[hoveredIndex].paid_orders,
                        maxPaidOrders,
                      )}
                      r="4"
                      fill="#fbbf24"
                      stroke="#451a03"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredItem && hoveredIndex !== null && (
              <div
                className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]"
                style={{
                  left: `${Math.min(Math.max(10, (getX(hoveredIndex) / svgWidth) * 100), 75)}%`,
                  top: "15%",
                }}
              >
                <div className="font-bold text-white border-b border-slate-800 pb-1">
                  Mốc: {hoveredItem.period}
                </div>
                <div className="space-y-1 text-[11px]">
                  {showRevenue && (
                    <>
                      <div className="flex items-center justify-between text-teal-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> GMV:
                        </span>
                        <span className="font-bold">
                          {formatVND(hoveredItem.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Thực nhận:</span>
                        <span className="font-bold">
                          {formatVND(hoveredItem.net_revenue)}
                        </span>
                      </div>
                    </>
                  )}
                  {showTickets && (
                    <div className="flex items-center justify-between text-sky-400">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Vé bán:
                      </span>
                      <span className="font-bold">
                        {hoveredItem.tickets_sold} vé
                      </span>
                    </div>
                  )}
                  {showOrders && (
                    <div className="flex items-center justify-between text-amber-400">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> Đơn hàng:
                      </span>
                      <span className="font-bold">
                        {hoveredItem.paid_orders} đơn
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
