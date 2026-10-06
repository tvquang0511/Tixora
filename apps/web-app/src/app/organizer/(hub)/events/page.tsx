"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getConcerts,
  ConcertCardItem,
  getConcertPosterUrl,
} from "@/services/concert.service";
import {
  Search,
  Clock,
  ExternalLink,
  RotateCw,
  Building2,
  Ticket,
  Plus,
  ChevronRight,
  ChevronLeft,
  CalendarOff,
  Layers,
  X,
} from "lucide-react";
import { CreateEventModal } from "./_components/CreateEventModal";
import {
  EventDetailDrawer,
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
} from "./_components/EventDetailDrawer";

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(
    null,
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchConcerts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const res = await getConcerts({
        organizer_id: user.id,
        page,
        limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
      });

      setConcerts(res.items || []);
      setTotalPages(res.meta?.totalPages ?? 1);
      setTotalItems(res.meta?.totalItems ?? 0);
    } catch (err: unknown) {
      console.error("Failed to load organizer events", err);
      toastError("Không thể tải danh sách sự kiện.");
    } finally {
      setIsLoading(false);
    }
  }, [user, page, limit, statusFilter, debouncedSearch, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchConcerts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchConcerts]);

  // Quick stats calculation
  const publishedCount = concerts.filter(
    (c) => c.status === "PUBLISHED",
  ).length;
  const pendingCount = concerts.filter(
    (c) => c.status === "PENDING_REVIEW",
  ).length;
  const draftCount = concerts.filter((c) => c.status === "DRAFT").length;

  return (
    <div className="space-y-6 pb-16 font-body text-xs text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sự Kiện Của Tôi</span>
            {totalItems > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                {totalItems}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý các chương trình biểu diễn, trạng thái kiểm duyệt và các
            hạng vé phát hành
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 inline-flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tạo sự kiện mới</span>
        </button>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">
              Tổng sự kiện
            </span>
            <span className="text-base font-bold text-white">{totalItems}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">
              Đang mở bán
            </span>
            <span className="text-base font-bold text-emerald-400">
              {publishedCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">
              Chờ sàn duyệt
            </span>
            <span className="text-base font-bold text-amber-400">
              {pendingCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Bản nháp</span>
            <span className="text-base font-bold text-slate-300">
              {draftCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-950/85 p-3 sm:p-4 rounded-2xl border border-slate-800/80 shadow-md">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "PUBLISHED", label: "Đang mở bán" },
            { key: "PENDING_REVIEW", label: "Chờ sàn duyệt" },
            { key: "DRAFT", label: "Bản nháp" },
            { key: "PAUSED", label: "Tạm ngưng" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-slate-800 text-teal-400 shadow-xs border border-slate-700/80"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện hoặc địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Events Table (Consistent with Admin Layout) */}
      <div className="bg-slate-950/85 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-5">SỰ KIỆN</th>
                <th className="py-3.5 px-4">TRẠNG THÁI</th>
                <th className="py-3.5 px-4">ĐỊA ĐIỂM</th>
                <th className="py-3.5 px-4">THỜI GIAN</th>
                <th className="py-3.5 px-4">VÉ / GIÁ VÉ</th>
                <th className="py-3.5 px-4">SỨC CHỨA</th>
                <th className="py-3.5 px-4 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="w-5 h-5 animate-spin text-teal-400" />
                      <p className="text-xs">Đang tải dữ liệu sự kiện...</p>
                    </div>
                  </td>
                </tr>
              ) : concerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <CalendarOff className="w-8 h-8 text-slate-700" />
                      <p className="text-xs font-medium text-slate-400">
                        Không tìm thấy sự kiện nào trong danh mục này.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tạo sự kiện ngay
                      </button>
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
                      ? Math.min(100, Math.round((registered / totalCap) * 100))
                      : 0;

                  return (
                    <tr
                      key={concert.id}
                      onClick={() => setSelectedConcertId(concert.id)}
                      className="group hover:bg-slate-900/60 transition-colors cursor-pointer"
                      title="Bấm vào để mở bảng chi tiết & chỉnh sửa sự kiện"
                    >
                      {/* SỰ KIỆN */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getConcertPosterUrl(concert.posterUrl)}
                              alt={concert.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <div className="font-bold text-white text-xs sm:text-sm group-hover:text-teal-400 transition-colors line-clamp-1">
                              {concert.title}
                            </div>
                            <div className="font-mono text-[10px] text-teal-400/90 font-medium">
                              TIX-{concert.id.slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TRẠNG THÁI */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            STATUS_BADGE_STYLES[concert.status] ||
                            "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              concert.status === "PUBLISHED"
                                ? "bg-emerald-400 animate-pulse"
                                : concert.status === "PENDING_REVIEW"
                                  ? "bg-amber-400 animate-ping"
                                  : "bg-slate-400"
                            }`}
                          />
                          {STATUS_LABELS[concert.status] || concert.status}
                        </span>
                      </td>

                      {/* ĐỊA ĐIỂM */}
                      <td className="py-4 px-4">
                        <div className="text-slate-300 font-medium line-clamp-1">
                          {concert.venue || concert.city || "Chưa cập nhật"}
                        </div>
                        {concert.city && (
                          <div className="text-[10px] text-slate-500">
                            {concert.city}
                          </div>
                        )}
                      </td>

                      {/* THỜI GIAN */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {concert.date}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {concert.time}
                        </div>
                      </td>

                      {/* VÉ / GIÁ VÉ */}
                      <td className="py-4 px-4">
                        {concert.ticketTiers &&
                        concert.ticketTiers.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400">
                              {concert.ticketTiers.length} hạng vé
                            </span>
                            <div className="text-teal-400 font-bold whitespace-nowrap">
                              Từ:{" "}
                              {(concert.minPrice || 0) === 0
                                ? "0đ (Miễn phí)"
                                : `${(concert.minPrice || 0).toLocaleString("vi-VN")} đ`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Chưa cấu hình
                          </span>
                        )}
                      </td>

                      {/* SỨC CHỨA / ĐĂNG KÝ */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-white font-mono">
                            {registered}
                          </span>
                          <span className="text-slate-500 font-mono">
                            /{totalCap} chỗ
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="bg-teal-400 h-full rounded-full transition-all"
                            style={{ width: `${capPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Đạt {capPercent}% sức chứa
                        </span>
                      </td>

                      {/* THAO TÁC / CHI TIẾT */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {concert.status === "PUBLISHED" && (
                            <a
                              href={`/concerts/${concert.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 transition-colors"
                              title="Xem trang bán vé công khai"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <div className="text-slate-500 group-hover:text-teal-400 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Hiển thị {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, totalItems)} trong tổng số {totalItems} sự
              kiện
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-white">
                Trang {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo sự kiện mới (In-place modal dialog vừa phải) */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          void fetchConcerts();
        }}
      />

      {/* Slide-over Drawer Xem Chi Tiết & Chỉnh Sửa sự kiện */}
      <EventDetailDrawer
        isOpen={selectedConcertId !== null}
        onClose={() => setSelectedConcertId(null)}
        concertId={selectedConcertId}
        onSuccess={() => {
          void fetchConcerts();
        }}
        onDeleteSuccess={(deletedId) => {
          setConcerts((prev) => prev.filter((c) => c.id !== deletedId));
          setTotalItems((prev) => Math.max(0, prev - 1));
        }}
      />
    </div>
  );
}
