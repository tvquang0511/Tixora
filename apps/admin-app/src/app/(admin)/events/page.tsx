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
} from "lucide-react";

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
    bg: "bg-teal-50 hover:bg-teal-100/90",
    text: "text-teal-800",
    border: "border-teal-300",
    dot: "bg-teal-500",
  },
  DRAFT: {
    bg: "bg-slate-100 hover:bg-slate-200/90",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-500",
  },
  COMPLETED: {
    bg: "bg-teal-50 hover:bg-teal-100/90",
    text: "text-teal-800",
    border: "border-teal-300",
    dot: "bg-teal-600",
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
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Sự kiện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị danh mục sự kiện, kiểm soát trạng thái phát hành và phân bổ
            vé.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchConcerts()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            title="Tải lại danh sách mà không reset trang"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
          <Link
            href="/assignments"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors"
            title="Quản lý và phân công cổng soát vé"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Phân công soát vé</span>
          </Link>
          <button
            onClick={handleExport}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <Link
            href="/create-event"
            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 font-medium text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo sự kiện mới</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs space-y-2.5">
        {/* Quick Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { key: "All", label: "Tất cả" },
            { key: "PENDING_REVIEW", label: "Chờ sàn duyệt" },
            { key: "PUBLISHED", label: "Đang mở bán" },
            { key: "PAUSED", label: "Tạm ngưng" },
            { key: "DRAFT", label: "Bản nháp" },
            { key: "COMPLETED", label: "Hoàn tất" },
            { key: "CANCELLED", label: "Đã hủy" },
          ].map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors duration-75 cursor-pointer ${
                  isSelected
                    ? tab.key === "PENDING_REVIEW"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-teal-700 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors duration-75"
              placeholder="Tìm theo tên sự kiện, ID, địa điểm..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-md text-xs font-medium text-slate-700 cursor-pointer shadow-2xs focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="All">Tất cả thể loại</option>
              <option value="CONCERT">Live Concert</option>
              <option value="LIVE_MUSIC">Nhạc Sống & Band</option>
              <option value="FESTIVAL">Festival & Lễ hội</option>
              <option value="THEATER_ARTS">Sân khấu & Kịch</option>
              <option value="FANMEETING">Fan Meeting</option>
              <option value="WORKSHOP">Hội thảo & Workshop</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
              setCategoryFilter("All");
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors duration-75 shadow-2xs shrink-0"
            title="Đặt lại bộ lọc"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Table Data Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-visible">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2">Sự kiện</th>
                <th className="px-3 py-2">Đơn vị tổ chức</th>
                <th className="px-3 py-2">Thời gian & Địa điểm</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-teal-600" />
                      <p className="text-xs">Đang tải dữ liệu sự kiện...</p>
                    </div>
                  </td>
                </tr>
              ) : concerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
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
                  const validTransitions =
                    VALID_STATUS_TRANSITIONS[concert.status] || [];

                  return (
                    <tr
                      key={concert.id}
                      onClick={() => setEditingConcertId(concert.id)}
                      className="hover:bg-slate-50/80 transition-colors duration-75 cursor-pointer group"
                      title="Bấm vào hàng để mở bảng chỉnh sửa sự kiện"
                    >
                      {/* Event Column */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 border border-slate-200 bg-slate-100 shrink-0 bg-cover bg-center rounded shadow-2xs group-hover:ring-2 group-hover:ring-teal-500 transition-all"
                            style={{
                              backgroundImage: `url('${getConcertPosterUrl(concert.posterUrl)}')`,
                            }}
                          />
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                              {concert.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              ID: {concert.id.slice(0, 8)}... (Bấm để sửa)
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Organizer Column */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {concert.organizer_name &&
                        concert.organizer_name !== "Tixora Official" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {concert.organizer_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                            Tixora Official
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-mono tabular-nums text-xs font-medium text-slate-900">
                          {concert.date} {concert.time}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {concert.venue || concert.city || "Chưa cập nhật"}
                        </div>
                      </td>

                      {/* Status Column with clear interactive affordance */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div
                          className="relative inline-block text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {updatingStatusId === concert.id ? (
                            <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium px-3 py-1.5">
                              <RotateCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                              Đang lưu...
                            </span>
                          ) : validTransitions.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusDropdownId((prev) =>
                                  prev === concert.id ? null : concert.id,
                                );
                              }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group/status hover:scale-[1.02] active:scale-[0.98] ${
                                CONCERT_STATUS_STYLES[concert.status]?.bg ||
                                "bg-slate-100 hover:bg-slate-200/90"
                              } ${
                                CONCERT_STATUS_STYLES[concert.status]?.text ||
                                "text-slate-700"
                              } ${
                                CONCERT_STATUS_STYLES[concert.status]?.border ||
                                "border-slate-300"
                              }`}
                              title="Bấm để mở danh mục đổi trạng thái sự kiện"
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  CONCERT_STATUS_STYLES[concert.status]?.dot ||
                                  "bg-current"
                                }`}
                              />
                              <span>
                                {STATUS_LABELS[concert.status] ||
                                  concert.status}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover/status:opacity-100 group-hover/status:translate-y-0.5 transition-all ml-0.5" />
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none ${
                                CONCERT_STATUS_STYLES[concert.status]?.bg ||
                                "bg-slate-100"
                              } ${
                                CONCERT_STATUS_STYLES[concert.status]?.text ||
                                "text-slate-700"
                              } ${
                                CONCERT_STATUS_STYLES[concert.status]?.border ||
                                "border-slate-300"
                              }`}
                              title="Trạng thái kết thúc, không thể thay đổi"
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  CONCERT_STATUS_STYLES[concert.status]?.dot ||
                                  "bg-current"
                                }`}
                              />
                              <span>
                                {STATUS_LABELS[concert.status] ||
                                  concert.status}
                              </span>
                            </span>
                          )}

                          {/* Sleek status change popup menu */}
                          {openStatusDropdownId === concert.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusDropdownId(null);
                                }}
                              />
                              <div
                                className="absolute z-40 left-1/2 -translate-x-1/2 mt-1.5 w-48 bg-white border border-slate-200/90 rounded-xl shadow-xl ring-1 ring-black/5 p-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Chuyển trạng thái
                                </div>
                                <div className="space-y-0.5 mt-0.5">
                                  {validTransitions.map((nextSt) => {
                                    const style = CONCERT_STATUS_STYLES[
                                      nextSt
                                    ] || {
                                      dot: "bg-slate-400",
                                    };
                                    return (
                                      <button
                                        key={nextSt}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenStatusDropdownId(null);
                                          requestStatusChange(
                                            concert.id,
                                            concert.title,
                                            concert.status,
                                            nextSt,
                                          );
                                        }}
                                        className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 text-left text-xs font-medium transition-colors cursor-pointer group/item"
                                      >
                                        <span
                                          className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}
                                        />
                                        <span className="text-slate-700 group-hover/item:text-slate-900 font-semibold">
                                          {STATUS_LABELS[nextSt] || nextSt}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Action Column - EXACTLY 2 Actions: Phân công and AI */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/assignments?concertId=${concert.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 rounded-lg shadow-2xs transition-colors"
                            title="Phân công nhân sự soát vé theo cổng"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-sky-600" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkerConcert(concert);
                              setIsWorkerDrawerOpen(true);
                            }}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Tác vụ AI & Danh sách khách"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <span>
                Trang <strong className="text-slate-900">{page}</strong> trên{" "}
                <strong className="text-slate-900">{totalPages}</strong> (Tổng:{" "}
                <strong className="text-slate-900">{totalItems}</strong> sự
                kiện)
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
                        ? "bg-teal-600 border-teal-600 text-white shadow-2xs"
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
      </div>

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
                  <span className="font-semibold text-teal-600">
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
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
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
              <span className="font-semibold text-teal-700">
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
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void confirmStatusChange()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
