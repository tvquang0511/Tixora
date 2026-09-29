"use client";

import { useState } from "react";
import {
  Calendar,
  CreditCard,
  Lock,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  type SettlementItem,
  type SettlementSummary,
} from "@/services/revenue.service";
import { PayoutModal } from "./PayoutModal";

interface PayoutSettlementTabProps {
  settlements: SettlementItem[];
  summary: SettlementSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatShortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function PayoutSettlementTab({
  settlements,
  summary,
  isLoading,
  onRefresh,
}: PayoutSettlementTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPayoutItem, setSelectedPayoutItem] =
    useState<SettlementItem | null>(null);
  const [settledIds, setSettledIds] = useState<Record<string, string>>({});

  const filteredItems = settlements.filter((item) => {
    const matchesSearch =
      item.concert_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizer.organization_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const isActuallySettled = Boolean(settledIds[item.concert_id]);
    const currentStatus = isActuallySettled
      ? "COMPLETED"
      : item.settlement_status;

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && currentStatus === statusFilter;
  });

  const handleConfirmPayout = (concertId: string, refCode: string) => {
    setSettledIds((prev) => ({ ...prev, [concertId]: refCode }));
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Ready for Payout */}
        <div className="p-3.5 sm:p-4 bg-white rounded-lg border border-emerald-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
            <span>Sẵn sàng giải ngân</span>
            <div className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.ready_for_payout ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Các sự kiện đã kết thúc an toàn, sẵn sàng chuyển khoản cho BTC
          </p>
        </div>

        {/* Card 2: Holding Escrow */}
        <div className="p-3.5 sm:p-4 bg-white rounded-lg border border-amber-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
            <span>Tiền bảo chứng (Escrow)</span>
            <div className="p-1 bg-amber-50 text-amber-700 border border-amber-200 rounded">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.holding_escrow ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tiền vé các sự kiện chưa diễn ra, được sàn giữ hộ an toàn
          </p>
        </div>

        {/* Card 3: Platform Fee */}
        <div className="p-3.5 sm:p-4 bg-white rounded-lg border border-teal-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-teal-800 uppercase tracking-wider mb-1.5">
            <span>Doanh thu phí sàn Tixora (5%)</span>
            <div className="p-1 bg-teal-50 text-teal-700 border border-teal-200 rounded">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl tabular-nums font-bold text-teal-800">
            {formatVND(summary?.total_platform_fee ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Khoản phí dịch vụ nền tảng thực thu từ bán vé
          </p>
        </div>

        {/* Card 4: Total GMV */}
        <div className="p-3.5 sm:p-4 bg-white rounded-lg border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            <span>Tổng giá trị giao dịch (GMV)</span>
            <div className="p-1 bg-slate-50 text-slate-600 border border-slate-200 rounded">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.total_gmv ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tổng tiền vé khán giả đã thanh toán trên hệ thống
          </p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Danh sách đối soát & giải ngân sự kiện
            </h3>
            <p className="text-[11px] text-slate-500">
              Quản lý nghĩa vụ thanh toán cho các Ban tổ chức theo chu kỳ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative grow sm:grow-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Tìm tên concert, BTC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56 transition-colors duration-75"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer transition-colors duration-75"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="READY_FOR_SETTLEMENT">Sẵn sàng quyết toán</option>
              <option value="HOLDING">Đang bảo chứng (Chưa diễn ra)</option>
              <option value="COMPLETED">Đã giải ngân</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md transition-colors duration-75 cursor-pointer shadow-2xs"
              title="Tải lại dữ liệu"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Sự kiện & Ngày</th>
                <th className="py-2.5 px-3">Ban tổ chức & Tài khoản</th>
                <th className="py-2.5 px-3 text-right">Doanh số (GMV)</th>
                <th className="py-2.5 px-3 text-right">Phí sàn (5%)</th>
                <th className="py-2.5 px-3 text-right">Thực chuyển (Net)</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Đang tải dữ liệu đối soát...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy sự kiện nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSettled = Boolean(settledIds[item.concert_id]);
                  const refCode = settledIds[item.concert_id];

                  return (
                    <tr
                      key={item.concert_id}
                      className="hover:bg-slate-50/70 transition-colors duration-75"
                    >
                      {/* Event */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {item.concert_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatShortDate(item.start_time)}</span>
                          <span>• {item.tickets_sold} vé bán</span>
                        </div>
                      </td>

                      {/* Organizer & Bank */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {item.organizer.organization_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.organizer.bank_name ? (
                            <span>
                              {item.organizer.bank_name} -{" "}
                              {item.organizer.bank_account_number}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-sans">
                              Chưa có tài khoản
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GMV */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono tabular-nums text-xs">
                        {formatVND(item.gmv)}
                      </td>

                      {/* Platform Fee */}
                      <td className="py-2.5 px-3 text-right text-rose-700 font-mono tabular-nums text-xs font-medium">
                        - {formatVND(item.platform_fee)}
                      </td>

                      {/* Net Payout */}
                      <td className="py-2.5 px-3 text-right font-bold text-teal-800 font-mono tabular-nums text-xs">
                        {formatVND(item.net_payout)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã chuyển ({refCode})</span>
                          </span>
                        ) : item.settlement_status ===
                          "READY_FOR_SETTLEMENT" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-300">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Sẵn sàng quyết toán</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-300">
                            <Lock className="w-3 h-3" />
                            <span>Bảo chứng (Chờ diễn ra)</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        {isSettled ? (
                          <span className="text-xs text-slate-400">
                            Hoàn tất
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedPayoutItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors duration-75 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Quyết toán</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Action Modal */}
      <PayoutModal
        item={selectedPayoutItem}
        onClose={() => setSelectedPayoutItem(null)}
        onConfirmPayout={handleConfirmPayout}
      />
    </div>
  );
}
