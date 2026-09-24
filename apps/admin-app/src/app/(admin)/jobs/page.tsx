"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Cpu,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  getBackgroundJobs,
  type BackgroundJobWithMeta,
  type BackgroundJobsListResponse,
} from "@/services/worker.service";

// ── Display maps ────────────────────────────────────────────────
const JOB_TYPE_MAP: Record<string, { label: string; className: string }> = {
  GENERATE_BIO: {
    label: "Tạo Bio AI",
    className: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  GUEST_LIST_IMPORT: {
    label: "Import khách mời",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
};

const STATUS_MAP: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Đang chờ",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  PROCESSING: {
    label: "Đang xử lý",
    className: "bg-teal-50 text-teal-700 border border-teal-200 animate-pulse",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  COMPLETED: {
    label: "Hoàn thành",
    className: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  FAILED: {
    label: "Thất bại",
    className: "bg-rose-50 text-rose-800 border border-rose-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

// ── Utility components ──────────────────────────────────────────
function CopyIdButton({
  id,
  title = "Sao chép ID đầy đủ",
}: {
  id: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      title={title}
      className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

function ExpandableError({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > 80;
  return (
    <div className="text-rose-700 text-[11px] leading-snug font-sans">
      <span className={!expanded && isLong ? "line-clamp-2" : ""}>
        {message}
      </span>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 text-[10px] font-bold text-rose-800 hover:underline cursor-pointer"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
}

function MiniProgressBar({ value, status }: { value: number; status: string }) {
  const barColor =
    status === "COMPLETED"
      ? "bg-emerald-600"
      : status === "FAILED"
        ? "bg-rose-600"
        : status === "PROCESSING"
          ? "bg-teal-600"
          : "bg-amber-600";
  return (
    <div className="flex items-center gap-2 w-full min-w-[80px]">
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold tabular-nums text-slate-600 w-7 text-right">
        {value}%
      </span>
    </div>
  );
}

function formatDt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-1">
          {value.toLocaleString("vi-VN")}
        </p>
      </div>
      <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-700">
        {icon}
      </div>
    </div>
  );
}

function computePageNumbers(
  page: number,
  totalPages: number,
): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (page <= 3) {
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
  return pages;
}

// ── Main Page ───────────────────────────────────────────────────
export default function AdminJobsPage() {
  const [response, setResponse] = useState<BackgroundJobsListResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Auto-refresh: increment this to re-trigger the fetch effect
  const [refreshKey, setRefreshKey] = useState(0);
  const isAutoRefreshRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Main fetch effect
  useEffect(() => {
    let cancelled = false;
    const silent = isAutoRefreshRef.current;
    isAutoRefreshRef.current = false;

    async function loadJobs() {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const data = await getBackgroundJobs({
          page,
          limit,
          status: statusFilter || undefined,
          job_type: typeFilter || undefined,
          concert_id: debouncedSearch || undefined,
        });
        if (!cancelled) setResponse(data);
      } catch (err) {
        console.error("Failed to fetch background jobs:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, [page, limit, statusFilter, typeFilter, debouncedSearch, refreshKey]);

  // Auto-refresh every 5s when there are active jobs
  useEffect(() => {
    const hasActive = response?.data.some(
      (j) => j.status === "PENDING" || j.status === "PROCESSING",
    );
    if (!hasActive) return;
    const interval = setInterval(() => {
      isAutoRefreshRef.current = true;
      setRefreshKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [response]);

  const handleManualRefresh = () => {
    isAutoRefreshRef.current = false;
    setRefreshKey((k) => k + 1);
  };

  const jobs: BackgroundJobWithMeta[] = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const pending = jobs.filter((j) => j.status === "PENDING").length;
  const processing = jobs.filter((j) => j.status === "PROCESSING").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-teal-700">
            Hạ tầng &bull; Xử lý bất đồng bộ
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Hàng đợi tác vụ nền
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-0.5">
            Giám sát tiến trình các background worker: Tạo tiểu sử AI, xử lý
            danh sách khách mời
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Tải lại danh sách tác vụ"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Đang cập nhật..." : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Tổng tác vụ"
          value={meta?.total ?? 0}
          icon={<Cpu className="w-4 h-4" />}
        />
        <StatCard
          label="Đang chờ xử lý"
          value={pending}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Đang chạy"
          value={processing}
          icon={<Loader2 className="w-4 h-4" />}
        />
        <StatCard
          label="Thất bại"
          value={failed}
          icon={<XCircle className="w-4 h-4" />}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Concert ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 h-10 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 h-10"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="FAILED">Thất bại</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 h-10"
        >
          <option value="">Tất cả loại tác vụ</option>
          <option value="GENERATE_BIO">Tạo Bio AI</option>
          <option value="GUEST_LIST_IMPORT">Import khách mời</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 select-none">
                <th className="px-4 py-3">Loại tác vụ</th>
                <th className="px-4 py-3">Sự kiện</th>
                <th className="px-4 py-3">Người khởi tạo</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 w-36">Tiến độ</th>
                <th className="px-4 py-3 whitespace-nowrap">Khởi tạo</th>
                <th className="px-4 py-3 whitespace-nowrap">Hoàn thành</th>
                <th className="px-4 py-3">Lỗi phát sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-12 text-center text-xs text-slate-500"
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
                    <p>Đang tải dữ liệu tác vụ...</p>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-12 text-center text-xs text-slate-500"
                  >
                    <Cpu className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p>Không tìm thấy tác vụ nền nào phù hợp.</p>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const typeInfo = JOB_TYPE_MAP[job.job_type] ?? {
                    label: job.job_type,
                    className:
                      "bg-slate-100 text-slate-700 border border-slate-200",
                  };
                  const statusInfo = STATUS_MAP[job.status] ?? {
                    label: job.status,
                    className:
                      "bg-slate-100 text-slate-700 border border-slate-200",
                    icon: null,
                  };
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Loại + copy ID tác vụ */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${typeInfo.className}`}
                          >
                            {typeInfo.label}
                          </span>
                          <CopyIdButton id={job.id} title="Sao chép Job ID" />
                        </div>
                      </td>

                      {/* Sự kiện + copy ID sự kiện */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        {job.concert_name ? (
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/create-event?edit=${job.target_id}`}
                              className="text-slate-900 hover:text-teal-700 font-semibold line-clamp-1 text-xs transition-colors"
                              title={job.concert_name}
                            >
                              {job.concert_name}
                            </Link>
                            <CopyIdButton
                              id={job.target_id}
                              title="Sao chép Concert ID"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Người tạo */}
                      <td className="px-4 py-3.5">
                        {job.triggered_by_name ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {job.triggered_by_name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono select-all">
                              {job.triggered_by_email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Tiến trình */}
                      <td className="px-4 py-3.5 w-36">
                        <MiniProgressBar
                          value={job.progress_percentage}
                          status={job.status}
                        />
                      </td>

                      {/* Tạo lúc */}
                      <td className="px-4 py-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {formatDt(job.created_at)}
                      </td>

                      {/* Hoàn thành lúc */}
                      <td className="px-4 py-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {formatDt(job.completed_at)}
                      </td>

                      {/* Lỗi */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        {job.error_message ? (
                          <ExpandableError message={job.error_message} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && jobs.length > 0 && meta && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-600">
                Tổng {meta.total} tác vụ &bull; Trang {meta.page}/{meta.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">
                  Hiển thị:
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs font-medium cursor-pointer focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer text-slate-700 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {computePageNumbers(page, totalPages).map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs text-slate-400 font-semibold self-center"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(Number(p))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shadow-2xs ${
                      page === p
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-slate-200 hover:bg-slate-100 text-slate-800 bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer text-slate-700 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {response?.data.some(
        (j) => j.status === "PENDING" || j.status === "PROCESSING",
      ) && (
        <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-1.5 select-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
          Đang có tác vụ hoạt động — tự động làm mới mỗi 5 giây
        </p>
      )}
    </div>
  );
}
