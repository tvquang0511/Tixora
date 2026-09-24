"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import {
  X,
  Upload,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  generateBio,
  importCsv,
  getJobStatus,
  getGuestList,
  type GuestListItem,
  type BackgroundJob,
} from "@/services/worker.service";

interface ConcertWorkerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concert: {
    id: string;
    title: string;
    venue: string;
    date: string;
  } | null;
}

export function ConcertWorkerDrawer({
  isOpen,
  onClose,
  concert,
}: ConcertWorkerDrawerProps) {
  const { success, error: toastError } = useToast();

  // Guest List Import Job State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importJob, setImportJob] = useState<BackgroundJob | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bioJob, setBioJob] = useState<BackgroundJob | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Guest List Table State
  const [guests, setGuests] = useState<GuestListItem[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [isGuestsLoading, setIsGuestsLoading] = useState(false);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestScanStatus, setGuestScanStatus] = useState("All");
  const [guestPage, setGuestPage] = useState(1);
  const [guestLimit, setGuestLimit] = useState(10);
  const [guestTotalPages, setGuestTotalPages] = useState(1);

  // Polling intervals refs
  const importIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean intervals on unmount
  useEffect(() => {
    return () => {
      if (importIntervalRef.current) clearInterval(importIntervalRef.current);
      if (bioIntervalRef.current) clearInterval(bioIntervalRef.current);
    };
  }, []);

  // Fetch guest list
  const fetchGuests = async () => {
    if (!concert?.id) return;
    setIsGuestsLoading(true);
    try {
      const scanParam =
        guestScanStatus === "All" ? undefined : guestScanStatus === "SCANNED";

      const res = await getGuestList(concert.id, {
        page: guestPage,
        limit: guestLimit,
        search: guestSearch || undefined,
        category: undefined,
        is_scanned: scanParam,
      });

      setGuests(res.data);
      setTotalGuests(res.meta.total);
      setGuestTotalPages(res.meta.totalPages);
    } catch (err) {
      console.error("Failed to load guest list:", err);
    } finally {
      setIsGuestsLoading(false);
    }
  };

  // Load data when drawer opens or page/search/limit changes
  useEffect(() => {
    if (isOpen && concert) {
      const timer = setTimeout(() => {
        void fetchGuests();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, concert, guestPage, guestLimit, guestSearch, guestScanStatus]);

  // Handle CSV Import
  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concert?.id || !csvFile) return;

    setIsImporting(true);
    setImportJob(null);

    try {
      const job = await importCsv(concert.id, csvFile);
      setImportJob(job);
      pollImportJob(job.id);
    } catch (err: unknown) {
      toastError(
        err instanceof Error
          ? err.message
          : "Đăng tải danh sách khách mời thất bại.",
      );
      setIsImporting(false);
    }
  };

  // Poll CSV Import Job Status
  const pollImportJob = (jobId: string) => {
    if (importIntervalRef.current) clearInterval(importIntervalRef.current);

    const checkStatus = async () => {
      try {
        const job = await getJobStatus(jobId);
        setImportJob(job);

        if (job.status === "COMPLETED") {
          if (importIntervalRef.current)
            clearInterval(importIntervalRef.current);
          setIsImporting(false);
          setCsvFile(null);
          setGuestPage(1);
          success("Đăng tải và nhập danh sách khách mời thành công!");
          void fetchGuests();
        } else if (job.status === "FAILED") {
          if (importIntervalRef.current)
            clearInterval(importIntervalRef.current);
          setIsImporting(false);
          toastError(
            job.error_message || "Tiến trình nhập danh sách thất bại.",
          );
        }
      } catch (err) {
        console.error("Failed to check import job status:", err);
      }
    };

    void checkStatus();
    importIntervalRef.current = setInterval(checkStatus, 2000);
  };

  const pollBioJob = (jobId: string) => {
    if (bioIntervalRef.current) clearInterval(bioIntervalRef.current);
    const checkStatus = async () => {
      try {
        const job = await getJobStatus(jobId);
        setBioJob(job);
        if (job.status === "COMPLETED" || job.status === "FAILED") {
          if (bioIntervalRef.current) clearInterval(bioIntervalRef.current);
          setIsGeneratingBio(false);
          if (job.status === "COMPLETED") {
            setPdfFile(null);
            success("AI Bio đã được tạo và lưu vào sự kiện.");
          } else {
            toastError(job.error_message || "Tạo AI Bio thất bại.");
          }
        }
      } catch (err) {
        console.error("Failed to check AI Bio job status:", err);
      }
    };
    void checkStatus();
    bioIntervalRef.current = setInterval(checkStatus, 2000);
  };

  const handleBioSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!concert?.id || !pdfFile) return;
    setIsGeneratingBio(true);
    setBioJob(null);
    try {
      const response = await generateBio(concert.id, pdfFile);
      const initialJob: BackgroundJob = {
        id: response.job_id,
        trigger_by_user_id: "",
        job_type: "GENERATE_BIO",
        target_id: concert.id,
        status: response.status,
        progress_percentage: 0,
        payload: null,
        error_message: null,
        result_data: null,
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      setBioJob(initialJob);
      pollBioJob(response.job_id);
      success("Đã xếp tác vụ AI Bio vào hàng đợi. Bạn có thể đóng cửa sổ này.");
    } catch (err) {
      setIsGeneratingBio(false);
      toastError(
        err instanceof Error ? err.message : "Không thể tạo tác vụ AI Bio.",
      );
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (guestTotalPages <= 5) {
      for (let i = 1; i <= guestTotalPages; i++) pages.push(i);
    } else {
      if (guestPage <= 2) {
        pages.push(1, 2, 3, "...", guestTotalPages);
      } else if (guestPage >= guestTotalPages - 1) {
        pages.push(
          1,
          "...",
          guestTotalPages - 2,
          guestTotalPages - 1,
          guestTotalPages,
        );
      } else {
        pages.push(1, "...", guestPage, "...", guestTotalPages);
      }
    }
    return pages;
  };

  if (!isOpen || !concert) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body text-xs">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-300 flex flex-col shadow-xl relative rounded-none">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between select-none bg-white">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                Tác vụ sự kiện
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sự kiện:{" "}
                <span className="font-semibold text-slate-800">
                  {concert.title}
                </span>{" "}
                • {concert.venue}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-none hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            <div className="space-y-6">
              {/* AI Bio generator */}
              <section className="space-y-4 rounded-none border border-slate-200 bg-white p-5 shadow-none">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-slate-100 border border-slate-300 text-slate-800">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tạo AI Bio từ Press Kit
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 leading-normal">
                      PDF sẽ được đưa vào hàng đợi. Worker tự cập nhật nội dung
                      sự kiện, kể cả khi bạn đóng trang.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleBioSubmit} className="space-y-3">
                  <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-none border border-dashed border-slate-300 bg-slate-50 px-4 transition hover:border-slate-500 hover:bg-white">
                    <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                    <span className="min-w-0 text-xs text-slate-600">
                      {pdfFile ? (
                        <strong className="block truncate text-slate-900">
                          {pdfFile.name}
                        </strong>
                      ) : (
                        "Chọn Press Kit định dạng PDF"
                      )}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      disabled={isGeneratingBio}
                      onChange={(event) =>
                        setPdfFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!pdfFile || isGeneratingBio}
                    className="flex w-full items-center justify-center gap-2 rounded-none bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 border border-slate-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingBio ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý tác vụ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Tạo AI Bio
                      </>
                    )}
                  </button>
                </form>
                {bioJob && (
                  <div className="space-y-2 rounded-none border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600">
                        Tác vụ {bioJob.id.slice(0, 8)}…
                      </span>
                      <strong
                        className={
                          bioJob.status === "COMPLETED"
                            ? "text-emerald-700"
                            : bioJob.status === "FAILED"
                              ? "text-rose-700"
                              : "text-amber-700"
                        }
                      >
                        {bioJob.status}
                      </strong>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-none bg-slate-200">
                      <div
                        className="h-full bg-slate-900 transition-[width] duration-500"
                        style={{ width: `${bioJob.progress_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {bioJob.status === "PENDING" ||
                      bioJob.status === "PROCESSING"
                        ? "Bạn có thể đóng drawer; tác vụ vẫn tiếp tục trong nền."
                        : bioJob.status === "COMPLETED"
                          ? "Bio mới đã được lưu trực tiếp vào sự kiện."
                          : bioJob.error_message}
                    </p>
                  </div>
                )}
              </section>

              {/* Guest List CSV Import */}
              <div className="bg-white rounded-none p-5 border border-slate-200 space-y-4 shadow-none">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 select-none">
                  <Upload className="w-4 h-4 text-slate-700" />
                  Nhập danh sách khách mời từ file CSV
                </h4>
                <p className="text-xs text-slate-500 select-none">
                  Tải lên tệp CSV chứa các cột bắt buộc:{" "}
                  <code className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-none font-mono text-[10px]">
                    email
                  </code>
                  ,{" "}
                  <code className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-none font-mono text-[10px]">
                    full_name
                  </code>
                  , và{" "}
                  <code className="bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-none font-mono text-[10px]">
                    ticket_category
                  </code>
                  .
                </p>

                <form onSubmit={handleCsvSubmit} className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-none cursor-pointer bg-slate-50 hover:bg-white hover:border-slate-500 transition-colors relative">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500 text-center px-4">
                          {csvFile ? (
                            <span className="font-semibold text-slate-900">
                              {csvFile.name}
                            </span>
                          ) : (
                            "Click để chọn file hoặc kéo thả tệp CSV vào đây"
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            setCsvFile(e.target.files[0]);
                        }}
                        disabled={isImporting}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!csvFile || isImporting}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-none border border-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang đăng tải danh sách...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Tải danh sách khách mời lên
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Import Job Progress */}
              {importJob && (
                <div className="p-4 rounded-none border border-slate-200 bg-white space-y-3 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">
                      Mã tác vụ: {importJob.id.slice(0, 8)}...
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-none border uppercase ${
                        importJob.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : importJob.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                      }`}
                    >
                      {importJob.status}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-none h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full transition-all duration-500"
                      style={{ width: `${importJob.progress_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                    <span>Tiến trình: {importJob.progress_percentage}%</span>
                    {importJob.status === "COMPLETED" &&
                      importJob.result_data && (
                        <span className="text-emerald-700 font-semibold">
                          Đã thêm:{" "}
                          {String(importJob.result_data.processed || 0)} khách
                          mời
                        </span>
                      )}
                    {importJob.error_message && (
                      <span className="text-rose-700 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {importJob.error_message}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Guest Table Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm khách mời theo tên hoặc email..."
                      value={guestSearch}
                      onChange={(e) => {
                        setGuestSearch(e.target.value);
                        setGuestPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 bg-white rounded-none text-xs text-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={guestScanStatus}
                      onChange={(e) => {
                        setGuestScanStatus(e.target.value);
                        setGuestPage(1);
                      }}
                      className="px-3 py-1.5 border border-slate-300 bg-white rounded-none text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                    >
                      <option value="All">Tất cả trạng thái check-in</option>
                      <option value="SCANNED">Đã check-in</option>
                      <option value="NOT_SCANNED">Chưa check-in</option>
                    </select>
                  </div>
                </div>

                {/* Guests Table */}
                <div className="border border-slate-200 rounded-none overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none font-mono">
                          <th className="px-3.5 py-2.5">Khách mời</th>
                          <th className="px-3.5 py-2.5">Hạng vé</th>
                          <th className="px-3.5 py-2.5 text-center">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {isGuestsLoading ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-8 text-center select-none text-slate-500 font-mono"
                            >
                              <Loader2 className="w-5 h-5 animate-spin text-slate-900 mx-auto mb-2" />
                              Đang tải danh sách khách mời...
                            </td>
                          </tr>
                        ) : guests.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-8 text-center text-slate-400 select-none font-mono"
                            >
                              Không tìm thấy khách mời nào.
                            </td>
                          </tr>
                        ) : (
                          guests.map((g) => (
                            <tr
                              key={g.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-3.5 py-2.5">
                                <p className="font-semibold text-slate-900">
                                  {g.full_name}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5 select-all font-mono">
                                  {g.email}
                                </p>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-[10px] font-semibold text-slate-700 select-all">
                                {g.ticket_category}
                              </td>
                              <td className="px-3.5 py-2.5 text-center select-none">
                                <span
                                  className={`inline-flex px-1.5 py-0.5 rounded-none font-mono text-[9px] font-bold uppercase tracking-wider border ${
                                    g.is_scanned
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : "bg-slate-100 text-slate-700 border-slate-300"
                                  }`}
                                >
                                  {g.is_scanned ? "Đã soát vé" : "Chưa soát"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {!isGuestsLoading && guests.length > 0 && (
                    <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs select-none">
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Tổng số: {totalGuests} khách mời
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">
                            Hiển thị:
                          </span>
                          <select
                            value={guestLimit}
                            onChange={(e) => {
                              setGuestLimit(Number(e.target.value));
                              setGuestPage(1);
                            }}
                            className="px-1.5 py-0.5 border border-slate-300 bg-white rounded-none text-[10px] font-mono font-semibold cursor-pointer focus:outline-none"
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
                          disabled={guestPage === 1}
                          onClick={() =>
                            setGuestPage((p) => Math.max(1, p - 1))
                          }
                          className="p-1 rounded-none border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex gap-1">
                          {getPageNumbers().map((p, idx) => {
                            if (p === "...") {
                              return (
                                <span
                                  key={`ellipsis-${idx}`}
                                  className="px-2 py-1 text-[10px] text-slate-400 font-bold self-center font-mono"
                                >
                                  ...
                                </span>
                              );
                            }
                            return (
                              <button
                                key={`page-${p}`}
                                onClick={() => setGuestPage(Number(p))}
                                className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                                  guestPage === p
                                    ? "bg-slate-900 border-slate-900 text-white"
                                    : "border-slate-300 hover:border-slate-900 text-slate-700 bg-white"
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={guestPage === guestTotalPages}
                          onClick={() =>
                            setGuestPage((p) =>
                              Math.min(guestTotalPages, p + 1),
                            )
                          }
                          className="p-1 rounded-none border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
