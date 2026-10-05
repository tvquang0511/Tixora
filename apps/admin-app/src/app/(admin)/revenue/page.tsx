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
      <div className="head stickyhead">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1">Trung tâm tài chính & Doanh thu</h1>
            <span className="htcaa-badge-count-pill">Báo cáo tài chính</span>
          </div>
          <p className="sub">
            Quản trị dòng tiền bán vé, phân bổ phí sàn Tixora và đối soát giải ngân cho Ban tổ chức
          </p>
        </div>

        <div className="head-actions">
          <button
            onClick={reloadRevenue}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Tải lại toàn bộ dữ liệu tài chính"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="htcaa-segmented self-start">
        <button
          onClick={() => setActiveTab("analytics")}
          className={activeTab === "analytics" ? "active" : ""}
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
          Phân tích Doanh thu & Phí sàn
        </button>

        <button
          onClick={() => setActiveTab("settlements")}
          className={activeTab === "settlements" ? "active" : ""}
        >
          <CreditCard className="w-3.5 h-3.5 inline mr-1" />
          Đối soát & Quyết toán Payout
          {readyPayoutCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
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
