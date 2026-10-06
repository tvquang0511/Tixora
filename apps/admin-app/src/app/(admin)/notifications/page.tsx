"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock3,
  Mail,
  RotateCw,
  Search,
  Ticket,
  TriangleAlert,
  X,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import {
  AdminNotification,
  getAdminNotifications,
} from "@/services/admin-notification.service";
import { Pagination } from "../_components/Pagination";

const typeMeta = {
  TICKET_PURCHASED: {
    label: "Xác nhận mua vé",
    icon: Ticket,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  CONCERT_REMINDER: {
    label: "Nhắc lịch concert",
    icon: Clock3,
    classes: "border-blue-200 bg-blue-50 text-[#0052ff]",
  },
} as const;

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-label="Đang tải thông báo">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(260px,1.3fr)_minmax(190px,1fr)_minmax(180px,1fr)_140px] gap-6 px-4 py-3"
        >
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 rounded bg-slate-200" />
            <div className="h-3 w-full max-w-80 rounded bg-slate-100" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-slate-200" />
            <div className="h-3 w-44 rounded bg-slate-100" />
          </div>
          <div className="h-3.5 w-36 rounded bg-slate-100" />
          <div className="h-3.5 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [read, setRead] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotification | null>(null);

  const hasActiveFilters = Boolean(search || type || read);
  const activeFilterCount = (search ? 1 : 0) + (type ? 1 : 0) + (read ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setType("");
    setRead("");
    setPage(1);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    void getAdminNotifications({
      page,
      limit,
      search: debouncedSearch || undefined,
      type: type || undefined,
      read: read === "" ? undefined : read === "read",
    })
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, limit, debouncedSearch, type, read, reloadKey]);

  return (
    <div className="space-y-4">
      {/* Enterprise Page Header */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1 m-0">Thông báo hệ thống</h1>
            <span className="htcaa-badge-count-pill">
              {total.toLocaleString()} thông báo
            </span>
          </div>
          <p className="sub">
            Theo dõi nhật ký thông báo xác nhận vé và nhắc lịch đã gửi cho khán
            giả
          </p>
        </div>

        <div className="head-actions flex items-center gap-2">
          <button
            onClick={() => setReloadKey((v) => v + 1)}
            disabled={loading}
            className="btn"
            title="Tải lại danh sách thông báo"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0e54a3]" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar Card */}
      <div className="card p-3.5 space-y-3">
        {/* Top row: Search input + Rows per page selector + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="search-box flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung, tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick controls: Per-page & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer"
                title="Khôi phục tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Đặt lại ({activeFilterCount})</span>
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="over text-[11px] hidden md:inline">
                Hiển thị:
              </span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="select-trigger text-xs font-semibold"
                aria-label="Số dòng mỗi trang"
              >
                <option value="10">10 dòng/trang</option>
                <option value="20">20 dòng/trang</option>
                <option value="50">50 dòng/trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom row: Filter Dropdowns & Stats */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
            <span className="over text-[11px] shrink-0">Loại thông báo:</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold"
              aria-label="Loại thông báo"
            >
              <option value="">Tất cả loại thông báo</option>
              <option value="TICKET_PURCHASED">Xác nhận mua vé</option>
              <option value="CONCERT_REMINDER">Nhắc lịch concert</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
            <span className="over text-[11px] shrink-0">Trạng thái đọc:</span>
            <select
              value={read}
              onChange={(e) => {
                setRead(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold"
              aria-label="Trạng thái đọc"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>

          {/* Count info */}
          <div className="ml-auto text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {items.length}
            </strong>
            <span>trên</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {total}
            </strong>
            <span>thông báo</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="sub">
            Danh sách nhật ký thông báo ({total.toLocaleString()})
          </span>
        </div>
        <div className="htcaa-table-wrap" aria-live="polite">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center font-sans">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <TriangleAlert size={22} />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Không thể tải thông báo
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Kết nối tới máy chủ thất bại. Vui lòng thử lại.
              </p>
              <button
                onClick={() => setReloadKey((value) => value + 1)}
                className="btn btn-primary btn-sm mt-4 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center font-sans">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
                <Mail size={22} />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Không có thông báo phù hợp
              </h2>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Thử thay đổi từ khóa hoặc bộ lọc để xem các thông báo khác.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto min-h-[340px] lg:block">
                <table className="htcaa-table">
                  <thead>
                    <tr>
                      <th>Thông báo</th>
                      <th>Khán giả</th>
                      <th>Liên kết</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {items.map((item) => {
                      const meta = typeMeta[item.type];
                      const Icon = meta.icon;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedNotification(item)}
                          className="row-click group cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <td className="max-w-md">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.classes}`}
                              >
                                <Icon size={14} />
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-600">
                                  {item.message}
                                </p>
                                <span
                                  className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.classes}`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="font-semibold text-slate-900 text-xs">
                              {item.user.full_name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                              {item.user.email}
                            </p>
                          </td>
                          <td>
                            {item.order ? (
                              <Link
                                href={`/orders/${item.order.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-semibold text-[#0052ff] hover:underline"
                              >
                                Chi tiết đơn hàng
                              </Link>
                            ) : item.concert ? (
                              <p
                                className="max-w-52 truncate text-xs text-slate-900 font-semibold"
                                title={item.concert.name}
                              >
                                {item.concert.name}
                              </p>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td>
                            {item.read_at ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Đã đọc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Chưa đọc
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-right font-mono tabular-nums text-[11px] text-slate-500">
                            {new Date(item.created_at).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-100 lg:hidden font-sans">
                {items.map((item) => {
                  const meta = typeMeta[item.type];
                  const Icon = meta.icon;
                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedNotification(item)}
                      className="space-y-2 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.classes}`}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="text-xs font-bold text-slate-900">
                              {item.title}
                            </h2>
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-slate-400" : "bg-amber-500"}`}
                            />
                          </div>
                          <p className="mt-1 text-xs leading-4 text-slate-600">
                            {item.message}
                          </p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <dt className="text-slate-500 text-[11px] font-medium">
                            Khán giả
                          </dt>
                          <dd className="truncate font-semibold text-slate-900">
                            {item.user.full_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500 text-[11px] font-medium">
                            Thời gian
                          </dt>
                          <dd className="text-slate-600 text-[11px]">
                            {new Date(item.created_at).toLocaleString("vi-VN")}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          {!loading && !error && totalPages > 0 && (
            <footer className="bg-slate-50/50 px-4 py-3 border-t border-slate-100">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
                itemLabel="thông báo"
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </footer>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#0e54a3]" />
                <h3 className="font-bold text-base text-slate-900">
                  Chi tiết nhật ký thông báo
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Type and read status */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                    typeMeta[selectedNotification.type]?.classes ??
                    "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {typeMeta[selectedNotification.type]?.label ??
                    selectedNotification.type}
                </span>

                {selectedNotification.read_at ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Đã đọc (
                    {new Date(selectedNotification.read_at).toLocaleString(
                      "vi-VN",
                    )}
                    )
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Chưa đọc
                  </span>
                )}
              </div>

              {/* Title & Message */}
              <div className="card p-3 space-y-1.5 bg-slate-50/50">
                <div className="font-bold text-sm text-slate-900">
                  {selectedNotification.title}
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>
              </div>

              {/* Recipient */}
              <div className="card p-3 space-y-1">
                <span className="over text-[10px]">Người nhận thông báo</span>
                <div className="font-semibold text-slate-900">
                  {selectedNotification.user.full_name}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {selectedNotification.user.email} &bull; ID:{" "}
                  {selectedNotification.user.id}
                </div>
              </div>

              {/* Context / Links */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Thời gian gửi</span>
                  <div className="font-mono tabular-nums text-slate-700">
                    {new Date(selectedNotification.created_at).toLocaleString(
                      "vi-VN",
                    )}
                  </div>
                </div>

                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Liên kết nghiệp vụ</span>
                  <div>
                    {selectedNotification.order ? (
                      <Link
                        href={`/orders/${selectedNotification.order.id}`}
                        className="text-[#0052ff] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        Đơn #{selectedNotification.order.id.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : selectedNotification.concert ? (
                      <div
                        className="font-semibold text-slate-900 truncate"
                        title={selectedNotification.concert.name}
                      >
                        {selectedNotification.concert.name}
                      </div>
                    ) : (
                      <span className="text-slate-400">Không có</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedNotification(null)}
                className="btn btn-secondary btn-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
