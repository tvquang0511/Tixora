"use client";

import { RefreshCw, TrendingUp, CreditCard } from "lucide-react";
import { useAdminRevenue } from "./_hooks/useAdminRevenue";
import { RevenueFilterBar } from "./_components/RevenueFilterBar";
import { RevenueTrendChart } from "./_components/RevenueTrendChart";
import { ConcertRevenueTable } from "./_components/ConcertRevenueTable";
import { ConcertDetailDrawer } from "./_components/ConcertDetailDrawer";
import { PayoutSettlementTab } from "./_components/PayoutSettlementTab";

export default function AdminRevenuePage() {
  const {
    activeTab,
    setActiveTab,
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
    settlements,
    settlementSummary,
    isSettlementsLoading,
    fetchSettlementsData,
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

  const isRefreshing =
    isTrendLoading || isConcertsLoading || isSettlementsLoading;

  const readyPayoutCount = settlements.filter(
    (s) => s.settlement_status === "READY_FOR_SETTLEMENT",
  ).length;

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Tài chính & Quyết toán
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Trung tâm tài chính & Doanh thu
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Quản trị dòng tiền bán vé, phân bổ phí sàn Tixora và đối soát giải
            ngân cho Ban tổ chức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadRevenue}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Tải lại toàn bộ dữ liệu tài chính"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-600" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
            activeTab === "analytics"
              ? "border-teal-600 text-teal-900 bg-teal-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Phân tích Doanh thu & Phí sàn</span>
        </button>

        <button
          onClick={() => setActiveTab("settlements")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
            activeTab === "settlements"
              ? "border-teal-600 text-teal-900 bg-teal-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Đối soát & Quyết toán Payout</span>
          {readyPayoutCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
              {readyPayoutCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in">
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
      )}

      {/* Tab 2: Payout Settlements */}
      {activeTab === "settlements" && (
        <div className="animate-in fade-in">
          <PayoutSettlementTab
            settlements={settlements}
            summary={settlementSummary}
            isLoading={isSettlementsLoading}
            onRefresh={() => fetchSettlementsData(fromDate, toDate)}
          />
        </div>
      )}
    </div>
  );
}
