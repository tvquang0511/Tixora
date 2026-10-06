"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import {
  getDashboardSummary,
  getDashboardRecentOrders,
  type DashboardSummary,
  type RecentOrder,
} from "@/services/dashboard.service";
import {
  getOrganizerRequests,
  type OrganizerRequestItem,
} from "@/services/organizer-request.service";
import { getConcerts, type ConcertCardItem } from "@/services/concert.service";
import { getSettlements } from "@/services/revenue.service";
import { getCheckerAssignments } from "@/services/checker-assignment.service";

export default function AdminDashboardPage() {
  const router = useRouter();

  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<OrganizerRequestItem[]>([]);
  const [pendingOrgCount, setPendingOrgCount] = useState<number>(0);
  const [activeConcerts, setActiveConcerts] = useState<ConcertCardItem[]>([]);
  const [readySettlementCount, setReadySettlementCount] = useState<number>(0);
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCockpitData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, ordersRes, orgsRes, concertsRes, settleRes, assignRes] =
        await Promise.allSettled([
          getDashboardSummary(),
          getDashboardRecentOrders({ limit: 4 }),
          getOrganizerRequests({ status: "PENDING", limit: 3 }),
          getConcerts({ limit: 4 }),
          getSettlements(),
          getCheckerAssignments({ limit: 1 }),
        ]);

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value);
      }
      if (ordersRes.status === "fulfilled") {
        setRecentOrders(ordersRes.value);
      }
      if (orgsRes.status === "fulfilled") {
        setPendingOrgs(orgsRes.value.data || []);
        setPendingOrgCount(orgsRes.value.meta?.totalItems || 0);
      }
      if (concertsRes.status === "fulfilled") {
        setActiveConcerts(concertsRes.value.items || []);
      }
      if (settleRes.status === "fulfilled") {
        const readyCount =
          settleRes.value.items?.filter(
            (i) => i.settlement_status === "READY_FOR_SETTLEMENT",
          ).length || 0;
        setReadySettlementCount(readyCount);
      }
      if (assignRes.status === "fulfilled") {
        setAssignmentCount(assignRes.value.meta?.totalItems || 0);
      }
    } catch (err) {
      console.error("Failed to load cockpit data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCockpitData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCockpitData]);

  // Formatted date
  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Dynamic summary sentence
  const totalActionItems = pendingOrgCount + readySettlementCount;
  const heroSubtext = isLoading
    ? "Đang tải dữ liệu tổng quan hoạt động…"
    : totalActionItems > 0
      ? `${pendingOrgCount} hồ sơ ban tổ chức chờ xét duyệt, ${readySettlementCount} sự kiện sẵn sàng giải ngân quyết toán, ${recentOrders.length} đơn hàng mới ghi nhận.`
      : "Hệ thống đang vận hành ổn định — Toàn bộ sự kiện, cổng soát vé và giao dịch sẵn sàng.";

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // KPI pulse list
  const pulseChips = [
    {
      label: "Người dùng hệ thống",
      value: formatNumber(summary?.total_users ?? 0),
      icon: Users,
      tintBg: "#eff6ff",
      tintColor: "#0b63e5",
      path: "/users",
    },
    {
      label: "Vé phát hành",
      value: formatNumber(summary?.tickets_sold ?? 0),
      icon: Ticket,
      tintBg: "#e0f2fe",
      tintColor: "#0284c7",
      path: "/orders",
    },
    {
      label: "Sự kiện mở bán",
      value: String(summary?.published_events ?? 0),
      icon: Calendar,
      tintBg: "#ecfdf5",
      tintColor: "#059669",
      path: "/events",
    },
    {
      label: "Hồ sơ BTC chờ duyệt",
      value: String(pendingOrgCount),
      icon: Building2,
      tintBg: pendingOrgCount > 0 ? "#fef3c7" : "#f1f5f9",
      tintColor: pendingOrgCount > 0 ? "#d97706" : "#64748b",
      path: "/organizer-requests",
    },
    {
      label: "Quyết toán sẵn sàng",
      value: String(readySettlementCount),
      icon: CreditCard,
      tintBg: readySettlementCount > 0 ? "#fef2f2" : "#f1f5f9",
      tintColor: readySettlementCount > 0 ? "#e11d48" : "#64748b",
      path: "/settlements",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── HTCAA Hero Briefing Banner ── */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div>
              <span className="over text-[#0052ff] block">
                Tổng quan điều hành Tixora
              </span>
              <h1 className="hero-title">Hôm nay</h1>
              <p className="hero-sub">{heroSubtext}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hero-date">{todayFormatted}</span>
              <button
                type="button"
                onClick={() => void loadCockpitData()}
                disabled={isLoading}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 shadow-2xs"
                title="Tải lại toàn bộ dữ liệu điều hành"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0052ff]" : "text-slate-500"}`}
                />
                <span>{isLoading ? "Đang tải…" : "Làm mới"}</span>
              </button>
            </div>
          </div>

          {/* KPI Chips */}
          <div className="hero-kpis">
            {pulseChips.map((chip) => (
              <button
                type="button"
                key={chip.label}
                className="kchip"
                onClick={() => router.push(chip.path)}
                title={`Mở: ${chip.label}`}
              >
                <div className="kchip-top">
                  <span
                    className="kchip-ic"
                    style={{ background: chip.tintBg, color: chip.tintColor }}
                  >
                    <chip.icon className="w-4 h-4" />
                  </span>
                  <span className="v tabular-nums">{chip.value}</span>
                </div>
                <span className="l">{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cockpit Split Grid: Left Agenda + Right Operations Rail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Agenda Spine (Nhiệm vụ & Sự vụ hôm nay) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="agenda">
            {/* 1. DUYỆT BAN TỔ CHỨC MỚI */}
            <div className="agenda-row">
              <div className="agenda-gut">
                <span
                  className="agenda-node mile"
                  style={{
                    background: pendingOrgCount > 0 ? "#e11d48" : "#16a34a",
                  }}
                />
              </div>
              <div className="agenda-body milelabel">
                <span className="font-bold text-sm text-slate-900">
                  Hồ sơ Ban tổ chức chờ phê duyệt
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    pendingOrgCount > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {pendingOrgCount}
                </span>
              </div>
            </div>

            {pendingOrgCount === 0 ? (
              <div className="agenda-row">
                <div className="agenda-gut">
                  <span
                    className="agenda-node"
                    style={{ background: "#16a34a" }}
                  />
                </div>
                <div className="agenda-body">
                  <div className="agenda-clear">
                    <span className="agenda-clear-ic">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </span>
                    <div>
                      <div className="font-bold text-xs text-emerald-950">
                        Không có hồ sơ chờ duyệt
                      </div>
                      <div className="text-[11.5px] text-emerald-800/80 mt-0.5">
                        Tất cả yêu cầu đăng ký ban tổ chức đã được thẩm định và
                        phê duyệt xong.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {pendingOrgs.slice(0, 3).map((item) => (
                  <div key={item.id} className="agenda-row">
                    <div className="agenda-gut">
                      <span
                        className="agenda-node"
                        style={{ background: "#e11d48" }}
                      />
                    </div>
                    <div className="agenda-body">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#0052ff] shadow-2xs transition-all flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.organization_name}
                            </span>
                            <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                              MST: {item.tax_code_or_id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            Người đại diện:{" "}
                            <strong className="text-slate-700">
                              {item.user.full_name}
                            </strong>{" "}
                            ({item.user.email}) · SĐT: {item.phone_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/organizer-requests")}
                          className="btn btn-primary btn-sm shrink-0"
                        >
                          Duyệt hồ sơ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingOrgCount > 3 && (
                  <div className="agenda-row">
                    <div className="agenda-gut">
                      <span
                        className="agenda-node"
                        style={{ background: "#0b63e5" }}
                      />
                    </div>
                    <div className="agenda-body">
                      <div
                        onClick={() => router.push("/organizer-requests")}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0b63e5] cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <span className="font-semibold text-slate-700">
                          Còn {pendingOrgCount - 3} hồ sơ khác đang chờ duyệt
                        </span>
                        <span className="text-[#0b63e5] font-bold inline-flex items-center gap-1">
                          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. SỰ KIỆN HOẠT ĐỘNG & MỞ BÁN HÔM NAY */}
            <div className="agenda-row pt-2">
              <div className="agenda-gut">
                <span
                  className="agenda-node mile"
                  style={{ background: "#0b63e5" }}
                />
              </div>
              <div className="agenda-body milelabel">
                <span className="font-bold text-sm text-slate-900">
                  Sự kiện đang hoạt động & Mở bán
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {summary?.published_events ?? activeConcerts.length}
                </span>
              </div>
            </div>

            {activeConcerts.length === 0 ? (
              <div className="agenda-row">
                <div className="agenda-gut">
                  <span
                    className="agenda-node"
                    style={{ background: "#94a3b8" }}
                  />
                </div>
                <div className="agenda-body">
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Chưa có sự kiện nào đang mở bán.
                  </div>
                </div>
              </div>
            ) : (
              activeConcerts.slice(0, 3).map((concert) => (
                <div key={concert.id} className="agenda-row">
                  <div className="agenda-gut">
                    <span
                      className="agenda-node"
                      style={{ background: "#0b63e5" }}
                    />
                  </div>
                  <div className="agenda-body">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#0052ff] shadow-2xs transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {concert.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 uppercase">
                            {concert.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>{concert.venue}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">
                            {concert.date} ({concert.time})
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/events`}
                        className="btn btn-secondary btn-sm shrink-0"
                      >
                        Quản lý
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* 3. ĐƠN HÀNG GIAO DỊCH MỚI NHẤT */}
            <div className="agenda-row pt-2">
              <div className="agenda-gut">
                <span
                  className="agenda-node mile"
                  style={{ background: "#eab308" }}
                />
              </div>
              <div className="agenda-body milelabel">
                <span className="font-bold text-sm text-slate-900">
                  Đơn hàng thanh toán gần nhất
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {recentOrders.length}
                </span>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="agenda-row">
                <div className="agenda-gut">
                  <span
                    className="agenda-node"
                    style={{ background: "#94a3b8" }}
                  />
                </div>
                <div className="agenda-body">
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Chưa có giao dịch phát sinh trong phiên.
                  </div>
                </div>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.order_id} className="agenda-row">
                  <div className="agenda-gut">
                    <span
                      className="agenda-node"
                      style={{ background: "#eab308" }}
                    />
                  </div>
                  <div className="agenda-body">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#0284c7] shadow-2xs transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#0b63e5]">
                            {order.order_id.slice(0, 12)}...
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 uppercase">
                            {order.status}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {order.customer_name} ({order.customer_email})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          Sự kiện:{" "}
                          <strong className="text-slate-800">
                            {order.concert_name}
                          </strong>{" "}
                          · {order.ticket_count} vé
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-xs text-slate-900 tabular-nums">
                          {formatVND(order.total_amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Operations Rail (Giám sát vận hành & Lối tắt) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Card 1: Lịch sự kiện sắp tới */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="over text-[11px]">Lịch sự kiện</span>
                {activeConcerts.length > 0 && (
                  <span className="htcaa-badge-count-pill text-[11px] py-0 px-2">
                    {activeConcerts.length}
                  </span>
                )}
              </div>
              <Link
                href="/events"
                className="text-xs font-semibold text-[#0052ff] hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            {activeConcerts.length === 0 ? (
              <div className="sub py-6 text-center text-xs">
                Chưa có sự kiện sắp tới.
              </div>
            ) : (
              <div className="space-y-1">
                {activeConcerts.slice(0, 3).map((c) => {
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/events`)}
                      className="ev-row"
                    >
                      <div className="ev-date">
                        <div className="d">
                          {c.date ? c.date.split("/")[0] : "•"}
                        </div>
                        <div className="m">
                          {c.date && c.date.split("/")[1]
                            ? `TH${c.date.split("/")[1]}`
                            : "SHOW"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {c.venue}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Phân công cổng soát vé */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="over text-[11px]">Phân công soát vé</span>
              <span className="htcaa-badge-count-pill text-[11px] py-0 px-2">
                {assignmentCount}
              </span>
            </div>
            <p className="sub text-xs">
              Quản lý nhân viên check-in trực tại từng cổng soát vé của các sự
              kiện.
            </p>
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0052ff]" />
                <span className="font-bold text-xs text-slate-900">
                  {assignmentCount} lượt phân công
                </span>
              </div>
              <Link
                href="/assignments"
                className="btn btn-secondary btn-sm bg-white"
              >
                Cấu hình cổng
              </Link>
            </div>
          </div>

          {/* Card 3: Trạng thái đối soát tài chính */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="over text-[11px]">Đối soát & Quyết toán</span>
              <span
                className={`htcaa-badge-count-pill text-[11px] py-0 px-2 ${
                  readySettlementCount > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : ""
                }`}
              >
                {readySettlementCount} sẵn sàng
              </span>
            </div>
            <p className="sub text-xs">
              Các sự kiện kết thúc đang chờ giải ngân phần doanh thu bảo chứng
              cho Ban tổ chức.
            </p>
            <Link
              href="/settlements"
              className="btn btn-secondary btn-sm w-full inline-flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#0052ff]" />
              <span>Mở sổ đối soát tài chính</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
