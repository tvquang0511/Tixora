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
    <aside className="lg:col-span-1 card flex flex-col min-h-[380px] max-h-[480px]">
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center justify-between">
          <h3 className="over font-bold text-slate-900 leading-tight">
            Đơn hàng gần đây
          </h3>
          <Link
            href="/orders"
            className="text-xs font-semibold text-[#0052ff] hover:text-[#003ecc] transition-colors"
          >
            Tất cả →
          </Link>
        </div>
        <div className="search-box">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            placeholder="Tìm mã đơn, khách hàng..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto grow pr-0.5">
        {isLoadingOrders ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
            <span>Đang tải danh sách đơn…</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.order_id}
              className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col gap-1.5 hover:border-[#0052ff] hover:bg-white transition-all duration-150"
            >
              <div className="flex justify-between items-center">
                <StatusBadge status={order.status} variant="order" size="xs" />
                <span className="font-mono text-[11px] tabular-nums text-slate-600 font-medium">
                  {order.ticket_count} vé
                </span>
              </div>
              <div>
                <h4
                  className="text-xs font-semibold text-slate-900 truncate"
                  title={order.customer_name}
                >
                  {order.customer_name}
                </h4>
                <p
                  className="sub truncate"
                  title={order.concert_name}
                >
                  {order.concert_name}
                </p>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                <span className="font-mono text-[10px] text-[#0052ff] truncate max-w-[130px] font-medium">
                  #{order.order_id.slice(-8).toUpperCase()}
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
