"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Ticket,
  TriangleAlert,
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
    classes: "border-purple-200 bg-purple-50 text-purple-800",
  },
} as const;

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-label="Đang tải thông báo">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(260px,1.3fr)_minmax(190px,1fr)_minmax(180px,1fr)_140px] gap-6 px-5 py-4"
        >
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
            <div className="h-3 w-full max-w-80 animate-pulse rounded-md bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-md bg-slate-200" />
            <div className="h-3 w-44 animate-pulse rounded-md bg-slate-100" />
          </div>
          <div className="h-4 w-36 animate-pulse rounded-md bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded-md bg-slate-100" />
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
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-700">
            Hệ thống &bull; Nhật ký gửi tin
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Thông báo hệ thống
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            Theo dõi nhật ký thông báo xác nhận vé và nhắc lịch đã gửi cho khán
            giả
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Tải lại danh sách thông báo"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-teal-600 ${loading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <section
        aria-label="Bộ lọc thông báo"
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung, tên hoặc email..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            aria-label="Loại thông báo"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
          >
            <option value="">Tất cả loại thông báo</option>
            <option value="TICKET_PURCHASED">Xác nhận mua vé</option>
            <option value="CONCERT_REMINDER">Nhắc lịch concert</option>
          </select>
          <select
            aria-label="Trạng thái đọc"
            value={read}
            onChange={(event) => {
              setRead(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
        </div>
      </section>

      {/* Main Table */}
      <section
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
        aria-live="polite"
      >
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
              className="mt-4 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
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
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="px-4 py-3">Thông báo</th>
                    <th className="px-4 py-3">Khán giả</th>
                    <th className="px-4 py-3">Liên kết</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {items.map((item) => {
                    const meta = typeMeta[item.type];
                    const Icon = meta.icon;
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="max-w-md px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.classes}`}
                            >
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-xs">
                                {item.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-600">
                                {item.message}
                              </p>
                              <span
                                className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.classes}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900 text-xs">
                            {item.user.full_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                            {item.user.email}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {item.order ? (
                            <Link
                              href={`/orders/${item.order.id}`}
                              className="text-xs font-semibold text-teal-700 hover:underline"
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
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {item.read_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Đã đọc
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Chưa đọc
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] text-slate-500">
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
                  <article key={item.id} className="space-y-2 p-4">
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
      </section>
    </div>
  );
}
