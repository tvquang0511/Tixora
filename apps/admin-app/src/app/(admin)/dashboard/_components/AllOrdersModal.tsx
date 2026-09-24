"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { formatConcertCurrency } from "@/services/concert.service";
import { type AdminOrderListItem } from "@/services/order.service";
import { StatusBadge } from "../../_components/StatusBadge";

interface AllOrdersModalProps {
  isOpen: boolean;
  modalOrders: AdminOrderListItem[];
  modalPage: number;
  modalTotalPages: number;
  modalSearch: string;
  isModalLoading: boolean;
  modalStatusFilter: string;
  onClose: () => void;
  onSearchChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onStatusFilterChange: (v: string) => void;
}

export function AllOrdersModal({
  isOpen,
  modalOrders,
  modalPage,
  modalTotalPages,
  modalSearch,
  isModalLoading,
  modalStatusFilter,
  onClose,
  onSearchChange,
  onPageChange,
  onStatusFilterChange,
}: AllOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="text-xs font-semibold text-teal-700">
              Tra cứu giao dịch
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tất cả đơn hàng hệ thống
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, email, người mua..."
              value={modalSearch}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onPageChange(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-600 font-medium">
              Trạng thái:
            </span>
            <div className="relative">
              <select
                value={modalStatusFilter}
                onChange={(e) => {
                  onStatusFilterChange(e.target.value);
                  onPageChange(1);
                }}
                className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900 font-medium cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PAID">ĐÃ THANH TOÁN</option>
                <option value="PENDING">CHỜ THANH TOÁN</option>
                <option value="CANCELLED">ĐÃ HỦY</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto grow p-4">
          {isModalLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin border-2 border-teal-600 border-t-transparent rounded-full" />
              Đang tải danh sách đơn hàng...
            </div>
          ) : modalOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Không tìm thấy đơn hàng nào khớp với bộ lọc.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Sự kiện</th>
                  <th className="p-3 text-center">Số vé</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {modalOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs font-semibold text-slate-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">
                        {order.user_name || "Khách vãng lai"}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {order.user_email}
                      </p>
                    </td>
                    <td
                      className="p-3 font-medium text-slate-900 max-w-[160px] truncate"
                      title={order.concert_name}
                    >
                      {order.concert_name}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-900">
                      {order.ticket_count}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      {formatConcertCurrency(Number(order.total_amount))}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={order.status} variant="order" />
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        onClick={onClose}
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!isModalLoading && modalTotalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Trang {modalPage} / {modalTotalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={modalPage <= 1}
                onClick={() => onPageChange(Math.max(modalPage - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Trước
              </button>
              <button
                disabled={modalPage >= modalTotalPages}
                onClick={() =>
                  onPageChange(Math.min(modalPage + 1, modalTotalPages))
                }
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
