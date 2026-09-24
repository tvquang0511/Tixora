"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { formatConcertCurrency } from "@/services/concert.service";
import {
  getAdminOrders,
  type AdminOrderListItem,
} from "@/services/order.service";
import { StatusBadge } from "../_components/StatusBadge";

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
      className="p-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 rounded-none cursor-pointer shrink-0"
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
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Đơn hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt, tìm kiếm và kiểm tra tất cả các giao dịch thanh toán vé trong
            hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchOrders()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-none cursor-pointer transition-colors disabled:opacity-50"
            title="Làm mới danh sách đơn hàng"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-none flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-none bg-white text-slate-900 text-xs w-full focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
            placeholder="Tìm theo mã đơn, người mua, email..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs text-slate-600 font-medium select-none">
            Trạng thái:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-none bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-slate-900"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PAID">PAID (Đã thanh toán)</option>
            <option value="PENDING">PENDING (Chờ thanh toán)</option>
            <option value="CANCELLED">CANCELLED (Đã hủy)</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center gap-2">
              <RotateCw className="h-6 w-6 animate-spin text-slate-600" />
              <span className="text-xs">Đang tải danh sách đơn hàng...</span>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            Không tìm thấy đơn hàng nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] select-none">
                  <th className="p-3">Mã đơn hàng</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sự kiện</th>
                  <th className="p-3 text-center">Số vé</th>
                  <th className="p-3">Số tiền</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Ngày tạo</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-semibold text-slate-900 break-all">
                          {order.id.slice(0, 8)}...
                        </span>
                        <CopyButton text={order.id} />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">
                        {order.user_name || "Khách hàng ẩn danh"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.user_email || "N/A"}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-900">
                      {order.concert_name}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {order.ticket_count}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                      {formatConcertCurrency(Number(order.total_amount))}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} variant="order" />
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-none hover:bg-slate-100">
                        Chi tiết
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <span>
                Trang <strong className="text-slate-900">{page}</strong> trên{" "}
                <strong className="text-slate-900">{totalPages}</strong> (Tổng:{" "}
                <strong className="text-slate-900">{totalItems}</strong> đơn)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Hiển thị:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-slate-300 bg-white text-xs font-semibold text-slate-700 rounded-none cursor-pointer focus:outline-none"
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
                className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-none disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map((p: number | string, idx: number) => {
                if (p === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-slate-400 text-xs font-mono"
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
                    className={`px-3 py-1 text-xs font-semibold rounded-none border transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-none disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
