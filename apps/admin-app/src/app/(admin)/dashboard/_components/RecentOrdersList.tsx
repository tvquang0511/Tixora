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
    <aside className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[400px] max-h-[500px]">
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900 leading-tight">
            Đơn hàng gần đây
          </h3>
          <Link
            href="/orders"
            className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Tất cả →
          </Link>
        </div>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans text-xs w-full transition-colors text-slate-900 placeholder:text-slate-400"
            placeholder="Tìm mã đơn, khách hàng..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto grow pr-1">
        {isLoadingOrders ? (
          <div className="py-12 text-center text-slate-500 font-sans text-xs flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Đang tải danh sách đơn...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-sans text-xs">
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.order_id}
              className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 flex flex-col gap-1.5 hover:bg-slate-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <StatusBadge status={order.status} variant="order" />
                <span className="font-sans text-[11px] text-slate-500">
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
                <span className="font-semibold text-slate-900 font-sans">
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
