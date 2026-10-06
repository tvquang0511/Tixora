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
      <div className="card w-full max-w-5xl p-0 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="text-xs font-semibold text-[#0052ff]">
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
          <div className="search-box w-full sm:w-80">
            <Search size={15} />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, email, người mua..."
              value={modalSearch}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onPageChange(1);
              }}
            />
            {modalSearch && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onPageChange(1);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-600 font-medium">
              Trạng thái:
            </span>
            <select
              value={modalStatusFilter}
              onChange={(e) => {
                onStatusFilterChange(e.target.value);
                onPageChange(1);
              }}
              className="select-trigger"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PAID">ĐÃ THANH TOÁN</option>
              <option value="PENDING">CHỜ THANH TOÁN</option>
              <option value="CANCELLED">ĐÃ HỦY</option>
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto grow p-4">
          {isModalLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin border-2 border-[#0052ff] border-t-transparent rounded-full" />
              Đang tải danh sách đơn hàng...
            </div>
          ) : modalOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Không tìm thấy đơn hàng nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="htcaa-table-wrap">
              <table className="htcaa-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sự kiện</th>
                    <th className="text-center">Số vé</th>
                    <th className="text-right">Tổng tiền</th>
                    <th className="text-center">Trạng thái</th>
                    <th>Thời gian</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {modalOrders.map((order) => (
                    <tr key={order.id} className="row-click group">
                      <td className="font-mono text-xs font-semibold text-[#0052ff]">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td>
                        <p className="font-semibold text-slate-900">
                          {order.user_name || "Khách vãng lai"}
                        </p>
                        <p className="text-slate-500 text-[11px] font-mono">
                          {order.user_email}
                        </p>
                      </td>
                      <td
                        className="font-medium text-slate-900 max-w-[160px] truncate"
                        title={order.concert_name}
                      >
                        {order.concert_name}
                      </td>
                      <td className="text-center font-semibold text-slate-900">
                        {order.ticket_count}
                      </td>
                      <td className="text-right font-semibold text-slate-900">
                        {formatConcertCurrency(Number(order.total_amount))}
                      </td>
                      <td className="text-center">
                        <StatusBadge status={order.status} variant="order" />
                      </td>
                      <td className="text-[11px] text-slate-500 font-mono">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="text-center">
                        <Link
                          href={`/orders/${order.id}`}
                          className="btn btn-secondary btn-sm cursor-pointer"
                          onClick={onClose}
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                className="btn btn-plain btn-sm disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={modalPage >= modalTotalPages}
                onClick={() =>
                  onPageChange(Math.min(modalPage + 1, modalTotalPages))
                }
                className="btn btn-plain btn-sm disabled:opacity-50"
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
