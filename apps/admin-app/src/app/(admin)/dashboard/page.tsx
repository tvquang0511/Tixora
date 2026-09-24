"use client";

import { RefreshCw } from "lucide-react";
import { useAdminDashboard } from "./_hooks/useAdminDashboard";
import { DashboardSummaryCards } from "./_components/DashboardSummaryCards";
import { RevenueChart } from "./_components/RevenueChart";
import { RecentOrdersList } from "./_components/RecentOrdersList";

export default function AdminDashboardPage() {
  const {
    summary,
    isLoadingSummary,
    isLoadingOrders,
    revenueData,
    isLoadingRevenue,
    searchQuery,
    setSearchQuery,
    filteredOrders,
    groupBy,
    tempFromDate,
    setTempFromDate,
    tempToDate,
    setTempToDate,
    tempGroupBy,
    setTempGroupBy,
    fromDateRef,
    toDateRef,
    hoveredIndex,
    setHoveredIndex,
    handleApply,
    handleReset,
    reloadDashboard,
    formatSummaryNumber,
    formatValueVND,
    formatYAxisLabel,
    formatXAxisLabel,
    formatDateSubtext,
    yLabels,
    svgWidth,
    svgHeight,
    paddingLeft,
    paddingRight,
    paddingTop,
    chartWidth,
    chartHeight,
    points,
    linePath,
    fillPath,
    totalRevenue,
    averageRevenue,
    highestItem,
    lowestItem,
  } = useAdminDashboard();

  const handleExportCsv = () => {
    const headers = ["Period", "Revenue (VND)", "Paid Orders", "Tickets Sold"];
    const rows = revenueData.map((item) => [
      item.period,
      item.revenue,
      item.paid_orders,
      item.tickets_sold,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `revenue_report_${groupBy}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isRefreshing = isLoadingSummary || isLoadingOrders || isLoadingRevenue;

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Hệ thống Quản trị / Giám sát
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase font-mono">
            Bảng điều khiển hệ thống
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            Tổng hợp chỉ số doanh thu, giao dịch và sự kiện thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadDashboard}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-none bg-white hover:bg-slate-100 text-xs font-mono font-bold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Tải lại toàn bộ dữ liệu thống kê"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-slate-900" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <DashboardSummaryCards
        summary={summary}
        isLoadingSummary={isLoadingSummary}
        formatSummaryNumber={formatSummaryNumber}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart
          revenueData={revenueData}
          isLoadingRevenue={isLoadingRevenue}
          groupBy={groupBy}
          tempFromDate={tempFromDate}
          tempToDate={tempToDate}
          tempGroupBy={tempGroupBy}
          fromDateRef={fromDateRef}
          toDateRef={toDateRef}
          hoveredIndex={hoveredIndex}
          svgWidth={svgWidth}
          svgHeight={svgHeight}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          chartWidth={chartWidth}
          chartHeight={chartHeight}
          yLabels={yLabels}
          points={points}
          linePath={linePath}
          fillPath={fillPath}
          totalRevenue={totalRevenue}
          averageRevenue={averageRevenue}
          highestItem={highestItem}
          lowestItem={lowestItem}
          onHover={setHoveredIndex}
          onTempFromDateChange={setTempFromDate}
          onTempToDateChange={setTempToDate}
          onTempGroupByChange={setTempGroupBy}
          onApply={handleApply}
          onReset={handleReset}
          onExportCsv={handleExportCsv}
          formatYAxisLabel={formatYAxisLabel}
          formatXAxisLabel={formatXAxisLabel}
          formatDateSubtext={formatDateSubtext}
          formatValueVND={formatValueVND}
        />

        <RecentOrdersList
          filteredOrders={filteredOrders}
          isLoadingOrders={isLoadingOrders}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </div>
  );
}
