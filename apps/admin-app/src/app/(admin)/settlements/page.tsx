"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  CreditCard,
  Lock,
  Search,
  CheckCircle2,
  RefreshCw,
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  getSettlements,
  type SettlementItem,
  type SettlementSummary,
} from "@/services/revenue.service";
import { PayoutModal } from "./_components/PayoutModal";

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

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPayoutItem, setSelectedPayoutItem] =
    useState<SettlementItem | null>(null);
  const [settledIds, setSettledIds] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getSettlements();
      setSettlements(res.items || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error("Failed to load settlements:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleConfirmPayout = (concertId: string, refCode: string) => {
    setSettledIds((prev) => ({ ...prev, [concertId]: refCode }));
  };

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

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="head stickyhead">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1">Đối soát & Quyết toán Ban tổ chức</h1>
            <span className="htcaa-badge-count-pill">Tài chính & Escrow</span>
          </div>
          <p className="sub">
            Quản trị dòng tiền bảo chứng (Escrow), kiểm tra tài khoản ngân hàng
            và thực hiện lệnh giải ngân tiền vé cho Ban tổ chức qua VietQR
            Napas247.
          </p>
        </div>

        <div className="head-actions">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title="Tải lại danh sách đối soát"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0e54a3]" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

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
            Các sự kiện đã kết thúc an toàn, đủ điều kiện chuyển khoản cho BTC
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
            Tạm giữ trong quỹ bảo vệ khán giả cho đến khi sự kiện hoàn tất
          </p>
        </div>

        {/* Card 3: Platform Fee 5% */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Phí dịch vụ sàn (5%)</span>
            <div className="p-1.5 bg-blue-50 text-[#0e54a3] border border-blue-200 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.total_platform_fee ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Doanh thu thực của sàn Tixora thu từ phí nền tảng
          </p>
        </div>

        {/* Card 4: Total GMV */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="over">Tổng GMV vé đã bán</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl tabular-nums font-bold text-slate-900">
            {formatVND(summary?.total_gmv ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tổng giá trị đơn hàng khách hàng đã thanh toán
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo sự kiện hoặc tên BTC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-box w-full pl-9 pr-3 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="htcaa-segmented">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`htcaa-segmented-btn ${statusFilter === "ALL" ? "active" : ""}`}
              >
                Tất cả ({settlements.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("READY_FOR_SETTLEMENT")}
                className={`htcaa-segmented-btn ${
                  statusFilter === "READY_FOR_SETTLEMENT" ? "active" : ""
                }`}
              >
                Sẵn sàng giải ngân (
                {
                  settlements.filter(
                    (s) =>
                      s.settlement_status === "READY_FOR_SETTLEMENT" &&
                      !settledIds[s.concert_id],
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("HOLDING")}
                className={`htcaa-segmented-btn ${statusFilter === "HOLDING" ? "active" : ""}`}
              >
                Đang bảo chứng (
                {
                  settlements.filter(
                    (s) =>
                      s.settlement_status === "HOLDING" &&
                      !settledIds[s.concert_id],
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("COMPLETED")}
                className={`htcaa-segmented-btn ${statusFilter === "COMPLETED" ? "active" : ""}`}
              >
                Đã quyết toán ({Object.keys(settledIds).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Danh sách quyết toán sự kiện
            </h2>
            <p className="text-[11px] text-slate-500">
              Hiển thị {filteredItems.length} sự kiện theo bộ lọc hiện tại
            </p>
          </div>
        </div>

        <div className="htcaa-table-wrap">
          <table className="htcaa-table">
            <thead>
              <tr>
                <th className="w-72">Sự kiện & Ngày tổ chức</th>
                <th>Ban tổ chức & Ngân hàng</th>
                <th className="text-right">Tổng GMV</th>
                <th className="text-right">Phí sàn (5%)</th>
                <th className="text-right">Thực nhận (Net Payout)</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 text-xs"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0e54a3]" />
                    Đang tải dữ liệu đối soát...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 text-xs"
                  >
                    Không tìm thấy sự kiện nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSettled = Boolean(settledIds[item.concert_id]);
                  const refCode = settledIds[item.concert_id];
                  const isReady =
                    item.settlement_status === "READY_FOR_SETTLEMENT" &&
                    !isSettled;

                  return (
                    <tr
                      key={item.concert_id}
                      className={isReady ? "bg-amber-50/20" : ""}
                    >
                      {/* Concert */}
                      <td>
                        <div className="font-bold text-slate-900 text-xs hover:text-[#0e54a3] transition-colors">
                          {item.concert_name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatShortDate(item.start_time)}</span>
                          <span className="text-slate-300">•</span>
                          <span>{item.tickets_sold} vé đã bán</span>
                        </div>
                      </td>

                      {/* Organizer */}
                      <td>
                        <div className="text-xs font-semibold text-slate-900">
                          {item.organizer.organization_name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {item.organizer.bank_name ? (
                            <span>
                              {item.organizer.bank_name} •{" "}
                              {item.organizer.bank_account_number}
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Chưa có STK ngân hàng
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GMV */}
                      <td className="text-right tabular-nums font-semibold text-slate-800 text-xs">
                        {formatVND(item.gmv)}
                      </td>

                      {/* Platform Fee */}
                      <td className="text-right tabular-nums text-xs text-rose-600 font-medium">
                        - {formatVND(item.platform_fee)}
                      </td>

                      {/* Net Payout */}
                      <td className="text-right tabular-nums font-bold text-xs text-[#0e54a3]">
                        {formatVND(item.net_payout)}
                      </td>

                      {/* Settlement Status */}
                      <td className="text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã quyết toán
                          </span>
                        ) : item.settlement_status ===
                          "READY_FOR_SETTLEMENT" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <CheckCircle2 className="w-3 h-3" />
                            Sẵn sàng giải ngân
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Lock className="w-3 h-3" />
                            Đang bảo chứng
                          </span>
                        )}
                        {refCode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {refCode}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        {isSettled ? (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Hoàn tất
                          </span>
                        ) : isReady ? (
                          <button
                            onClick={() => setSelectedPayoutItem(item)}
                            className="btn btn-primary btn-sm inline-flex items-center gap-1 text-[11px] py-1 px-2.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Quyết toán (VietQR)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPayoutItem(item)}
                            className="btn btn-secondary btn-sm text-[11px] py-1 px-2"
                            title="Xem chi tiết tài khoản thụ hưởng"
                          >
                            <span>Xem trước lệnh</span>
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

      {/* Payout Modal */}
      {selectedPayoutItem && (
        <PayoutModal
          item={selectedPayoutItem}
          onClose={() => setSelectedPayoutItem(null)}
          onConfirmPayout={handleConfirmPayout}
        />
      )}
    </div>
  );
}
