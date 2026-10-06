"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCw,
  RotateCcw,
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
  ActiveConcertAssignment,
  ActiveConcertOption,
  CheckerAssignmentItem,
  PaginationMeta,
} from "@/types/checker-assignment.types";
import { getErrorMessage } from "@/utils/error.utils";
import { Pagination } from "../_components/Pagination";
import { useToast } from "@/context/ToastContext";

interface UnassignedGateItem {
  id: string;
  concert_id: string;
  concert_name: string;
  concert_location?: string;
  concert_start_time?: string;
  gate_number: number;
  ticket_categories: string[];
}

type AssignmentViewMode = "ALL" | "ASSIGNED" | "UNASSIGNED";

const DEFAULT_META: PaginationMeta = {
  totalItems: 0,
  itemCount: 0,
  itemsPerPage: 10,
  totalPages: 0,
  currentPage: 1,
};

function formatConcertTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

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
  if (Number.isNaN(date.getTime())) return "-";

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
      <div className="card w-full max-w-xl overflow-hidden p-0 shadow-xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div>
            <span className="over block text-[#0052ff]">Phân công soát vé</span>
            <h3 className="font-bold text-base text-slate-900">{title}</h3>
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
      <div className="card w-full max-w-md overflow-hidden p-4 space-y-3 relative z-10">
        <div className="space-y-1.5 font-sans text-xs">
          <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          <p className="text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger btn-sm"
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
  badge,
  badgeType = "info",
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: "info" | "warning" | "success";
  onClick?: () => void;
}) {
  const isClickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={`card p-4 flex items-center justify-between ${
        isClickable
          ? "cursor-pointer hover:border-blue-300 hover:shadow-xs transition-all"
          : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <p className="over">{label}</p>
          {badge && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                badgeType === "warning"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : badgeType === "success"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-blue-100 text-[#0052ff] border border-blue-200"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 tabular-nums text-2xl font-bold text-slate-900">
          {value}
        </p>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
          badgeType === "warning" && value !== "0"
            ? "border-amber-200 bg-amber-50 text-amber-600"
            : "border-blue-100 bg-blue-50 text-[#0052ff]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const paramConcertId = searchParams.get("concertId") || "";

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
  const [concertFilter, setConcertFilter] = useState(paramConcertId);
  const [checkerFilter, setCheckerFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentViewMode, setAssignmentViewMode] =
    useState<AssignmentViewMode>("ALL");

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

  // Compute unassigned gates across all loaded concerts
  const allUnassignedGates = useMemo(() => {
    const result: UnassignedGateItem[] = [];
    for (const concert of concerts) {
      const assignedGates = new Set(
        (concert.checker_assignments || []).map((a) => a.gate_number),
      );
      const gateMap = new Map<number, string[]>();
      for (const tc of concert.ticket_categories || []) {
        if (tc.gate_number !== null && tc.gate_number !== undefined) {
          const list = gateMap.get(tc.gate_number) || [];
          list.push(tc.name);
          gateMap.set(tc.gate_number, list);
        }
      }
      const sortedGates = Array.from(gateMap.keys()).sort((a, b) => a - b);
      for (const gateNumber of sortedGates) {
        if (!assignedGates.has(gateNumber)) {
          result.push({
            id: `${concert.id}-gate-${gateNumber}`,
            concert_id: concert.id,
            concert_name: concert.name,
            concert_location: concert.location,
            concert_start_time: concert.start_time,
            gate_number: gateNumber,
            ticket_categories: gateMap.get(gateNumber) || [],
          });
        }
      }
    }
    return result;
  }, [concerts]);

  // Filter unassigned gates by active concert & search query
  const displayedUnassignedGates = useMemo(() => {
    let list = allUnassignedGates;
    if (concertFilter) {
      list = list.filter((g) => g.concert_id === concertFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.concert_name.toLowerCase().includes(q) ||
          String(g.gate_number).includes(q) ||
          g.ticket_categories.some((cat) => cat.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allUnassignedGates, concertFilter, searchQuery]);

  // Compute gate overview status when a specific concert is selected
  const concertGatesOverview = useMemo(() => {
    if (!concertFilter) return null;
    const concert = concertMap.get(concertFilter);
    if (!concert) return null;

    const assignedMap = new Map<number, ActiveConcertAssignment>();
    for (const a of concert.checker_assignments || []) {
      assignedMap.set(a.gate_number, a);
    }

    const gateToCategories = new Map<number, string[]>();
    for (const tc of concert.ticket_categories || []) {
      if (tc.gate_number !== null && tc.gate_number !== undefined) {
        const list = gateToCategories.get(tc.gate_number) || [];
        list.push(tc.name);
        gateToCategories.set(tc.gate_number, list);
      }
    }

    const allGateNumbers = Array.from(gateToCategories.keys()).sort(
      (a, b) => a - b,
    );
    const totalGates = allGateNumbers.length;
    const assignedCount = allGateNumbers.filter((g) =>
      assignedMap.has(g),
    ).length;
    const unassignedCount = totalGates - assignedCount;

    return {
      concert,
      totalGates,
      assignedCount,
      unassignedCount,
      percent:
        totalGates > 0 ? Math.round((assignedCount / totalGates) * 100) : 0,
      gates: allGateNumbers.map((gateNum) => ({
        gateNumber: gateNum,
        categories: gateToCategories.get(gateNum) || [],
        assignment: assignedMap.get(gateNum),
        isAssigned: assignedMap.has(gateNum),
      })),
    };
  }, [concertFilter, concertMap]);

  // Categories without an assigned gate number in event config
  const categoriesWithoutGate = useMemo(() => {
    if (!concertFilter) return [];
    const concert = concertMap.get(concertFilter);
    if (!concert) return [];
    return (concert.ticket_categories || []).filter(
      (tc) => tc.gate_number === null || tc.gate_number === undefined,
    );
  }, [concertFilter, concertMap]);

  // Filter assigned items by search query (including category names)
  const displayedAssignments = useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const q = searchQuery.toLowerCase().trim();
    return assignments.filter((a) => {
      const concertDetails = concertMap.get(a.concert_id);
      const categories = (concertDetails?.ticket_categories || [])
        .filter((tc) => tc.gate_number === a.gate_number)
        .map((tc) => tc.name);

      return (
        a.checker.full_name.toLowerCase().includes(q) ||
        a.checker.email.toLowerCase().includes(q) ||
        a.concert.name.toLowerCase().includes(q) ||
        String(a.gate_number).includes(q) ||
        categories.some((cat) => cat.toLowerCase().includes(q))
      );
    });
  }, [assignments, concertMap, searchQuery]);

  const hasActiveFilters = Boolean(
    concertFilter ||
    checkerFilter ||
    searchQuery.trim() ||
    assignmentViewMode !== "ALL",
  );

  const activeFilterCount =
    (concertFilter ? 1 : 0) +
    (checkerFilter ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (assignmentViewMode !== "ALL" ? 1 : 0);

  const handleResetFilters = () => {
    setConcertFilter("");
    setCheckerFilter("");
    setSearchQuery("");
    setAssignmentViewMode("ALL");
    setPage(1);
  };

  const summaryItems = [
    {
      label: "Tổng phân công",
      value: meta.totalItems.toString(),
      icon: ClipboardCheck,
      badge: "Đang hoạt động",
      badgeType: "info" as const,
      onClick: () => setAssignmentViewMode("ASSIGNED"),
    },
    {
      label: "Cổng chưa phân công",
      value: allUnassignedGates.length.toString(),
      icon: allUnassignedGates.length > 0 ? AlertTriangle : ShieldCheck,
      badge: allUnassignedGates.length > 0 ? "Cần phân công" : "Đầy đủ",
      badgeType: (allUnassignedGates.length > 0 ? "warning" : "success") as
        "warning" | "success",
      onClick: () => setAssignmentViewMode("UNASSIGNED"),
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
  ];

  const loadBootstrapData = useCallback(async () => {
    const [concertData, checkerData] = await Promise.all([
      getAssignmentConcerts(),
      getAssignmentCheckers(),
    ]);

    setConcerts(concertData);
    setCheckers(checkerData);

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
        await loadBootstrapData();
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

  // Quick 1-click assign from unassigned gate row or gate matrix
  const handleQuickAssign = async (concertId: string, gateNumber: number) => {
    setCreateConcertId(concertId);
    setCreateGateNumber(String(gateNumber));
    setCreateCheckerId("");
    setIsCreateOpen(true);
    setIsLoadingCreateGates(true);

    try {
      const gates = await getAvailableAssignmentGates(concertId);
      const combined = Array.from(new Set([...gates, gateNumber])).sort(
        (a, b) => a - b,
      );
      setCreateGates(combined);
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

  const totalVisibleCount =
    assignmentViewMode === "UNASSIGNED"
      ? displayedUnassignedGates.length
      : assignmentViewMode === "ASSIGNED"
        ? displayedAssignments.length
        : displayedAssignments.length + displayedUnassignedGates.length;

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="head stickyhead flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="htcaa-h1">Phân công soát vé</h1>
            <span className="htcaa-badge-count-pill">
              {meta.totalItems} lượt phân công
            </span>
            {allUnassignedGates.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setAssignmentViewMode((prev) =>
                    prev === "UNASSIGNED" ? "ALL" : "UNASSIGNED",
                  )
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                title="Bật/tắt xem các cổng chưa phân công"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{allUnassignedGates.length} cổng chưa có người</span>
              </button>
            )}
          </div>
          <p className="sub mt-1">
            Chỉ định nhân viên soát vé phụ trách từng cổng tại các sự kiện
          </p>
        </div>

        <div className="head-actions flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading}
            className="btn"
            title="Tải lại danh sách phân công"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0e54a3]" : "text-slate-500"}`}
            />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary"
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

      {/* Filters Toolbar Card */}
      <div className="card p-3.5 space-y-3">
        {/* Top row: Search input + Toggle unassigned + Quick controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="search-box flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo nhân viên, email, sự kiện, cổng, hạng vé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick controls: Toggle button, Reset & Rows per page */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* Direct Toggle Button for Unassigned Gates */}
            <button
              type="button"
              onClick={() =>
                setAssignmentViewMode((prev) =>
                  prev === "UNASSIGNED" ? "ALL" : "UNASSIGNED",
                )
              }
              className={`btn btn-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                assignmentViewMode === "UNASSIGNED"
                  ? "btn-primary shadow-xs"
                  : displayedUnassignedGates.length > 0
                    ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "btn-secondary text-slate-600"
              }`}
              title="Bật/tắt chỉ hiển thị các cổng chưa phân công"
            >
              {assignmentViewMode === "UNASSIGNED" ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>
                    Hiện tất cả (đang lọc {displayedUnassignedGates.length} cổng
                    trống)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${
                      displayedUnassignedGates.length > 0
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>
                    Cổng chưa phân công ({displayedUnassignedGates.length})
                  </span>
                </>
              )}
            </button>

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
          {/* Concert Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
            <span className="over text-[11px] shrink-0">Sự kiện:</span>
            <select
              value={concertFilter}
              onChange={(e) => {
                setConcertFilter(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold truncate"
            >
              <option value="">Tất cả sự kiện ({concerts.length})</option>
              {concerts.map((concert) => (
                <option key={concert.id} value={concert.id}>
                  {concert.name}
                </option>
              ))}
            </select>
          </div>

          {/* Checker Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
            <span className="over text-[11px] shrink-0">Nhân viên:</span>
            <select
              value={checkerFilter}
              onChange={(e) => {
                setCheckerFilter(e.target.value);
                setPage(1);
              }}
              className="select-trigger w-full text-xs font-semibold truncate"
            >
              <option value="">Tất cả nhân viên ({checkers.length})</option>
              {checkers.map((checker) => (
                <option key={checker.id} value={checker.id}>
                  {checker.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Count info */}
          <div className="ml-auto text-xs text-slate-500 font-medium hidden lg:flex items-center gap-1.5">
            <span>Hiển thị</span>
            <strong className="text-slate-900 font-bold tabular-nums">
              {totalVisibleCount}
            </strong>
            <span>mục</span>
          </div>
        </div>
      </div>

      {/* EVENT GATE MATRIX BAR (Hiển thị khi chọn một sự kiện cụ thể) */}
      {concertGatesOverview && (
        <div className="card p-4 space-y-3 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DoorOpen className="w-4 h-4 text-[#0052ff]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Sơ đồ cổng soát vé: {concertGatesOverview.concert.name}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    concertGatesOverview.unassignedCount === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {concertGatesOverview.unassignedCount === 0
                    ? "✓ Đã phân công 100%"
                    : `Còn ${concertGatesOverview.unassignedCount} cổng chưa có người`}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                {concertGatesOverview.concert.location ||
                  "Chưa cập nhật địa điểm"}{" "}
                · {formatConcertTime(concertGatesOverview.concert.start_time)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">
                  {concertGatesOverview.assignedCount} /{" "}
                  {concertGatesOverview.totalGates} cổng đã gán
                </div>
                <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      concertGatesOverview.percent === 100
                        ? "bg-emerald-500"
                        : "bg-[#0052ff]"
                    }`}
                    style={{ width: `${concertGatesOverview.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Gate Chips */}
          {concertGatesOverview.gates.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              Sự kiện này chưa có hạng vé nào được gán số cổng.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
              {concertGatesOverview.gates.map((g) => {
                if (g.isAssigned && g.assignment) {
                  return (
                    <div
                      key={g.gateNumber}
                      onClick={() => {
                        const targetAssignment =
                          assignments.find((a) => a.id === g.assignment!.id) ||
                          ({
                            id: g.assignment!.id,
                            checker_id: g.assignment!.checker.id,
                            concert_id: concertGatesOverview.concert.id,
                            gate_number: g.assignment!.gate_number,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            checker: g.assignment!.checker,
                            concert: {
                              id: concertGatesOverview.concert.id,
                              name: concertGatesOverview.concert.name,
                              location: concertGatesOverview.concert.location,
                              start_time:
                                concertGatesOverview.concert.start_time,
                            },
                          } as CheckerAssignmentItem);
                        void handleOpenEdit(targetAssignment);
                      }}
                      className="group flex flex-col justify-between p-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Nhấn để đổi cổng hoặc nhân viên"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Cổng {g.gateNumber}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          Đã phân công
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {g.assignment.checker.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {g.assignment.checker.email}
                        </p>
                      </div>
                      {g.categories.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-emerald-100/60 text-[10px] text-slate-600 truncate">
                          Hạng vé: {g.categories.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={g.gateNumber}
                    className="group flex flex-col justify-between p-2.5 rounded-lg border border-amber-300 bg-amber-50/60 hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Cổng {g.gateNumber}
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/70 px-1.5 py-0.5 rounded">
                        Chưa có người
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-amber-900/80 font-medium">
                      Cần chỉ định nhân viên soát vé
                    </div>
                    {g.categories.length > 0 && (
                      <div className="mt-1 text-[10px] text-slate-600 truncate">
                        Hạng vé: {g.categories.join(", ")}
                      </div>
                    )}
                    <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          void handleQuickAssign(
                            concertGatesOverview.concert.id,
                            g.gateNumber,
                          )
                        }
                        className="btn btn-primary btn-xs inline-flex items-center gap-1 py-1 px-2 text-[11px]"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Gán ngay</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {categoriesWithoutGate.length > 0 && (
            <div className="text-[11px] text-amber-700 bg-amber-100/60 rounded-md p-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Lưu ý: Có {categoriesWithoutGate.length} hạng vé chưa được gán
                số cổng ({categoriesWithoutGate.map((c) => c.name).join(", ")}).
                Vui lòng cập nhật cấu hình sự kiện.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Table Card */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="sub">
              Danh sách phân công & cổng soát vé ({totalVisibleCount})
            </span>
            {assignmentViewMode === "UNASSIGNED" && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                Chỉ hiển thị cổng chưa phân công
              </span>
            )}
          </div>

          {/* Segmented View Mode Filter */}
          <div className="htcaa-segmented">
            <button
              type="button"
              className={`htcaa-segmented-btn ${assignmentViewMode === "ALL" ? "active" : ""}`}
              onClick={() => setAssignmentViewMode("ALL")}
            >
              Tất cả ({meta.totalItems + displayedUnassignedGates.length})
            </button>
            <button
              type="button"
              className={`htcaa-segmented-btn ${assignmentViewMode === "ASSIGNED" ? "active" : ""}`}
              onClick={() => setAssignmentViewMode("ASSIGNED")}
            >
              Đã phân công ({meta.totalItems})
            </button>
            <button
              type="button"
              className={`htcaa-segmented-btn ${assignmentViewMode === "UNASSIGNED" ? "active" : ""}`}
              onClick={() => setAssignmentViewMode("UNASSIGNED")}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Chưa phân công ({displayedUnassignedGates.length})
            </button>
          </div>
        </div>

        <div className="htcaa-table-wrap">
          <div className="overflow-x-auto min-h-[320px]">
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Nhân viên / Trạng thái</th>
                  <th>Sự kiện</th>
                  <th>Cổng & Hạng vé</th>
                  <th>Thời gian diễn ra</th>
                  <th>
                    {assignmentViewMode === "UNASSIGNED"
                      ? "Thao tác"
                      : "Ngày tạo"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bootstrapping || loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 font-sans text-xs"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
                        <span>Đang tải danh sách phân công...</span>
                      </div>
                    </td>
                  </tr>
                ) : assignmentViewMode === "UNASSIGNED" &&
                  displayedUnassignedGates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 font-sans text-xs"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="font-semibold text-slate-900 text-sm">
                          Tất cả các cổng đã được phân công!
                        </span>
                        <span className="text-slate-500 text-xs">
                          Không có cổng nào bị thiếu nhân viên soát vé.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : assignmentViewMode === "ASSIGNED" &&
                  displayedAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 font-sans text-xs"
                    >
                      Không tìm thấy lượt phân công nào phù hợp.
                    </td>
                  </tr>
                ) : assignmentViewMode === "ALL" &&
                  displayedAssignments.length === 0 &&
                  displayedUnassignedGates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-slate-500 font-sans text-xs"
                    >
                      Không tìm thấy lượt phân công hoặc cổng soát vé nào phù
                      hợp.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Render Unassigned Gates if in ALL or UNASSIGNED mode */}
                    {(assignmentViewMode === "ALL" ||
                      assignmentViewMode === "UNASSIGNED") &&
                      displayedUnassignedGates.map((gate) => (
                        <tr
                          key={gate.id}
                          onClick={() =>
                            void handleQuickAssign(
                              gate.concert_id,
                              gate.gate_number,
                            )
                          }
                          className="row-click group cursor-pointer bg-amber-50/25 hover:bg-amber-50/70 transition-colors border-l-2 border-l-amber-500"
                          title="Nhấn để phân công nhân viên cho cổng này"
                        >
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                Chưa phân công
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-sans">
                              Chưa có người trực
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-xs text-slate-900">
                              {gate.concert_name}
                            </div>
                            {gate.concert_location && (
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                                {gate.concert_location}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-amber-300 bg-amber-50 font-sans text-xs font-semibold text-amber-800 rounded-full">
                                <DoorOpen className="h-3 w-3 text-amber-600" />
                                Cổng{" "}
                                <span className="font-mono tabular-nums">
                                  {gate.gate_number}
                                </span>
                              </span>
                              {gate.ticket_categories.length > 0 && (
                                <span className="text-[11px] text-slate-600">
                                  Hạng vé:{" "}
                                  <strong className="text-slate-800 font-semibold">
                                    {gate.ticket_categories.join(", ")}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="font-mono tabular-nums text-[11px] text-slate-700">
                            {formatConcertTime(gate.concert_start_time)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleQuickAssign(
                                  gate.concert_id,
                                  gate.gate_number,
                                );
                              }}
                              className="btn btn-primary btn-sm inline-flex items-center gap-1 py-1 px-2.5 text-xs shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Phân công ngay</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                    {/* Render Assigned Items if in ALL or ASSIGNED mode */}
                    {(assignmentViewMode === "ALL" ||
                      assignmentViewMode === "ASSIGNED") &&
                      displayedAssignments.map((assignment) => {
                        const concertDetails = concertMap.get(
                          assignment.concert_id,
                        );
                        const gateCategories = (
                          concertDetails?.ticket_categories || []
                        )
                          .filter(
                            (tc) => tc.gate_number === assignment.gate_number,
                          )
                          .map((tc) => tc.name);

                        return (
                          <tr
                            key={assignment.id}
                            onClick={() => void handleOpenEdit(assignment)}
                            className="row-click group cursor-pointer hover:bg-slate-50 transition-colors"
                            title="Nhấn để sửa cổng hoặc hủy phân công"
                          >
                            <td>
                              <div className="font-semibold text-slate-900 text-xs">
                                {assignment.checker.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {assignment.checker.email}
                              </div>
                            </td>
                            <td>
                              <div className="font-semibold text-xs text-slate-900">
                                {assignment.concert.name}
                              </div>
                              {concertDetails?.location && (
                                <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                                  {concertDetails.location}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-blue-200 bg-blue-50 font-sans text-xs font-semibold text-[#0052ff] rounded-full">
                                  <ShieldCheck className="h-3 w-3 text-[#0052ff]" />
                                  Cổng{" "}
                                  <span className="font-mono tabular-nums">
                                    {assignment.gate_number}
                                  </span>
                                </span>
                                {gateCategories.length > 0 && (
                                  <span className="text-[11px] text-slate-500">
                                    Hạng vé:{" "}
                                    <span className="text-slate-700 font-medium">
                                      {gateCategories.join(", ")}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="font-mono tabular-nums text-[11px] text-slate-700">
                              {formatConcertTime(concertDetails?.start_time)}
                            </td>
                            <td className="font-mono tabular-nums text-[11px] text-slate-500">
                              {formatShortDate(assignment.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar (only for server-paginated assignments) */}
          {!loading &&
            assignmentViewMode !== "UNASSIGNED" &&
            meta.totalPages > 1 && (
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
                className="select-trigger w-full h-10"
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
                className="select-trigger w-full h-10"
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
                <Loader2 className="h-4 w-4 animate-spin text-[#0052ff]" />
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
                            ? "border-[#0052ff] bg-[#0052ff] text-white shadow-xs"
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
              className="btn btn-secondary btn-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
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
                <p className="over">Nhân viên soát vé</p>
                <p className="mt-1 font-semibold text-slate-900 text-xs">
                  {editTarget.checker.full_name}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {editTarget.checker.email}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <p className="over">Sự kiện</p>
                <p className="mt-1 font-semibold text-slate-900 text-xs">
                  {editTarget.concert.name}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {concertMap.get(editTarget.concert_id)?.location || "-"}
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
                <Loader2 className="h-4 w-4 animate-spin text-[#0052ff]" />
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
                        ? "border-[#0052ff] bg-[#0052ff] text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cổng {gate}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => {
                const target = editTarget;
                closeEditModal();
                if (target) setDeleteTarget(target);
              }}
              className="btn btn-danger btn-sm inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hủy phân công</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="btn btn-secondary btn-sm"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
                Lưu thay đổi
              </button>
            </div>
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

export default function AdminAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin border-2 border-[#0052ff] border-t-transparent rounded-full" />
        </div>
      }
    >
      <AssignmentsContent />
    </Suspense>
  );
}
