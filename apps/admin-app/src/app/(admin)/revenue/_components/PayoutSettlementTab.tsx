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
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Sẵn sàng giải ngân</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.ready_for_payout ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Các sự kiện đã kết thúc an toàn, sẵn sàng chuyển khoản cho BTC
          </p>
        </div>

        {/* Card 2: Holding Escrow */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Tiền bảo chứng (Escrow)</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.holding_escrow ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tiền vé các sự kiện chưa diễn ra, được sàn giữ hộ an toàn
          </p>
        </div>

        {/* Card 3: Platform Fee */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Phí sàn Tixora (5%)</span>
            <div className="p-1.5 bg-blue-50 text-[#0052ff] border border-blue-200 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-[#0052ff]">
            {formatVND(summary?.total_platform_fee ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Khoản phí dịch vụ nền tảng thực thu từ bán vé
          </p>
        </div>

        {/* Card 4: Total GMV */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Tổng GD (GMV)</span>
            <div className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.total_gmv ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tổng tiền vé khán giả đã thanh toán trên hệ thống
          </p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="space-y-2">
        <div className="filters">
          <div className="search-box flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm tên concert, BTC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="over hidden sm:inline">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-trigger text-xs font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="READY_FOR_SETTLEMENT">Sẵn sàng quyết toán</option>
              <option value="HOLDING">Đang bảo chứng (Chưa diễn ra)</option>
              <option value="COMPLETED">Đã giải ngân</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052ff]" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Table */}
        <div className="htcaa-table-wrap">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Sự kiện & Ngày</th>
                  <th>Ban tổ chức & Tài khoản</th>
                  <th style={{ textAlign: "right" }}>Doanh số (GMV)</th>
                  <th style={{ textAlign: "right" }}>Phí sàn (5%)</th>
                  <th style={{ textAlign: "right" }}>Thực chuyển (Net)</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0052ff] mb-2" />
                      Đang tải dữ liệu đối soát...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      Không tìm thấy sự kiện nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isSettled = Boolean(settledIds[item.concert_id]);
                    const refCode = settledIds[item.concert_id];

                    return (
                      <tr key={item.concert_id} className="row-click group">
                        {/* Event */}
                        <td>
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
                        <td>
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
                        <td
                          style={{ textAlign: "right" }}
                          className="font-bold text-slate-900 font-mono tabular-nums text-xs"
                        >
                          {formatVND(item.gmv)}
                        </td>

                        {/* Platform Fee */}
                        <td
                          style={{ textAlign: "right" }}
                          className="text-rose-700 font-mono tabular-nums text-xs font-medium"
                        >
                          - {formatVND(item.platform_fee)}
                        </td>

                        {/* Net Payout */}
                        <td
                          style={{ textAlign: "right" }}
                          className="font-bold text-[#0052ff] font-mono tabular-nums text-xs"
                        >
                          {formatVND(item.net_payout)}
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: "center" }}>
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã chuyển ({refCode})</span>
                            </span>
                          ) : item.settlement_status ===
                            "READY_FOR_SETTLEMENT" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0052ff] border border-blue-200">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Sẵn sàng quyết toán</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Bảo chứng (Chờ diễn ra)</span>
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right" }}>
                          {isSettled ? (
                            <span className="text-xs text-slate-400">
                              Hoàn tất
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedPayoutItem(item)}
                              className="btn btn-primary btn-sm inline-flex items-center gap-1"
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
