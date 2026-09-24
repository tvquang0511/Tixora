"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  getConcerts,
  updateConcert,
  deleteConcert,
  getConcertPosterUrl,
  type ConcertCardItem,
} from "@/services/concert.service";
import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  CalendarOff,
  Pencil,
  Eye,
  Trash2,
  Hourglass,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Send,
  Pause,
} from "lucide-react";
import { ConcertWorkerDrawer } from "./_components/ConcertWorkerDrawer";
import { StatusBadge } from "../_components/StatusBadge";

export default function AdminEventsPage() {
  const { success, error: toastError, warning } = useToast();
  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedWorkerConcert, setSelectedWorkerConcert] =
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
      });
      setConcerts(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      console.error("Failed to load concerts", error);
      toastError("Không thể tải danh sách sự kiện.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, toastError]);

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
      success(`Đã chuyển trạng thái sự kiện "${title}" sang ${newStatus}!`);
    } catch (err) {
      console.error("Failed to update status", err);
      toastError("Cập nhật trạng thái sự kiện thất bại.");
    } finally {
      setUpdatingStatusId(null);
    }
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

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setIsDeleting(id);
    setDeleteTarget(null);
    try {
      await deleteConcert(id);
      setConcerts((prev) => prev.filter((c) => c.id !== id));
      success("Xóa sự kiện thành công!");
    } catch (error) {
      console.error("Failed to delete concert", error);
      toastError("Xóa sự kiện thất bại. Sự kiện có thể đã có đơn hàng.");
    } finally {
      setIsDeleting(null);
    }
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
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-none cursor-pointer transition-colors disabled:opacity-50"
            title="Tải lại danh sách mà không reset trang"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleExport}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-none cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
          <Link
            href="/create-event"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 font-semibold text-xs rounded-none border border-slate-900 flex items-center justify-center gap-1.5 transition-colors shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo sự kiện mới</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-none flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            placeholder="Tìm theo tên sự kiện, ID, địa điểm..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-slate-900"
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="DRAFT">DRAFT (Bản nháp)</option>
            <option value="PUBLISHED">PUBLISHED (Đã mở bán)</option>
            <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
            <option value="CANCELLED">CANCELLED (Đã hủy)</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-none text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Đặt lại bộ lọc"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Table Data Container */}
      <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Sự kiện</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Địa điểm</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thay đổi trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCw className="w-5 h-5 animate-spin text-slate-600" />
                      <p className="text-xs">Đang tải dữ liệu sự kiện...</p>
                    </div>
                  </td>
                </tr>
              ) : concerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarOff className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium">
                        Không tìm thấy sự kiện nào.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                concerts.map((concert) => (
                  <tr
                    key={concert.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 border border-slate-200 bg-slate-100 shrink-0 bg-cover bg-center rounded-none"
                          style={{
                            backgroundImage: `url('${getConcertPosterUrl(concert.posterUrl)}')`,
                          }}
                        />
                        <div>
                          <div className="font-semibold text-slate-900 leading-snug">
                            {concert.title}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            ID: {concert.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {concert.date}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {concert.time}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {concert.venue}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {concert.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={concert.status} variant="concert" />
                    </td>

                    {/* Quick 1-Click Status Action Column */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {updatingStatusId === concert.id ? (
                        <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                          <RotateCw className="w-3 h-3 animate-spin" /> Đang
                          lưu...
                        </span>
                      ) : concert.status === "DRAFT" ? (
                        <button
                          onClick={() =>
                            void handleQuickStatusChange(
                              concert.id,
                              "PUBLISHED",
                              concert.title,
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-none border border-emerald-600 cursor-pointer transition-colors shadow-none"
                          title="Phát hành ngay để mở bán vé"
                        >
                          <Send className="w-3 h-3" />
                          <span>Phát hành</span>
                        </button>
                      ) : concert.status === "PUBLISHED" ? (
                        <button
                          onClick={() =>
                            void handleQuickStatusChange(
                              concert.id,
                              "DRAFT",
                              concert.title,
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[11px] rounded-none border border-slate-300 cursor-pointer transition-colors shadow-none"
                          title="Tạm ngưng về trạng thái bản nháp"
                        >
                          <Pause className="w-3 h-3 text-slate-500" />
                          <span>Tạm ngưng</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/create-event?edit=${concert.id}`}
                          className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none transition-colors"
                          title="Chỉnh sửa nội dung & vé"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/concerts/${concert.id}`}
                          target="_blank"
                          className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none transition-colors"
                          title="Xem trang công khai"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedWorkerConcert(concert);
                            setIsWorkerDrawerOpen(true);
                          }}
                          className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-none transition-colors cursor-pointer"
                          title="Tác vụ AI & Danh sách khách"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(concert.id, concert.title)
                          }
                          disabled={isDeleting === concert.id}
                          className="p-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-none transition-colors disabled:opacity-50 cursor-pointer"
                          title="Xóa sự kiện"
                        >
                          {isDeleting === concert.id ? (
                            <Hourglass className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
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
                  className="px-2 py-1 border border-slate-300 bg-white text-xs font-semibold text-slate-700 rounded-none cursor-pointer focus:outline-none"
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
                className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-none disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map((p: number | string, idx: number) => {
                if (p === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-slate-400 text-xs font-mono"
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
                    className={`px-3 py-1 text-xs font-semibold rounded-none border transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-none disabled:opacity-40 cursor-pointer transition-colors"
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

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xác nhận xóa sự kiện"
        message={`Bạn có chắc chắn muốn xóa sự kiện "${deleteTarget?.name}" không? Hành động này sẽ xóa dữ liệu và không thể hoàn tác.`}
        confirmLabel="Xóa sự kiện"
        cancelLabel="Hủy bỏ"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[250] flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-300 rounded-none max-w-md w-full p-5 shadow-lg space-y-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold rounded-none border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-semibold rounded-none bg-red-600 text-white hover:bg-red-700 border border-red-600 transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
