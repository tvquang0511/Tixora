"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  organizerRevenueService,
  OrganizerRevenueSummaryResponse,
  RevenueTrendItem,
  ConcertRevenueItem,
  OrganizerSettlementResponse,
} from "@/services/organizer-revenue.service";
import { DollarSign, Building2, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { RevenueSummaryCards } from "./_components/RevenueSummaryCards";
import { RevenueFilterBar } from "./_components/RevenueFilterBar";
import { RevenueTrendChart } from "./_components/RevenueTrendChart";
import { ConcertRevenueTable } from "./_components/ConcertRevenueTable";
import { ConcertDetailDrawer } from "./_components/ConcertDetailDrawer";

export default function OrganizerRevenuePage() {
  const { user } = useAuth();
  const { error: toastError } = useToast();

  // Filters state
  const [preset, setPreset] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Data states
  const [summary, setSummary] =
    useState<OrganizerRevenueSummaryResponse | null>(null);
  const [trendItems, setTrendItems] = useState<RevenueTrendItem[]>([]);
  const [concerts, setConcerts] = useState<ConcertRevenueItem[]>([]);
  const [settlement, setSettlement] =
    useState<OrganizerSettlementResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(
    null,
  );

  const handlePresetChange = (newPreset: "7d" | "30d" | "90d" | "all") => {
    setPreset(newPreset);
    const end = new Date();
    const start = new Date();

    if (newPreset === "7d") {
      start.setDate(end.getDate() - 7);
      setGroupBy("day");
    } else if (newPreset === "30d") {
      start.setDate(end.getDate() - 30);
      setGroupBy("day");
    } else if (newPreset === "90d") {
      start.setDate(end.getDate() - 90);
      setGroupBy("week");
    } else {
      start.setFullYear(end.getFullYear() - 1);
      setGroupBy("month");
    }

    setFromDate(start.toISOString().slice(0, 10));
    setToDate(end.toISOString().slice(0, 10));
  };

  const loadAllData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setIsTrendLoading(true);

    const params = {
      from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
      to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    };

    try {
      const [summaryRes, trendRes, concertRes, settlementRes] =
        await Promise.all([
          organizerRevenueService.getSummary(params).catch(() => null),
          organizerRevenueService
            .getTrend({ ...params, group_by: groupBy })
            .catch(() => null),
          organizerRevenueService.getByConcert(params).catch(() => null),
          organizerRevenueService.getSettlement(params).catch(() => null),
        ]);

      if (summaryRes) setSummary(summaryRes);
      if (trendRes) setTrendItems(trendRes.items || []);
      if (concertRes) setConcerts(concertRes.items || []);
      if (settlementRes) setSettlement(settlementRes);
    } catch (err: unknown) {
      console.error("Failed to load organizer revenue data", err);
      toastError("Không thể tải dữ liệu báo cáo doanh thu.");
    } finally {
      setIsLoading(false);
      setIsTrendLoading(false);
    }
  }, [user?.id, fromDate, toDate, groupBy, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAllData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAllData]);

  const formatVND = (val: number) =>
    `${new Intl.NumberFormat("vi-VN").format(val)} đ`;

  return (
    <div className="space-y-6 pb-20 font-body text-xs text-slate-200">
      {/* Page Title & Payout Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-teal-400" />
            <span>Quản Lý Doanh Thu Ban Tổ Chức</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi chi tiết số liệu bán vé, doanh thu thực nhận, đối soát và
            tăng trưởng theo từng sự kiện
          </p>
        </div>

        <Link
          href="/organizer/profile"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-teal-400 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tài khoản nhận thanh toán</span>
        </Link>
      </div>

      {/* Payout & Escrow Settlement Card */}
      {settlement && (
        <div className="p-5 rounded-3xl bg-slate-950/85 border border-slate-800/80 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Doanh thu đang tạm giữ (Escrow)
            </span>
            <div className="text-lg font-bold text-white">
              {formatVND(settlement.summary.holding_escrow)}
            </div>
            <p className="text-[10px] text-slate-500">
              Được bảo lưu an toàn cho đến khi sự kiện hoàn thành thành công
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sẵn sàng quyết toán (Ready to payout)
            </span>
            <div className="text-lg font-bold text-emerald-400">
              {formatVND(settlement.summary.ready_for_payout)}
            </div>
            <p className="text-[10px] text-slate-500">
              Từ các sự kiện đã kết thúc, tiến hành chuyển khoản định kỳ
            </p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
            <span className="text-[11px] font-semibold text-slate-400">
              Tài khoản thụ hưởng:
            </span>
            <div className="text-xs font-semibold text-white truncate">
              {settlement.organizer_profile?.bank_name || "Chưa thiết lập"} -{" "}
              {settlement.organizer_profile?.bank_account_number || "N/A"}
            </div>
            <p className="text-[10px] text-slate-400">
              Chủ TK:{" "}
              <span className="text-teal-400 font-semibold">
                {settlement.organizer_profile?.bank_account_name ||
                  "Chưa cập nhật"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <RevenueSummaryCards summary={summary} isLoading={isLoading} />

      {/* Filter and Date Range Bar */}
      <RevenueFilterBar
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        preset={preset}
        onPresetChange={handlePresetChange}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        onRefresh={() => void loadAllData()}
        isLoading={isLoading}
      />

      {/* Growth Trend Chart (Similar to Admin) */}
      <RevenueTrendChart
        trendItems={trendItems}
        isTrendLoading={isTrendLoading}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        fromDate={fromDate}
        toDate={toDate}
      />

      {/* Breakdown By Concert Table */}
      <ConcertRevenueTable
        concerts={concerts}
        isLoading={isLoading}
        onSelectConcert={(id) => setSelectedConcertId(id)}
      />

      {/* Detailed Slide-over Drawer for single concert revenue */}
      <ConcertDetailDrawer
        isOpen={selectedConcertId !== null}
        onClose={() => setSelectedConcertId(null)}
        concertId={selectedConcertId}
      />
    </div>
  );
}
