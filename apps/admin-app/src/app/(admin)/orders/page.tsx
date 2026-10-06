"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
  X,
} from "lucide-react";
import { formatConcertCurrency } from "@/services/concert.service";
import {
  getAdminOrders,
  type AdminOrderListItem,
} from "@/services/order.service";
import { StatusBadge } from "../_components/StatusBadge";
import { OrderDetailDrawer } from "./_components/OrderDetailDrawer";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-md cursor-pointer shrink-0 transition-colors shadow-2xs"
      title="Sao chép"
    >
      {copied ? (
        <span className="text-[10px] text-emerald-600 font-bold">✓</span>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const hasActiveFilters = Boolean(search || statusFilter);
  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAdminOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setOrders(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* HTCAA Page Header */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="htcaa-h1 m-0">Đơn hàng</h1>
          <span className="htcaa-badge-count-pill">
            {totalItems > 0 ? `${totalItems} đơn hàng` : "0 đơn hàng"}
          </span>
        </div>
        <div className="head-actions flex items-center gap-2">
          <button
            onClick={() => void fetchOrders()}
            disabled={isLoading}
            className="btn"
            title="Làm mới danh sách đơn hàng"
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
              placeholder="Tìm theo mã đơn, người mua, email..."
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

        {/* Bottom row: Filter Dropdowns & Stats */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
            <span className="over text-[11px] shrink-0">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Count info */}
          <div className="ml-auto text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {orders.length}
            </strong>
            <span>trên</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {totalItems}
            </strong>
            <span>đơn hàng</span>
          </div>
        </div>
      </div>

      {/* Main HTCAA Table */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="sub">
            Danh sách đơn hàng ({totalItems.toLocaleString()})
          </span>
        </div>
        <div className="htcaa-table-wrap">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <RotateCw className="h-5 w-5 animate-spin text-[#0052ff]" />
                <span className="text-xs">Đang tải danh sách đơn hàng…</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              Không tìm thấy đơn hàng nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[320px]">
              <table className="htcaa-table">
                <thead>
                  <tr>
                    <th>MÃ ĐƠN HÀNG</th>
                    <th>KHÁCH HÀNG</th>
                    <th>SỰ KIỆN</th>
                    <th style={{ textAlign: "center" }}>SỐ VÉ</th>
                    <th style={{ textAlign: "right" }}>SỐ TIỀN</th>
                    <th style={{ textAlign: "center" }}>TRẠNG THÁI</th>
                    <th>NGÀY TẠO</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="row-click group"
                    >
                      <td>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-xs font-semibold text-[#0052ff]">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <CopyButton text={order.id} />
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900">
                          {order.user_name || "Khách hàng ẩn danh"}
                        </div>
                        <div className="row-sub">
                          {order.user_email || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900 group-hover:text-[#0052ff] transition-colors">
                          {order.concert_name}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                        className="font-bold text-slate-900 font-mono"
                      >
                        {order.ticket_count}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                        className="font-bold text-slate-900 font-mono text-xs"
                      >
                        {formatConcertCurrency(Number(order.total_amount))}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <StatusBadge
                          status={order.status}
                          variant="order"
                          size="xs"
                        />
                      </td>
                      <td>
                        <div className="val-strong">
                          {new Date(order.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                        <div className="row-sub">
                          {new Date(order.created_at).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
              <div className="flex items-center gap-3 text-slate-600 font-medium">
                <span>
                  Trang <strong className="text-slate-900">{page}</strong> trên{" "}
                  <strong className="text-slate-900">{totalPages}</strong>{" "}
                  (Tổng:{" "}
                  <strong className="text-slate-900">{totalItems}</strong> đơn)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="over text-[10px]">Hiển thị:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 bg-white text-xs font-medium text-slate-700 rounded-lg cursor-pointer focus:outline-none shadow-2xs"
                  >
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs rounded-lg disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronLeft size={14} />
                </button>

                {getPageNumbers().map((p: number | string, idx: number) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`dots-${idx}`}
                        className="px-2 text-slate-400 text-xs"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === page;
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => setPage(p as number)}
                      className={`min-w-7 h-7 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? "bg-[#0052ff] border-[#0052ff] text-white shadow-2xs font-bold"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs rounded-lg disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
}
