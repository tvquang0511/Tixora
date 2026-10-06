"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  RotateCw,
  FileText,
  Phone,
  Mail,
  X,
  RotateCcw,
} from "lucide-react";
import {
  getOrganizerRequests,
  OrganizerRequestItem,
} from "@/services/organizer-request.service";
import { OrganizerDetailDrawer } from "./_components/OrganizerDetailDrawer";

export default function OrganizerRequestsPage() {
  const [requests, setRequests] = useState<OrganizerRequestItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const hasActiveFilters = Boolean(
    search || (statusFilter && statusFilter !== "ALL"),
  );
  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter && statusFilter !== "ALL" ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(1);
  };

  // Drawer state
  const [selectedRequest, setSelectedRequest] =
    useState<OrganizerRequestItem | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await getOrganizerRequests({
        page,
        limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
      });
      setRequests(res.data || []);
      setTotalItems(res.meta?.totalItems || 0);
    } catch (err: unknown) {
      console.error("Failed to load organizer requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getOrganizerRequests({
      page,
      limit,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: debouncedSearch.trim() || undefined,
    })
      .then((res) => {
        if (active) {
          setRequests(res.data || []);
          setTotalItems(res.meta?.totalItems || 0);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load organizer requests", err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, limit, statusFilter, debouncedSearch]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1 m-0">Hồ sơ đối tác BTC</h1>
            <span className="htcaa-badge-count-pill">{totalItems} hồ sơ</span>
          </div>
          <p className="sub">
            Kiểm tra thông tin pháp nhân, hồ sơ năng lực và cấp quyền Organizer
            cho đối tác
          </p>
        </div>
        <div className="head-actions flex items-center gap-2">
          <button
            onClick={() => fetchRequests()}
            disabled={isLoading}
            className="btn"
            title="Tải lại danh sách hồ sơ"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
            />
            <span>{isLoading ? "Đang tải…" : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar Card */}
      <div className="card p-3.5 space-y-3">
        {/* Top row: Search input + Rows per page selector + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="search-box flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên đơn vị, email, MST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick controls: Per-page & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer"
                title="Khôi phục tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Đặt lại ({activeFilterCount})</span>
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="over text-[11px] hidden md:inline">
                Hiển thị:
              </span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="select-trigger text-xs font-semibold"
                aria-label="Số dòng mỗi trang"
              >
                <option value="10">10 dòng/trang</option>
                <option value="20">20 dòng/trang</option>
                <option value="50">50 dòng/trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom row: Status Tabs & Count Stats */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="over text-[11px] shrink-0 hidden sm:inline">
              Trạng thái:
            </span>
            <div className="htcaa-segmented">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: "PENDING", label: "Chờ duyệt" },
                { key: "APPROVED", label: "Đã duyệt" },
                { key: "REJECTED", label: "Từ chối" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`htcaa-segmented-btn ${statusFilter === tab.key ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count info */}
          <div className="text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {requests.length}
            </strong>
            <span>trên</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {totalItems}
            </strong>
            <span>hồ sơ đối tác</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="sub">
            Danh sách hồ sơ yêu cầu ({totalItems.toLocaleString()})
          </span>
        </div>
        <div className="htcaa-table-wrap">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Tên đơn vị / Doanh nghiệp</th>
                  <th>Đại diện / Liên hệ</th>
                  <th>Mã số thuế / CCCD</th>
                  <th>Tài khoản thanh toán</th>
                  <th>Hồ sơ đính kèm</th>
                  <th>Trạng thái</th>
                  <th>Ngày nộp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0052ff] mb-2" />
                      Đang tải dữ liệu hồ sơ...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500"
                    >
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Không tìm thấy hồ sơ đối tác nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRequest(item)}
                      className="row-click group cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      {/* Organization Name */}
                      <td>
                        <div className="font-semibold text-slate-900 text-xs">
                          {item.organization_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.phone_number}
                        </div>
                      </td>

                      {/* Contact User */}
                      <td>
                        <div className="font-medium text-slate-800 text-xs">
                          {item.user?.full_name || "N/A"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {item.user?.email}
                        </div>
                      </td>

                      {/* Tax Code */}
                      <td className="font-mono tabular-nums text-xs text-slate-700 font-semibold">
                        {item.tax_code_or_id}
                      </td>

                      {/* Bank Info */}
                      <td>
                        {item.bank_name ? (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800">
                              {item.bank_name}
                            </span>
                            <div className="font-mono tabular-nums text-slate-600 mt-0.5 text-[11px]">
                              {item.bank_account_number}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase truncate max-w-[150px]">
                              {item.bank_account_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Chưa cung cấp
                          </span>
                        )}
                      </td>

                      {/* Documents */}
                      <td>
                        <div className="flex flex-col gap-1">
                          {item.business_license_url ? (
                            <a
                              href={item.business_license_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#0052ff] hover:text-[#0e54a3] font-medium"
                            >
                              <FileText className="w-3 h-3" />
                              Giấy phép KD
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : null}
                          {item.portfolio_url ? (
                            <a
                              href={item.portfolio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#0052ff] hover:text-[#0e54a3] font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Portfolio
                            </a>
                          ) : null}
                          {!item.business_license_url &&
                            !item.portfolio_url && (
                              <span className="text-xs text-slate-400">
                                Không có
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {item.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Chờ duyệt
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Đã phê duyệt
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              Bị từ chối
                            </span>
                            {item.rejection_reason && (
                              <div
                                className="text-[11px] text-rose-600 mt-1 max-w-[160px] truncate"
                                title={item.rejection_reason}
                              >
                                Lý do: {item.rejection_reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="font-mono tabular-nums">
              Hiển thị{" "}
              <span className="font-semibold text-slate-800">
                {requests.length}
              </span>{" "}
              /{" "}
              <span className="font-semibold text-slate-800">{totalItems}</span>{" "}
              hồ sơ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                Trang trước
              </button>
              <span className="px-2 py-1 font-mono font-semibold text-slate-700">
                Trang {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={requests.length < limit}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Organizer Detail Drawer */}
      <OrganizerDetailDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onSuccess={() => void fetchRequests()}
      />
    </div>
  );
}
