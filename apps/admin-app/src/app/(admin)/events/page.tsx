"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  getConcerts,
  updateConcert,
  getConcertPosterUrl,
  type ConcertCardItem,
} from "@/services/concert.service";
import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  CalendarOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  Clock,
  BarChart2,
  Layers,
  X,
} from "lucide-react";
import { StatusBadge } from "../_components/StatusBadge";

import { ConcertWorkerDrawer } from "./_components/ConcertWorkerDrawer";
import {
  ConcertEditDrawer,
  VALID_STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_WARNING_MESSAGES,
} from "./_components/ConcertEditDrawer";

const CONCERT_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  PUBLISHED: {
    bg: "bg-emerald-50 hover:bg-emerald-100/90",
    text: "text-emerald-800",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
  },
  PAUSED: {
    bg: "bg-amber-50 hover:bg-amber-100/90",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  PENDING_REVIEW: {
    bg: "bg-amber-50 hover:bg-amber-100/90",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  APPROVED: {
    bg: "bg-blue-50 hover:bg-blue-100/90",
    text: "text-[#0b63e5]",
    border: "border-blue-200",
    dot: "bg-[#0b63e5]",
  },
  DRAFT: {
    bg: "bg-slate-100 hover:bg-slate-200/90",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-500",
  },
  COMPLETED: {
    bg: "bg-blue-50 hover:bg-blue-100/90",
    text: "text-[#0b63e5]",
    border: "border-blue-200",
    dot: "bg-[#0b63e5]",
  },
  CANCELLED: {
    bg: "bg-rose-50 hover:bg-rose-100/90",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-500",
  },
  REJECTED: {
    bg: "bg-rose-50 hover:bg-rose-100/90",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-500",
  },
};

export default function AdminEventsPage() {
  const { success, error: toastError, warning } = useToast();
  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<
    string | null
  >(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{
    concertId: string;
    concertTitle: string;
    currentStatus: string;
    nextStatus: string;
  } | null>(null);
  const [selectedWorkerConcert, setSelectedWorkerConcert] =
    useState<ConcertCardItem | null>(null);
  const [selectedReviewConcert, setSelectedReviewConcert] =
    useState<ConcertCardItem | null>(null);
  const [isWorkerDrawerOpen, setIsWorkerDrawerOpen] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchConcerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getConcerts({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter === "All" ? undefined : statusFilter,
        category: categoryFilter === "All" ? undefined : categoryFilter,
      });
      setConcerts(response.items || []);
      setTotalPages(response.meta?.totalPages ?? 1);
      setTotalItems(response.meta?.totalItems ?? 0);
    } catch (error) {
      console.error("Failed to load concerts", error);
      toastError("Không thể tải danh sách sự kiện.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, categoryFilter, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchConcerts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchConcerts]);

  // Quick 1-click status change
  const handleQuickStatusChange = async (
    id: string,
    newStatus: string,
    title: string,
  ) => {
    setUpdatingStatusId(id);
    try {
      await updateConcert(id, { status: newStatus });
      setConcerts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );
      success(
        `Đã chuyển trạng thái sự kiện "${title}" sang ${STATUS_LABELS[newStatus] || newStatus}!`,
      );
    } catch (err: unknown) {
      console.error("Failed to update status", err);
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toastError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          "Cập nhật trạng thái sự kiện thất bại.",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const requestStatusChange = (
    concertId: string,
    concertTitle: string,
    currentStatus: string,
    nextStatus: string,
  ) => {
    setStatusConfirmTarget({
      concertId,
      concertTitle,
      currentStatus,
      nextStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmTarget) return;
    const { concertId, nextStatus, concertTitle } = statusConfirmTarget;
    setStatusConfirmTarget(null);
    await handleQuickStatusChange(concertId, nextStatus, concertTitle);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const handleExport = () => {
    if (concerts.length === 0) {
      warning("Không có dữ liệu để xuất.");
      return;
    }
    const headers = [
      "ID",
      "Tên sự kiện",
      "Địa điểm",
      "Thành phố",
      "Ngày",
      "Giờ",
      "Trạng thái",
    ];
    const csvContent = [
      headers.join(","),
      ...concerts.map((c) =>
        [
          c.id,
          `"${c.title}"`,
          `"${c.venue}"`,
          `"${c.city}"`,
          c.date,
          c.time,
          c.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `danh_sach_su_kien_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Page Header - HTCAA Style */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="htcaa-h1 m-0">Sự kiện</h1>
          <span className="htcaa-badge-count-pill">
            {totalItems} sự kiện ·{" "}
            {concerts.filter((c) => c.status === "PUBLISHED").length} sắp diễn
            ra
          </span>
        </div>
        <div className="head-actions flex items-center gap-2 flex-wrap">
          <button
            onClick={() => success("Đã mở cài đặt tự động hủy đơn hết hạn.")}
            className="btn"
          >
            <Clock size={14} className="text-slate-500" />
            <span>Cài đặt tự hủy đơn</span>
          </button>
          <button
            onClick={() => void fetchConcerts()}
            disabled={isLoading}
            className="btn"
            title="Tải lại danh sách"
          >
            <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Đang tải…" : "Tải lại"}</span>
          </button>
          <div className="htcaa-segmented">
            <button
              type="button"
              className={`htcaa-segmented-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              <BarChart2 size={14} />
              <span>Danh sách</span>
            </button>
            <button
              type="button"
              className={`htcaa-segmented-btn ${view === "board" ? "active" : ""}`}
              onClick={() => setView("board")}
            >
              <Layers size={14} />
              <span>Bảng</span>
            </button>
          </div>
          <Link href="/create-event" className="btn btn-primary">
            <Plus size={14} />
            <span>Tạo sự kiện</span>
          </Link>
        </div>
      </div>

      {/* HTCAA Filter Bar */}
      <div className="filters">
        <div className="search-box">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            placeholder="Tìm sự kiện theo tên hoặc địa điểm…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={String(limit)}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="select-trigger"
          style={{ width: "150px" }}
          aria-label="Số dòng mỗi trang"
        >
          <option value="10">10 dòng/trang</option>
          <option value="20">20 dòng/trang</option>
          <option value="50">50 dòng/trang</option>
        </select>
      </div>

      {/* Subtitle & Status Select Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div className="sub">Danh sách sự kiện.</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="over">Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="select-trigger"
            style={{ width: "180px" }}
            aria-label="Lọc theo trạng thái"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đang mở bán</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="PAUSED">Tạm ngưng</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
      </div>

      {/* Content View: List or Board */}
      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "DRAFT", label: "Bản nháp" },
            { key: "PENDING_REVIEW", label: "Chờ duyệt" },
            { key: "PUBLISHED", label: "Đang mở bán" },
            { key: "COMPLETED", label: "Hoàn tất" },
          ].map((col) => {
            const colConcerts = concerts.filter((c) => c.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="over font-bold">{col.label}</span>
                  <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full font-semibold text-slate-700">
                    {colConcerts.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 min-h-[160px]">
                  {colConcerts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Trống
                    </div>
                  ) : (
                    colConcerts.map((concert) => {
                      const totalCap =
                        concert.ticketTiers?.reduce(
                          (acc, t) => acc + (t.total_quantity || 0),
                          0,
                        ) || 0;
                      const remCap =
                        concert.ticketTiers?.reduce(
                          (acc, t) =>
                            acc +
                            (t.remaining_quantity ?? t.total_quantity ?? 0),
                          0,
                        ) || 0;
                      const registered =
                        totalCap > 0 ? Math.max(0, totalCap - remCap) : 0;
                      const capPercent =
                        totalCap > 0
                          ? Math.min(
                              100,
                              Math.round((registered / totalCap) * 100),
                            )
                          : 0;

                      return (
                        <div
                          key={concert.id}
                          onClick={() => setEditingConcertId(concert.id)}
                          className="card cursor-pointer hover:border-[#0052ff] hover:shadow-md transition-all p-3"
                        >
                          <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                            {concert.title}
                          </div>
                          <div className="font-mono text-[10px] text-[#0052ff] mt-0.5">
                            TIX-{concert.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-2">
                            {concert.date || "—"}
                          </div>
                          <div
                            className="cap-meter mt-2"
                            style={{ width: "100%" }}
                          >
                            <span
                              className="bar-fill"
                              style={{ width: `${capPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* HTCAA Data Table Container */
        <div className="htcaa-table-wrap">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>SỰ KIỆN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THỜI GIAN</th>
                  <th>ĐỊA ĐIỂM</th>
                  <th>VÉ / GIÁ VÉ</th>
                  <th>ĐĂNG KÝ</th>
                  <th style={{ width: 44, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RotateCw className="w-4 h-4 animate-spin text-[#0052ff]" />
                        <p className="text-xs">Đang tải dữ liệu sự kiện…</p>
                      </div>
                    </td>
                  </tr>
                ) : concerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarOff className="w-6 h-6 text-slate-300" />
                        <p className="text-xs font-medium">
                          Không tìm thấy sự kiện nào.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  concerts.map((concert) => {
                    const totalCap =
                      concert.ticketTiers?.reduce(
                        (acc, t) => acc + (t.total_quantity || 0),
                        0,
                      ) || 0;
                    const remCap =
                      concert.ticketTiers?.reduce(
                        (acc, t) =>
                          acc + (t.remaining_quantity ?? t.total_quantity ?? 0),
                        0,
                      ) || 0;
                    const registered =
                      totalCap > 0 ? Math.max(0, totalCap - remCap) : 0;
                    const capPercent =
                      totalCap > 0
                        ? Math.min(
                            100,
                            Math.round((registered / totalCap) * 100),
                          )
                        : 0;

                    return (
                      <tr
                        key={concert.id}
                        onClick={() => setEditingConcertId(concert.id)}
                        className="row-click group"
                        title="Bấm vào hàng để mở bảng chỉnh sửa sự kiện"
                      >
                        {/* Event Column */}
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>
                          <div className="font-semibold text-slate-900 group-hover:text-[#0052ff] transition-colors">
                            {concert.title}
                          </div>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "11px",
                              color: "#0052ff",
                              fontWeight: 500,
                              marginTop: 2,
                            }}
                          >
                            TIX-{concert.id.slice(0, 8).toUpperCase()}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td>
                          <StatusBadge
                            status={concert.status}
                            variant="concert"
                          />
                        </td>

                        {/* Date/Time Column */}
                        <td>
                          {concert.date ? (
                            <>
                              <div className="val-strong">{concert.date}</div>
                              <div className="row-sub">
                                {concert.time || "—"}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Venue Column */}
                        <td>
                          <div className="val-strong">
                            {concert.venue || "—"}
                          </div>
                          {concert.city && (
                            <div className="row-sub">{concert.city}</div>
                          )}
                        </td>

                        {/* Ticket Tier Prices */}
                        <td>
                          {concert.ticketTiers &&
                          concert.ticketTiers.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                              }}
                            >
                              {concert.ticketTiers.slice(0, 2).map((t) => (
                                <div
                                  key={t.id}
                                  style={{
                                    fontSize: "13px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#475569",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t.name}:{" "}
                                  </span>
                                  <span
                                    style={{
                                      color:
                                        t.price === 0 ? "#059669" : "#2563eb",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {t.price === 0
                                      ? "0đ (Miễn phí)"
                                      : `${t.price.toLocaleString("vi-VN")} đ`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              style={{ fontSize: "13px", whiteSpace: "nowrap" }}
                            >
                              <span
                                style={{ color: "#475569", fontWeight: 500 }}
                              >
                                Từ:{" "}
                              </span>
                              <span
                                style={{
                                  color:
                                    (concert.minPrice || 0) === 0
                                      ? "#059669"
                                      : "#2563eb",
                                  fontWeight: 700,
                                }}
                              >
                                {(concert.minPrice || 0) === 0
                                  ? "0đ (Miễn phí)"
                                  : `${(concert.minPrice || 0).toLocaleString("vi-VN")} đ`}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Registration Capacity */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#0f172a",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {registered}
                            <span className="text-slate-400 font-normal">
                              /{totalCap} chỗ
                            </span>
                          </div>
                          <div
                            className="cap-meter"
                            title={`${capPercent}% sức chứa`}
                          >
                            <span
                              className="bar-fill"
                              style={{ width: `${capPercent}%` }}
                            />
                          </div>
                          <div className="row-sub">{registered} xác nhận</div>
                        </td>

                        {/* Action / Detail Chevron */}
                        <td style={{ textAlign: "right", color: "#94a3b8" }}>
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/assignments?concertId=${concert.id}`}
                              className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0052ff] rounded-md transition-colors"
                              title="Phân công nhân sự soát vé theo cổng"
                            >
                              <ClipboardCheck
                                size={14}
                                className="text-[#0052ff]"
                              />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedWorkerConcert(concert);
                                setIsWorkerDrawerOpen(true);
                              }}
                              className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0052ff] rounded-md transition-colors cursor-pointer"
                              title="Tác vụ AI & Danh sách khách"
                            >
                              <Sparkles size={14} className="text-[#0052ff]" />
                            </button>
                            <ChevronRight
                              size={16}
                              className="text-slate-400 ml-1 group-hover:text-[#0052ff] group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span>
              Trang <strong className="text-slate-900">{page}</strong> trên{" "}
              <strong className="text-slate-900">{totalPages}</strong> (Tổng:{" "}
              <strong className="text-slate-900">{totalItems}</strong> sự kiện)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Hiển thị:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-slate-200 bg-white text-xs font-medium text-slate-700 rounded-lg cursor-pointer focus:outline-none shadow-2xs"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs rounded-lg disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft size={14} />
            </button>

            {getPageNumbers().map((p: number | string, idx: number) => {
              if (p === "...") {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 text-slate-400 text-xs"
                  >
                    ...
                  </span>
                );
              }
              const isCurrent = p === page;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => setPage(p as number)}
                  className={`min-w-7 h-7 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? "bg-[#0b63e5] border-[#0b63e5] text-white shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs rounded-lg disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <ConcertWorkerDrawer
        isOpen={isWorkerDrawerOpen}
        onClose={() => {
          setIsWorkerDrawerOpen(false);
          setSelectedWorkerConcert(null);
        }}
        concert={
          selectedWorkerConcert
            ? {
                id: selectedWorkerConcert.id,
                title: selectedWorkerConcert.title,
                venue: selectedWorkerConcert.venue,
                date: selectedWorkerConcert.date,
              }
            : null
        }
      />

      {/* Review Modal for PENDING_REVIEW */}
      {selectedReviewConcert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[250] flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                  Kiểm duyệt sự kiện
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedReviewConcert.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReviewConcert(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Đơn vị tổ chức:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedReviewConcert.organizer_name || "Tixora Official"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Thời gian diễn ra:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedReviewConcert.date} ({selectedReviewConcert.time})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Địa điểm:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedReviewConcert.venue ||
                      selectedReviewConcert.city ||
                      "Chưa cập nhật"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Khoảng giá vé:
                  </span>
                  <span className="font-semibold text-[#0b63e5]">
                    {selectedReviewConcert.price}
                  </span>
                </div>
              </div>

              {selectedReviewConcert.description && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">
                    Mô tả sự kiện:
                  </span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 leading-relaxed max-h-28 overflow-y-auto">
                    {selectedReviewConcert.description}
                  </p>
                </div>
              )}

              {selectedReviewConcert.ticketTiers &&
                selectedReviewConcert.ticketTiers.length > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">
                      Cấu hình vé ({selectedReviewConcert.ticketTiers.length}{" "}
                      hạng vé):
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
                      {selectedReviewConcert.ticketTiers.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-semibold text-slate-800">
                            {t.name}
                          </span>
                          <span className="text-slate-500">
                            {new Intl.NumberFormat("vi-VN").format(t.price)}đ
                            &bull; {t.total_quantity} vé
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReviewConcert(null)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedReviewConcert.id;
                    const title = selectedReviewConcert.title;
                    setSelectedReviewConcert(null);
                    requestStatusChange(
                      id,
                      title,
                      "PENDING_REVIEW",
                      "REJECTED",
                    );
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Yêu cầu sửa (Từ chối)
                </button>
                <button
                  onClick={() => {
                    const id = selectedReviewConcert.id;
                    const title = selectedReviewConcert.title;
                    setSelectedReviewConcert(null);
                    requestStatusChange(
                      id,
                      title,
                      "PENDING_REVIEW",
                      "PUBLISHED",
                    );
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0b63e5] text-white hover:bg-[#084fc2] transition-colors cursor-pointer shadow-xs"
                >
                  Phê duyệt mở bán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Quick Status Change */}
      {statusConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[260] flex items-center justify-center p-4 select-none animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận đổi trạng thái sự kiện
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái sự kiện{" "}
              <strong>&quot;{statusConfirmTarget.concertTitle}&quot;</strong> từ{" "}
              <span className="font-semibold text-slate-900">
                {STATUS_LABELS[statusConfirmTarget.currentStatus] ||
                  statusConfirmTarget.currentStatus}
              </span>{" "}
              sang{" "}
              <span className="font-semibold text-[#0052ff]">
                {STATUS_LABELS[statusConfirmTarget.nextStatus] ||
                  statusConfirmTarget.nextStatus}
              </span>{" "}
              không?
            </p>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              {STATUS_WARNING_MESSAGES[statusConfirmTarget.nextStatus] ||
                "Trạng thái sự kiện sẽ được áp dụng ngay sau khi xác nhận."}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusConfirmTarget(null)}
                className="btn btn-secondary btn-sm cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void confirmStatusChange()}
                className="btn btn-primary btn-sm cursor-pointer"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for closing open status dropdown */}
      {openStatusDropdownId && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setOpenStatusDropdownId(null)}
        />
      )}

      {/* Slide-over Concert Edit Drawer */}
      <ConcertEditDrawer
        isOpen={editingConcertId !== null}
        onClose={() => setEditingConcertId(null)}
        concertId={editingConcertId}
        onDeleteSuccess={(deletedId) => {
          setConcerts((prev) => prev.filter((c) => c.id !== deletedId));
          setTotalItems((prev: number) => Math.max(0, prev - 1));
        }}
        onSuccess={(updated) => {
          setConcerts((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? {
                    ...c,
                    title:
                      typeof updated.title === "string"
                        ? updated.title
                        : c.title,
                    status:
                      typeof updated.status === "string"
                        ? updated.status
                        : c.status,
                    venue:
                      typeof updated.venue === "string"
                        ? updated.venue
                        : c.venue,
                    date:
                      typeof updated.date === "string" ? updated.date : c.date,
                  }
                : c,
            ),
          );
        }}
      />
    </div>
  );
}
