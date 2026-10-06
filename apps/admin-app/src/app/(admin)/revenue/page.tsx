"use client";

import { Building2, Calendar } from "lucide-react";
import { useAdminRevenue } from "./_hooks/useAdminRevenue";
import { RevenueSummaryCards } from "./_components/RevenueSummaryCards";
import { RevenueFilterBar } from "./_components/RevenueFilterBar";
import { RevenueTrendChart } from "./_components/RevenueTrendChart";
import { TopOrganizersChart } from "./_components/TopOrganizersChart";
import { OrganizerRevenueTable } from "./_components/OrganizerRevenueTable";
import { ConcertRevenueTable } from "./_components/ConcertRevenueTable";
import { ConcertDetailDrawer } from "./_components/ConcertDetailDrawer";

export default function AdminRevenuePage() {
  const {
    preset,
    fromDate,
    toDate,
    groupBy,
    setGroupBy,
    selectedOrganizerId,
    tempFromDate,
    setTempFromDate,
    tempToDate,
    setTempToDate,
    tempOrganizerId,
    setTempOrganizerId,
    fromDateRef,
    toDateRef,
    activeTableTab,
    setActiveTableTab,
    summary,
    isSummaryLoading,
    organizers,
    isOrganizersLoading,
    trendItems,
    isTrendLoading,
    filteredConcerts,
    paginatedConcerts,
    isConcertsLoading,
    filteredOrganizers,
    paginatedOrganizers,
    tableSearch,
    setTableSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    selectedConcertId,
    detailData,
    isDetailLoading,
    hoveredIndex,
    setHoveredIndex,
    handleSelectPreset,
    handleApplyFilters,
    handleFilterByOrganizer,
    handleResetFilters,
    handleOpenConcertDetail,
    handleCloseDetail,
  } = useAdminRevenue();

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="head stickyhead">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1">Doanh thu & Tăng trưởng</h1>
          </div>
          <p className="sub">
            Theo dõi quy mô GMV bán vé toàn sàn, dòng tiền thu nhập từ phí dịch
            vụ và thị phần của các đơn vị tổ chức sự kiện.
          </p>
        </div>
      </div>

      {/* Layer 1: Executive KPI Cards */}
      <RevenueSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Layer 2: Global Filters */}
      <RevenueFilterBar
        preset={preset}
        tempFromDate={tempFromDate}
        tempToDate={tempToDate}
        tempOrganizerId={tempOrganizerId}
        organizers={organizers}
        fromDateRef={fromDateRef}
        toDateRef={toDateRef}
        onSelectPreset={handleSelectPreset}
        onFromDateChange={setTempFromDate}
        onToDateChange={setTempToDate}
        onOrganizerChange={setTempOrganizerId}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Active Filter Notification if specific Organizer is filtered */}
      {selectedOrganizerId !== "ALL" && (
        <div className="card p-3 bg-blue-50/60 border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#0e54a3]">Đang lọc theo:</span>
            <span className="text-slate-700 font-semibold">
              {organizers.find((o) => o.organizer_id === selectedOrganizerId)
                ?.organization_name || "Ban tổ chức được chọn"}
            </span>
          </div>
          <button
            onClick={() => handleFilterByOrganizer("ALL")}
            className="text-xs font-bold text-[#0e54a3] hover:underline"
          >
            Xóa lọc BTC (Xem toàn sàn)
          </button>
        </div>
      )}

      {/* Layer 3: Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Growth & Revenue Trend Chart (2 cols) */}
        <div className="lg:col-span-2">
          <RevenueTrendChart
            trendItems={trendItems}
            isTrendLoading={isTrendLoading}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            fromDate={fromDate}
            toDate={toDate}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
          />
        </div>

        {/* Top Organizers Ranking (1 col) */}
        <div>
          <TopOrganizersChart
            organizers={organizers}
            isLoading={isOrganizersLoading}
            onSelectOrganizer={handleFilterByOrganizer}
            selectedOrganizerId={selectedOrganizerId}
          />
        </div>
      </div>

      {/* Layer 4: Multi-tab Detailed Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="htcaa-segmented">
            <button
              onClick={() => {
                setActiveTableTab("organizers");
                setCurrentPage(1);
              }}
              className={activeTableTab === "organizers" ? "active" : ""}
            >
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              Báo cáo theo Ban tổ chức ({filteredOrganizers.length})
            </button>
            <button
              onClick={() => {
                setActiveTableTab("concerts");
                setCurrentPage(1);
              }}
              className={activeTableTab === "concerts" ? "active" : ""}
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Báo cáo theo Sự kiện ({filteredConcerts.length})
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {activeTableTab === "organizers"
              ? "Bấm vào 'Xem các show' để lọc chi tiết sự kiện của BTC đó"
              : "Bấm vào 'Chi tiết' để xem phân bổ hạng vé riêng của show"}
          </span>
        </div>

        {/* Tab Content 1: Organizers Table */}
        {activeTableTab === "organizers" && (
          <OrganizerRevenueTable
            organizers={paginatedOrganizers}
            isLoading={isOrganizersLoading}
            searchTerm={tableSearch}
            onSearchChange={(v) => {
              setTableSearch(v);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrganizers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onFilterConcerts={handleFilterByOrganizer}
            selectedOrganizerId={selectedOrganizerId}
          />
        )}

        {/* Tab Content 2: Concerts Table */}
        {activeTableTab === "concerts" && (
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
            onSearchChange={(v) => {
              setTableSearch(v);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            onViewDetail={handleOpenConcertDetail}
          />
        )}
      </div>

      {/* Drill-down Drawer for Concert Ticket Tiers */}
      <ConcertDetailDrawer
        selectedConcertId={selectedConcertId}
        detailData={detailData}
        isDetailLoading={isDetailLoading}
        fromDate={fromDate}
        toDate={toDate}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
