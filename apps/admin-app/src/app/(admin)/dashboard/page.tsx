"use client";

import { RefreshCw } from "lucide-react";
import { useAdminDashboard } from "./_hooks/useAdminDashboard";
import { ActionRequiredSection } from "./_components/ActionRequiredSection";
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
    <div className="space-y-4">
      {/* HTCAA Page Header */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="htcaa-h1 m-0">Bảng điều khiển</h1>
        </div>

        <div className="head-actions flex items-center gap-2">
          <button
            onClick={reloadDashboard}
            disabled={isRefreshing}
            className="btn"
            title="Tải lại toàn bộ dữ liệu thống kê"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
            />
            <span>{isRefreshing ? "Đang tải…" : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Action Required Section */}
      <ActionRequiredSection />

      <DashboardSummaryCards
        summary={summary}
        isLoadingSummary={isLoadingSummary}
        formatSummaryNumber={formatSummaryNumber}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
