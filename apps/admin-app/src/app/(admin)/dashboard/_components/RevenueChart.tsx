"use client";

import { Calendar, Download } from "lucide-react";
import { type RevenueItem } from "@/services/dashboard.service";

interface RevenueChartProps {
  revenueData: RevenueItem[];
  isLoadingRevenue: boolean;
  groupBy: "day" | "week" | "month";
  tempFromDate: string;
  tempToDate: string;
  tempGroupBy: "day" | "week" | "month";
  fromDateRef: React.RefObject<HTMLInputElement | null>;
  toDateRef: React.RefObject<HTMLInputElement | null>;
  hoveredIndex: number | null;
  svgWidth: number;
  svgHeight: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  chartWidth: number;
  chartHeight: number;
  yLabels: number[];
  points: { x: number; y: number; item: RevenueItem; index: number }[];
  linePath: string;
  fillPath: string;
  totalRevenue: number;
  averageRevenue: number;
  highestItem: RevenueItem | null;
  lowestItem: RevenueItem | null;
  onHover: (idx: number | null) => void;
  onTempFromDateChange: (v: string) => void;
  onTempToDateChange: (v: string) => void;
  onTempGroupByChange: (v: "day" | "week" | "month") => void;
  onApply: () => void;
  onReset: () => void;
  onExportCsv: () => void;
  formatYAxisLabel: (v: number) => string;
  formatXAxisLabel: (period: string, type: "day" | "week" | "month") => string;
  formatDateSubtext: (period: string) => string;
  formatValueVND: (v: number) => string;
}

export function RevenueChart({
  revenueData,
  isLoadingRevenue,
  groupBy,
  tempFromDate,
  tempToDate,
  tempGroupBy,
  fromDateRef,
  toDateRef,
  hoveredIndex,
  svgWidth,
  svgHeight,
  paddingLeft,
  paddingRight,
  paddingTop,
  chartWidth,
  chartHeight,
  yLabels,
  points,
  linePath,
  fillPath,
  totalRevenue,
  averageRevenue,
  highestItem,
  lowestItem,
  onHover,
  onTempFromDateChange,
  onTempToDateChange,
  onTempGroupByChange,
  onApply,
  onReset,
  onExportCsv,
  formatYAxisLabel,
  formatXAxisLabel,
  formatDateSubtext,
  formatValueVND,
}: RevenueChartProps) {
  return (
    <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[460px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
            Biểu đồ doanh thu theo chu kỳ
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Dữ liệu doanh thu bán vé đã xác nhận thanh toán
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
            <span>Doanh thu (VND)</span>
          </div>
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-sans text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-5 pb-4 border-b border-slate-100">
        <div className="md:col-span-5 flex flex-col gap-1">
          <span className="text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wider">
            Khoảng thời gian
          </span>
          <div
            onClick={() => fromDateRef.current?.showPicker()}
            className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 transition-colors cursor-pointer w-full focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500"
          >
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex items-center justify-between grow">
              <input
                ref={fromDateRef}
                type="date"
                value={tempFromDate}
                onClick={(e) => {
                  e.stopPropagation();
                  fromDateRef.current?.showPicker();
                }}
                onChange={(e) => onTempFromDateChange(e.target.value)}
                className="bg-transparent text-slate-900 focus:outline-none w-[95px] min-w-0 font-sans text-xs cursor-pointer text-center font-medium"
              />
              <span className="text-slate-400 font-sans font-medium text-xs select-none px-1">
                →
              </span>
              <input
                ref={toDateRef}
                type="date"
                value={tempToDate}
                onClick={(e) => {
                  e.stopPropagation();
                  toDateRef.current?.showPicker();
                }}
                onChange={(e) => onTempToDateChange(e.target.value)}
                className="bg-transparent text-slate-900 focus:outline-none w-[95px] min-w-0 font-sans text-xs cursor-pointer text-center font-medium"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-1">
          <span className="text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wider">
            Gom nhóm
          </span>
          <div className="relative">
            <select
              value={tempGroupBy}
              onChange={(e) =>
                onTempGroupByChange(e.target.value as "day" | "week" | "month")
              }
              className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-sans font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full transition-colors cursor-pointer"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <button
            onClick={onApply}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-sans text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            Áp dụng
          </button>
          <button
            onClick={onReset}
            className="py-2 px-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-sans text-xs font-medium transition-colors cursor-pointer"
          >
            Mặc định
          </button>
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-x-auto grow flex items-center justify-center min-h-[220px]">
        {isLoadingRevenue ? (
          <div className="py-16 text-center text-slate-500 font-sans text-xs flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : revenueData.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-sans text-xs">
            Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full max-h-[300px] select-none"
            >
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {yLabels.map((val, idx) => {
                const y =
                  paddingTop + (idx / (yLabels.length - 1)) * chartHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray={idx === yLabels.length - 1 ? "" : "3 3"}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize={10}
                      textAnchor="end"
                      fontFamily="inherit"
                    >
                      {formatYAxisLabel(val)}
                    </text>
                  </g>
                );
              })}

              {fillPath && <path d={fillPath} fill="url(#chart-gradient)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {hoveredIndex !== null && points[hoveredIndex] && (
                <line
                  x1={points[hoveredIndex].x}
                  y1={paddingTop}
                  x2={points[hoveredIndex].x}
                  y2={paddingTop + chartHeight}
                  stroke="#0d9488"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}

              {points.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === idx ? 5 : 3.5}
                  fill={hoveredIndex === idx ? "#0d9488" : "#ffffff"}
                  stroke="#0d9488"
                  strokeWidth={2}
                />
              ))}

              {points.map((pt, idx) => {
                const showLabel =
                  points.length <= 15 ||
                  idx % Math.ceil(points.length / 8) === 0 ||
                  idx === points.length - 1;
                if (!showLabel) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={svgHeight - 12}
                    fill="#94a3b8"
                    fontSize={10}
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    {formatXAxisLabel(pt.item.period, groupBy)}
                  </text>
                );
              })}

              {points.map((pt, idx) => {
                const rectWidth = chartWidth / Math.max(points.length - 1, 1);
                return (
                  <rect
                    key={idx}
                    x={pt.x - rectWidth / 2}
                    y={paddingTop}
                    width={rectWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => onHover(idx)}
                    onMouseLeave={() => onHover(null)}
                  />
                );
              })}
            </svg>

            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute z-20 bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-lg pointer-events-none transition-all duration-75 text-xs text-white"
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredIndex].y / svgHeight) * 100 - 10}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="font-sans text-slate-300 text-[10px]">
                  {formatDateSubtext(points[hoveredIndex].item.period)}
                </div>
                <div className="font-sans font-bold mt-0.5 text-white">
                  Doanh thu:{" "}
                  {new Intl.NumberFormat("vi-VN").format(
                    points[hoveredIndex].item.revenue,
                  )}{" "}
                  đ
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Stats */}
      {!isLoadingRevenue && revenueData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 mt-4 pt-4 gap-3 sm:gap-0">
          <div className="flex flex-col items-start sm:px-3 pb-2 sm:pb-0">
            <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
              Tổng doanh thu
            </span>
            <span className="text-base font-sans font-bold text-slate-900 mt-0.5">
              {formatValueVND(totalRevenue)}
            </span>
          </div>
          <div className="flex flex-col items-start sm:px-3 py-2 sm:py-0">
            <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
              Trung bình /{" "}
              {groupBy === "day"
                ? "ngày"
                : groupBy === "week"
                  ? "tuần"
                  : "tháng"}
            </span>
            <span className="text-base font-sans font-bold text-slate-900 mt-0.5">
              {formatValueVND(averageRevenue)}
            </span>
          </div>
          <div className="flex flex-col items-start sm:px-3 py-2 sm:py-0">
            <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
              Cao nhất (
              {groupBy === "day"
                ? "ngày"
                : groupBy === "week"
                  ? "tuần"
                  : "tháng"}
              )
            </span>
            {highestItem && (
              <>
                <span className="text-base font-sans font-bold text-slate-900 mt-0.5">
                  {formatValueVND(highestItem.revenue)}
                </span>
                <span className="text-[10px] font-sans text-slate-500">
                  {formatDateSubtext(highestItem.period)}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col items-start sm:px-3 pt-2 sm:pt-0">
            <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
              Thấp nhất (
              {groupBy === "day"
                ? "ngày"
                : groupBy === "week"
                  ? "tuần"
                  : "tháng"}
              )
            </span>
            {lowestItem && (
              <>
                <span className="text-base font-sans font-bold text-slate-900 mt-0.5">
                  {formatValueVND(lowestItem.revenue)}
                </span>
                <span className="text-[10px] font-sans text-slate-500">
                  {formatDateSubtext(lowestItem.period)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
