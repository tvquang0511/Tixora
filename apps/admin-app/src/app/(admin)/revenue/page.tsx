"use client";

import { Building2, Calendar, RotateCw, RotateCcw, X } from "lucide-react";
import { useAdminRevenue } from "./_hooks/useAdminRevenue";
import { RevenueSummaryCards } from "./_components/RevenueSummaryCards";
import { RevenueFilterBar } from "./_components/RevenueFilterBar";
import { RevenueTrendChart } from "./_components/RevenueTrendChart";
import { TopOrganizersChart } from "./_components/TopOrganizersChart";
import { OrganizerRevenueTable } from "./_components/OrganizerRevenueTable";
import { ConcertRevenueTable } from "./_components/ConcertRevenueTable";
import { ConcertDetailDrawer } from "./_components/ConcertDetailDrawer";
import { AdminRevenueAiCard } from "./_components/AdminRevenueAiCard";

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
    concertItems,
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
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1 m-0">Doanh thu & Tăng trưởng</h1>
          </div>
          <p className="sub">
            Theo dõi quy mô GMV bán vé toàn sàn, dòng tiền thu nhập từ phí dịch
            vụ và thị phần của các đơn vị tổ chức sự kiện.
          </p>
        </div>
        <div className="head-actions flex items-center gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={isSummaryLoading || isTrendLoading}
            className="btn"
            title="Tải lại dữ liệu doanh thu"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isSummaryLoading || isTrendLoading ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
            />
            <span>
              {isSummaryLoading || isTrendLoading ? "Đang tải…" : "Làm mới"}
            </span>
          </button>
        </div>
      </div>

      {/* Executive Intelligence: AI Revenue & Growth Strategy */}
      <AdminRevenueAiCard />

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
        {/* Navigation Tabs & Active Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="htcaa-segmented">
              <button
                type="button"
                onClick={() => {
                  setActiveTableTab("organizers");
                  setCurrentPage(1);
                  setTableSearch("");
                }}
                className={activeTableTab === "organizers" ? "active" : ""}
              >
                <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
                <span>Báo cáo theo Ban tổ chức ({organizers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTableTab("concerts");
                  setCurrentPage(1);
                  setTableSearch("");
                }}
                className={activeTableTab === "concerts" ? "active" : ""}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                <span>
                  Báo cáo theo Sự kiện{" "}
                  {selectedOrganizerId !== "ALL"
                    ? `(${filteredConcerts.length})`
                    : `(${concertItems.length})`}
                </span>
              </button>
            </div>

            {/* Active Organizer Filter Pill */}
            {selectedOrganizerId !== "ALL" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Đang lọc BTC:
                </span>
                <span
                  className="font-bold text-[#0e54a3] max-w-[180px] truncate"
                  title={
                    organizers.find(
                      (o) => o.organizer_id === selectedOrganizerId,
                    )?.organization_name
                  }
                >
                  {organizers.find(
                    (o) => o.organizer_id === selectedOrganizerId,
                  )?.organization_name || "Ban tổ chức"}
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterByOrganizer("ALL")}
                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-white transition-colors cursor-pointer"
                  title="Hủy lọc để xem tất cả sự kiện"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedOrganizerId !== "ALL" ? (
              <button
                type="button"
                onClick={() => handleFilterByOrganizer("ALL")}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1 text-xs cursor-pointer text-[#0e54a3] hover:text-[#0a3d78]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xem tất cả sự kiện</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {activeTableTab === "organizers"
                  ? "Nhấp vào dòng để lọc sự kiện của BTC đó"
                  : "Nhấp vào dòng sự kiện để xem chi tiết phân bổ hạng vé"}
              </span>
            )}
          </div>
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
            organizers={organizers}
            selectedOrganizerId={selectedOrganizerId}
            onFilterOrganizer={handleFilterByOrganizer}
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
