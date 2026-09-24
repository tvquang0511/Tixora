"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  createCheckerAssignment,
  deleteCheckerAssignment,
  getAssignmentCheckers,
  getAssignmentConcerts,
  getAvailableAssignmentGates,
  getCheckerAssignments,
  updateCheckerAssignment,
} from "@/services/checker-assignment.service";
import type {
  ActiveCheckerOption,
  ActiveConcertOption,
  CheckerAssignmentItem,
  PaginationMeta,
} from "@/types/checker-assignment.types";
import { getErrorMessage } from "@/utils/error.utils";
import { Pagination } from "../_components/Pagination";
import { useToast } from "@/context/ToastContext";

const DEFAULT_META: PaginationMeta = {
  totalItems: 0,
  itemCount: 0,
  itemsPerPage: 10,
  totalPages: 0,
  currentPage: 1,
};

function formatConcertTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

interface AssignmentModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function AssignmentModal({
  title,
  description,
  isOpen,
  onClose,
  children,
}: AssignmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div>
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block font-sans">
              Phân công soát vé
            </span>
            <h3 className="font-sans text-base font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 font-sans">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg hover:bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 space-y-4 relative z-10">
        <div className="space-y-1.5 font-sans text-xs">
          <h3 className="font-sans text-sm font-semibold text-slate-900">
            {title}
          </h3>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-sans font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-sans font-medium text-white transition-colors hover:bg-rose-700 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isDeleting ? "Đang xử lý..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
          {label}
        </p>
        <p className="mt-1 font-sans text-2xl font-bold text-slate-900">
          {value}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function AdminAssignmentsPage() {
  const {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
  } = useToast();

  const [assignments, setAssignments] = useState<CheckerAssignmentItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [concerts, setConcerts] = useState<ActiveConcertOption[]>([]);
  const [checkers, setCheckers] = useState<ActiveCheckerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [concertFilter, setConcertFilter] = useState("");
  const [checkerFilter, setCheckerFilter] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCreateGates, setIsLoadingCreateGates] = useState(false);
  const [createGates, setCreateGates] = useState<number[]>([]);
  const [createConcertId, setCreateConcertId] = useState("");
  const [createCheckerId, setCreateCheckerId] = useState("");
  const [createGateNumber, setCreateGateNumber] = useState("");

  const [editTarget, setEditTarget] = useState<CheckerAssignmentItem | null>(
    null,
  );
  const [editGateNumber, setEditGateNumber] = useState("");
  const [editGates, setEditGates] = useState<number[]>([]);
  const [isLoadingEditGates, setIsLoadingEditGates] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CheckerAssignmentItem | null>(null);

  const concertMap = useMemo(
    () => new Map(concerts.map((concert) => [concert.id, concert])),
    [concerts],
  );

  const selectedConcertForCreate = useMemo(
    () => (createConcertId ? concertMap.get(createConcertId) : undefined),
    [concertMap, createConcertId],
  );

  const summaryItems = [
    {
      label: "Tổng phân công",
      value: meta.totalItems.toString(),
      icon: ClipboardCheck,
    },
    {
      label: "Tổng số sự kiện",
      value: concerts.length.toString(),
      icon: CalendarDays,
    },
    {
      label: "Nhân viên soát vé",
      value: checkers.length.toString(),
      icon: UserRound,
    },
    {
      label: "Kết quả lọc",
      value: meta.itemCount.toString(),
      icon: ShieldCheck,
    },
  ];

  const loadBootstrapData = useCallback(async () => {
    const [concertData, checkerData] = await Promise.all([
      getAssignmentConcerts(),
      getAssignmentCheckers(),
    ]);

    return { concertData, checkerData };
  }, []);

  const loadAssignments = useCallback(
    async (
      nextPage: number,
      nextLimit: number,
      nextConcertFilter: string,
      nextCheckerFilter: string,
    ) => {
      return getCheckerAssignments({
        page: nextPage,
        limit: nextLimit,
        concert_id: nextConcertFilter || undefined,
        checker_id: nextCheckerFilter || undefined,
      });
    },
    [],
  );

  // Bootstrap Page Data
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setBootstrapping(true);
      try {
        const { concertData, checkerData } = await loadBootstrapData();
        if (!active) return;
        setConcerts(concertData);
        setCheckers(checkerData);
      } catch (error: unknown) {
        if (!active) return;
        toastError(getErrorMessage(error));
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [loadBootstrapData, toastError]);

  // Load Paginated Assignments List
  useEffect(() => {
    let active = true;

    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await loadAssignments(
          page,
          limit,
          concertFilter,
          checkerFilter,
        );

        if (!active) return;

        setAssignments(response.data);
        setMeta(response.meta);
      } catch (error: unknown) {
        if (!active) return;
        setAssignments([]);
        setMeta(DEFAULT_META);
        toastError(getErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchAssignments();

    return () => {
      active = false;
    };
  }, [loadAssignments, page, limit, concertFilter, checkerFilter, toastError]);

  const resetCreateForm = () => {
    setCreateConcertId("");
    setCreateCheckerId("");
    setCreateGateNumber("");
    setCreateGates([]);
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleConcertChangeForCreate = async (concertId: string) => {
    setCreateConcertId(concertId);
    setCreateGateNumber("");
    setCreateGates([]);

    if (!concertId) {
      return;
    }

    setIsLoadingCreateGates(true);
    try {
      const response = await getAvailableAssignmentGates(concertId);
      setCreateGates(response);
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setIsLoadingCreateGates(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createConcertId || !createCheckerId || !createGateNumber) {
      toastWarning("Vui lòng điền đầy đủ thông tin phân công.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCheckerAssignment({
        concert_id: createConcertId,
        checker_id: createCheckerId,
        gate_number: Number(createGateNumber),
      });

      setIsCreateOpen(false);
      resetCreateForm();
      toastSuccess("Tạo phân công soát vé thành công!");
      await loadAssignments(page, limit, concertFilter, checkerFilter);
      await loadBootstrapData();
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = async (assignment: CheckerAssignmentItem) => {
    setEditTarget(assignment);
    setEditGateNumber(String(assignment.gate_number));
    setEditGates([]);
    setIsLoadingEditGates(true);

    try {
      const response = await getAvailableAssignmentGates(assignment.concert_id);
      const gates = Array.from(
        new Set([...response, assignment.gate_number]),
      ).sort((a, b) => a - b);
      setEditGates(gates);
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setIsLoadingEditGates(false);
    }
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditGateNumber("");
    setEditGates([]);
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTarget || !editGateNumber) {
      toastWarning("Vui lòng chọn cổng soát vé.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCheckerAssignment(editTarget.id, {
        gate_number: Number(editGateNumber),
      });
      closeEditModal();
      toastSuccess("Cập nhật phân công thành công!");
      await loadAssignments(page, limit, concertFilter, checkerFilter);
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await deleteCheckerAssignment(deleteTarget.id);
      toastSuccess("Hủy phân công soát vé thành công!");
      setDeleteTarget(null);
      await loadAssignments(page, limit, concertFilter, checkerFilter);
      await loadBootstrapData();
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBootstrapData(),
        loadAssignments(page, limit, concertFilter, checkerFilter),
      ]);
      toastSuccess("Làm mới dữ liệu thành công!");
    } catch (error: unknown) {
      toastError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-600 font-sans">
            Vận hành / Kiểm soát vào cổng
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 font-sans">
            Phân công soát vé
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Chỉ định nhân viên soát vé phụ trách từng cổng tại các sự kiện
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleRefresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-sans font-medium text-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Tải lại danh sách phân công"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-teal-600 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-sans font-medium text-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm phân công</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="flex flex-col gap-1.5 md:col-span-5">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-sans">
            Lọc theo sự kiện
          </span>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={concertFilter}
              onChange={(e) => {
                setConcertFilter(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans text-xs w-full h-10 transition-colors text-slate-900 cursor-pointer font-medium"
            >
              <option value="">Tất cả sự kiện</option>
              {concerts.map((concert) => (
                <option key={concert.id} value={concert.id}>
                  {concert.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-5">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-sans">
            Lọc theo nhân viên soát vé
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={checkerFilter}
              onChange={(e) => {
                setCheckerFilter(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans text-xs w-full h-10 transition-colors text-slate-900 cursor-pointer font-medium"
            >
              <option value="">Tất cả nhân viên</option>
              {checkers.map((checker) => (
                <option key={checker.id} value={checker.id}>
                  {checker.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setConcertFilter("");
            setCheckerFilter("");
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-sans text-xs font-medium h-10 transition-colors cursor-pointer md:col-span-2 w-full text-center"
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* Main Content Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
            Danh sách phân công soát vé
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                <th className="p-3">Nhân viên</th>
                <th className="p-3">Sự kiện</th>
                <th className="p-3">Cổng phụ trách</th>
                <th className="p-3">Thời gian diễn ra</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {bootstrapping || loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-slate-500 font-sans text-xs"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      <span>Đang tải danh sách phân công...</span>
                    </div>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-slate-500 font-sans text-xs"
                  >
                    Không tìm thấy lượt phân công nào phù hợp.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => {
                  const concertDetails = concertMap.get(assignment.concert_id);
                  return (
                    <tr
                      key={assignment.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900 text-xs">
                          {assignment.checker.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {assignment.checker.email}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        <div className="font-semibold text-xs">
                          {assignment.concert.name}
                        </div>
                        {concertDetails?.location && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {concertDetails.location}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-teal-200 bg-teal-50 font-sans text-xs font-medium text-teal-700 rounded-full">
                          <ShieldCheck className="h-3 w-3 text-teal-600" />
                          Cổng {assignment.gate_number}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-[11px] text-slate-700">
                        {formatConcertTime(concertDetails?.start_time)}
                      </td>
                      <td className="p-3 font-sans text-[11px] text-slate-500">
                        {formatShortDate(assignment.created_at)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => void handleOpenEdit(assignment)}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-teal-700 px-2.5 py-1 rounded-lg text-xs font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <Pencil size={12} /> Sửa
                          </button>
                          <button
                            onClick={() => setDeleteTarget(assignment)}
                            disabled={deletingId === assignment.id}
                            className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Xóa
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

        {/* Pagination bar */}
        {!loading && meta.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              totalItems={meta.totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              itemLabel="lượt phân công"
            />
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AssignmentModal
        title="Thêm phân công"
        description="Chọn sự kiện, nhân viên soát vé và cổng tương ứng để tạo phân công check-in mới."
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
      >
        <form
          className="space-y-4 text-xs font-sans"
          onSubmit={handleCreateAssignment}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block text-xs">
                Sự kiện *
              </span>
              <select
                value={createConcertId}
                onChange={(e) =>
                  void handleConcertChangeForCreate(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-10 cursor-pointer font-sans"
              >
                <option value="">Chọn một sự kiện</option>
                {concerts.map((concert) => (
                  <option key={concert.id} value={concert.id}>
                    {concert.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block text-xs">
                Nhân viên soát vé *
              </span>
              <select
                value={createCheckerId}
                onChange={(e) => setCreateCheckerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 h-10 cursor-pointer font-sans"
              >
                <option value="">Chọn nhân viên</option>
                {checkers.map((checker) => (
                  <option key={checker.id} value={checker.id}>
                    {checker.full_name} ({checker.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 text-xs">
                  Cổng soát vé khả dụng
                </p>
                <p className="mt-0.5 text-slate-500 text-[11px] font-sans">
                  {selectedConcertForCreate
                    ? `${selectedConcertForCreate.name} · ${selectedConcertForCreate.location || "Chưa cập nhật địa điểm"}`
                    : "Chọn sự kiện để tải danh sách cổng"}
                </p>
              </div>
              {isLoadingCreateGates && (
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              )}
            </div>

            <div className="mt-3">
              {createConcertId &&
              createGates.length === 0 &&
              !isLoadingCreateGates ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 font-sans text-xs">
                  Không có cổng soát vé khả dụng cho sự kiện này.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {createGates.map((gate) => {
                    const isSelected = createGateNumber === String(gate);
                    return (
                      <button
                        key={gate}
                        type="button"
                        onClick={() => setCreateGateNumber(String(gate))}
                        className={`border px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "border-teal-600 bg-teal-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Cổng {gate}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs font-medium py-2 px-3.5 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Tạo phân công
            </button>
          </div>
        </form>
      </AssignmentModal>

      {/* EDIT MODAL */}
      <AssignmentModal
        title="Sửa cổng phân công"
        description="Thay đổi cổng soát vé phụ trách của nhân viên soát vé đã chọn."
        isOpen={Boolean(editTarget)}
        onClose={closeEditModal}
      >
        <form
          className="space-y-4 text-xs font-sans"
          onSubmit={handleEditAssignment}
        >
          {editTarget && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
                  Nhân viên soát vé
                </p>
                <p className="mt-1 font-semibold text-slate-900 text-xs">
                  {editTarget.checker.full_name}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {editTarget.checker.email}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
                  Sự kiện
                </p>
                <p className="mt-1 font-semibold text-slate-900 text-xs">
                  {editTarget.concert.name}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {concertMap.get(editTarget.concert_id)?.location || "—"}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900 text-xs">
                  Thay đổi cổng phụ trách
                </p>
                <p className="mt-0.5 text-slate-500 text-[11px] font-sans">
                  Chọn cổng khả dụng bên dưới để cập nhật phân công cho nhân
                  viên.
                </p>
              </div>
              {isLoadingEditGates && (
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {editGates.map((gate) => {
                const isSelected = editGateNumber === String(gate);
                return (
                  <button
                    key={gate}
                    type="button"
                    onClick={() => setEditGateNumber(String(gate))}
                    className={`border px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "border-teal-600 bg-teal-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cổng {gate}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-sans text-xs font-medium py-2 px-3.5 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </AssignmentModal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hủy phân công"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn hủy phân công nhân viên soát vé ${deleteTarget.checker.full_name} phụ trách Cổng ${deleteTarget.gate_number} tại sự kiện ${deleteTarget.concert.name}?`
            : ""
        }
        isDeleting={deletingId === deleteTarget?.id}
      />
    </div>
  );
}
