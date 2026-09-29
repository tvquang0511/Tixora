"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { formatConcertCurrency } from "@/services/concert.service";
import { type RecentOrder } from "@/services/dashboard.service";
import { StatusBadge } from "../../_components/StatusBadge";

interface RecentOrdersListProps {
  filteredOrders: RecentOrder[];
  isLoadingOrders: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export function RecentOrdersList({
  filteredOrders,
  isLoadingOrders,
  searchQuery,
  onSearchChange,
}: RecentOrdersListProps) {
  return (
    <aside className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs flex flex-col min-h-[380px] max-h-[480px]">
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-900 leading-tight">
            Đơn hàng gần đây
          </h3>
          <Link
            href="/orders"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors duration-75"
          >
            Tất cả →
          </Link>
        </div>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="pl-8 pr-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-sans text-xs w-full transition-colors duration-75 text-slate-900 placeholder:text-slate-400"
            placeholder="Tìm mã đơn, khách hàng..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5 overflow-y-auto grow pr-0.5">
        {isLoadingOrders ? (
          <div className="py-12 text-center text-slate-500 font-sans text-xs flex items-center justify-center gap-2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <span>Đang tải danh sách đơn...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-sans text-xs">
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.order_id}
              className="p-2.5 bg-slate-50/60 rounded border border-slate-100 flex flex-col gap-1 hover:bg-slate-100/70 transition-colors duration-75"
            >
              <div className="flex justify-between items-center">
                <StatusBadge status={order.status} variant="order" size="xs" />
                <span className="font-mono text-[11px] tabular-nums text-slate-600 font-medium">
                  {order.ticket_count} vé
                </span>
              </div>
              <div>
                <h4
                  className="font-sans text-xs font-semibold text-slate-900 truncate"
                  title={order.customer_name}
                >
                  {order.customer_name}
                </h4>
                <p
                  className="font-sans text-[11px] text-slate-500 truncate"
                  title={order.concert_name}
                >
                  {order.concert_name}
                </p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 text-[11px]">
                <span className="text-slate-500 font-mono text-[10px] truncate max-w-[130px]">
                  #{order.order_id.slice(-8)}
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums text-xs">
                  {formatConcertCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
