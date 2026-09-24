"use client";

import { RefreshCw } from "lucide-react";
import { useAdminRevenue } from "./_hooks/useAdminRevenue";
import { RevenueFilterBar } from "./_components/RevenueFilterBar";
import { RevenueTrendChart } from "./_components/RevenueTrendChart";
import { ConcertRevenueTable } from "./_components/ConcertRevenueTable";
import { ConcertDetailDrawer } from "./_components/ConcertDetailDrawer";

export default function AdminRevenuePage() {
  const {
    fromDate,
    toDate,
    groupBy,
    tempFromDate,
    setTempFromDate,
    tempToDate,
    setTempToDate,
    tempGroupBy,
    setTempGroupBy,
    fromDateRef,
    toDateRef,
    trendItems,
    isTrendLoading,
    isConcertsLoading,
    filteredConcerts,
    paginatedConcerts,
    tableSearch,
    setTableSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    selectedConcertId,
    setSelectedConcertId,
    detailData,
    setDetailData,
    isDetailLoading,
    hoveredIndex,
    setHoveredIndex,
    tierTotals,
    handleApply,
    handleReset,
    reloadRevenue,
  } = useAdminRevenue();

  const isRefreshing = isTrendLoading || isConcertsLoading;

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Tài chính & Doanh thu
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Báo cáo doanh thu sự kiện
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Phân tích số liệu tài chính, doanh thu theo chu kỳ và theo từng sự
            kiện
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadRevenue}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Tải lại toàn bộ dữ liệu doanh thu"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-600" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <RevenueFilterBar
        tempFromDate={tempFromDate}
        tempToDate={tempToDate}
        tempGroupBy={tempGroupBy}
        fromDateRef={fromDateRef}
        toDateRef={toDateRef}
        onFromDateChange={setTempFromDate}
        onToDateChange={setTempToDate}
        onGroupByChange={setTempGroupBy}
        onApply={handleApply}
        onReset={handleReset}
      />

      <RevenueTrendChart
        trendItems={trendItems}
        isTrendLoading={isTrendLoading}
        groupBy={groupBy}
        fromDate={fromDate}
        toDate={toDate}
        hoveredIndex={hoveredIndex}
        onHover={setHoveredIndex}
      />

      <ConcertRevenueTable
        paginatedConcerts={paginatedConcerts}
        filteredConcerts={filteredConcerts}
        isConcertsLoading={isConcertsLoading}
        tableSearch={tableSearch}
        fromDate={fromDate}
        toDate={toDate}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onSearchChange={setTableSearch}
        onPageChange={setCurrentPage}
        onViewDetail={setSelectedConcertId}
      />

      <ConcertDetailDrawer
        selectedConcertId={selectedConcertId}
        detailData={detailData}
        isDetailLoading={isDetailLoading}
        fromDate={fromDate}
        toDate={toDate}
        tierTotals={tierTotals}
        onClose={() => {
          setSelectedConcertId(null);
          setDetailData(null);
        }}
      />
    </div>
  );
}
