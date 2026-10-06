"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Cpu,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Copy,
  Check,
  X,
  RotateCcw,
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
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  GUEST_LIST_IMPORT: {
    label: "Import khách mời",
    className: "bg-blue-50 text-[#0052ff] border border-blue-200",
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
    className: "bg-blue-50 text-[#0052ff] border border-blue-200",
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
          ? "bg-[#0052ff]"
          : "bg-amber-600";
  return (
    <div className="flex items-center gap-2 w-full min-w-[80px]">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-100`}
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
  if (!iso) return "-";
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
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="over">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-0.5">
          {value.toLocaleString("vi-VN")}
        </p>
      </div>
      <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[#0052ff]">
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
  const [selectedJob, setSelectedJob] = useState<BackgroundJobWithMeta | null>(
    null,
  );

  const hasActiveFilters = Boolean(search || statusFilter || typeFilter);
  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter ? 1 : 0) + (typeFilter ? 1 : 0);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setPage(1);
  };

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
    <div className="space-y-4">
      {/* Enterprise Page Header */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="htcaa-h1 m-0">Hàng đợi tác vụ nền</h1>
            <span className="htcaa-badge-count-pill">
              {(meta?.total ?? 0).toLocaleString()} tác vụ
            </span>
          </div>
          <p className="sub">
            Giám sát tiến trình các background worker: Tạo tiểu sử AI, xử lý
            danh sách khách mời
          </p>
        </div>

        <div className="head-actions flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="btn"
            title="Tải lại danh sách tác vụ"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0e54a3]" : "text-slate-500"}`}
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

      {/* Filters Toolbar Card */}
      <div className="card p-3.5 space-y-3">
        {/* Top row: Search input + Rows per page selector + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="search-box flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo Concert ID..."
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
            <span className="over text-[11px] shrink-0">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
            <span className="over text-[11px] shrink-0">Loại tác vụ:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold"
            >
              <option value="">Tất cả loại tác vụ</option>
              <option value="GENERATE_BIO">Tạo Bio AI</option>
              <option value="GUEST_LIST_IMPORT">Import khách mời</option>
            </select>
          </div>

          {/* Count info */}
          <div className="ml-auto text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {response?.data.length ?? 0}
            </strong>
            <span>trên</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {response?.meta.total ?? 0}
            </strong>
            <span>tác vụ</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="sub">
            Danh sách tác vụ nền ({(meta?.total ?? 0).toLocaleString()})
          </span>
        </div>
        <div className="htcaa-table-wrap">
          <div className="overflow-x-auto min-h-[340px]">
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Loại tác vụ</th>
                  <th>Sự kiện</th>
                  <th>Người khởi tạo</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="w-36">Tiến độ</th>
                  <th className="whitespace-nowrap">Khởi tạo</th>
                  <th className="whitespace-nowrap">Hoàn thành</th>
                  <th>Lỗi phát sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-xs text-slate-500"
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-[#0052ff] mx-auto mb-2" />
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
                        onClick={() => setSelectedJob(job)}
                        className="row-click group cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        {/* Loại + copy ID tác vụ */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${typeInfo.className}`}
                            >
                              {typeInfo.label}
                            </span>
                            <CopyIdButton id={job.id} title="Sao chép Job ID" />
                          </div>
                        </td>

                        {/* Sự kiện + copy ID sự kiện */}
                        <td className="max-w-[200px]">
                          {job.concert_name ? (
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/create-event?edit=${job.target_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-900 hover:text-[#0052ff] font-semibold line-clamp-1 text-xs transition-colors"
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
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Người tạo */}
                        <td>
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
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Tiến trình */}
                        <td className="w-36">
                          <MiniProgressBar
                            value={job.progress_percentage}
                            status={job.status}
                          />
                        </td>

                        {/* Tạo lúc */}
                        <td className="text-slate-600 font-mono tabular-nums text-[11px] whitespace-nowrap">
                          {formatDt(job.created_at)}
                        </td>

                        {/* Hoàn thành lúc */}
                        <td className="text-slate-600 font-mono tabular-nums text-[11px] whitespace-nowrap">
                          {formatDt(job.completed_at)}
                        </td>

                        {/* Lỗi */}
                        <td className="max-w-[180px]">
                          {job.error_message ? (
                            <ExpandableError message={job.error_message} />
                          ) : (
                            <span className="text-slate-400">-</span>
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
                <span className="text-xs text-slate-600 font-mono tabular-nums">
                  Tổng {meta.total} tác vụ &bull; Trang {meta.page}/
                  {meta.totalPages}
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
                    className="px-2 py-1 border border-slate-200 bg-white rounded-md text-xs font-mono cursor-pointer focus:outline-none"
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
                  className="btn btn-plain btn-sm !p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {computePageNumbers(page, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-xs text-slate-400 font-mono self-center"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      onClick={() => setPage(Number(p))}
                      className={`min-w-8 h-8 px-2 rounded-md text-xs font-mono font-medium border transition-colors cursor-pointer shadow-2xs ${
                        page === p
                          ? "bg-[#0052ff] border-[#0052ff] text-white"
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
                  className="btn btn-plain btn-sm !p-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {response?.data.some(
        (j) => j.status === "PENDING" || j.status === "PROCESSING",
      ) && (
        <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-1.5 select-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052ff]" />
          Đang có tác vụ hoạt động - tự động làm mới mỗi 5 giây
        </p>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#0e54a3]" />
                <h3 className="font-bold text-base text-slate-900">
                  Chi tiết tác vụ nền BullMQ
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Job Summary Banner */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium ${
                      JOB_TYPE_MAP[selectedJob.job_type]?.className ??
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {JOB_TYPE_MAP[selectedJob.job_type]?.label ??
                      selectedJob.job_type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      STATUS_MAP[selectedJob.status]?.className ??
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {STATUS_MAP[selectedJob.status]?.icon}
                    {STATUS_MAP[selectedJob.status]?.label ??
                      selectedJob.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <span>ID:</span>
                  <span className="font-bold text-slate-700">
                    {selectedJob.id}
                  </span>
                  <CopyIdButton id={selectedJob.id} />
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Sự kiện liên quan</span>
                  <div className="font-semibold text-slate-900">
                    {selectedJob.concert_name || "Không gắn sự kiện"}
                  </div>
                  {selectedJob.target_id && (
                    <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <span>Target ID: {selectedJob.target_id}</span>
                      <CopyIdButton id={selectedJob.target_id} />
                    </div>
                  )}
                </div>

                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Người khởi tạo</span>
                  <div className="font-semibold text-slate-900">
                    {selectedJob.triggered_by_name || "Hệ thống tự động"}
                  </div>
                  {selectedJob.triggered_by_email && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      {selectedJob.triggered_by_email}
                    </div>
                  )}
                </div>

                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Thời gian khởi tạo</span>
                  <div className="font-mono tabular-nums text-slate-700">
                    {formatDt(selectedJob.created_at)}
                  </div>
                </div>

                <div className="card p-3 space-y-1">
                  <span className="over text-[10px]">Thời gian hoàn thành</span>
                  <div className="font-mono tabular-nums text-slate-700">
                    {selectedJob.completed_at
                      ? formatDt(selectedJob.completed_at)
                      : "Chưa hoàn tất"}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="card p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="over text-[10px]">Tiến trình thực thi</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedJob.progress_percentage}%
                  </span>
                </div>
                <MiniProgressBar
                  value={selectedJob.progress_percentage}
                  status={selectedJob.status}
                />
              </div>

              {/* Error if present */}
              {selectedJob.error_message && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Chi tiết lỗi (Trace)</span>
                  </div>
                  <pre className="text-[11px] text-rose-700 font-mono whitespace-pre-wrap break-all bg-white/60 p-2 rounded border border-rose-100 max-h-40 overflow-y-auto">
                    {selectedJob.error_message}
                  </pre>
                </div>
              )}

              {/* Payload Data */}
              {selectedJob.payload && (
                <div className="space-y-1">
                  <span className="over text-[10px]">
                    Dữ liệu đầu vào (Payload)
                  </span>
                  <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Result Data */}
              {selectedJob.result_data && (
                <div className="space-y-1">
                  <span className="over text-[10px]">
                    Kết quả thực thi (Result)
                  </span>
                  <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedJob.result_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setSelectedJob(null)}
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
