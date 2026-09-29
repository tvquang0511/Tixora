"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  X,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Upload,
  Pause,
  Play,
} from "lucide-react";
import {
  getConcertById,
  updateConcert,
  deleteConcert,
} from "@/services/concert.service";
import { getVenues, type VenueItem } from "@/services/venue.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";
import { StatusBadge } from "../../_components/StatusBadge";

export const SYSTEM_SVG_MAPS = [
  {
    value: "/maps/viet-xo-theatre.svg",
    label: "Cung Văn hóa Hữu nghị Việt - Xô (Hà Nội)",
  },
  {
    value: "/maps/secc-hall-a.svg",
    label: "Trung tâm Hội chợ & Triển lãm SECC - Hall A (TP. HCM)",
  },
  {
    value: "/maps/quan-khu-7-stadium.svg",
    label: "Sân vận động Quân Khu 7 (TP. HCM)",
  },
  {
    value: "/maps/my-dinh-stadium.svg",
    label: "Sân vận động Quốc gia Mỹ Đình (Hà Nội)",
  },
  {
    value: "/maps/phu-tho-arena.svg",
    label: "Nhà thi đấu TDTT Phú Thọ (TP. HCM)",
  },
  {
    value: "/maps/default.svg",
    label: "Sân khấu Nhà hát / Hội trường tiêu chuẩn",
  },
];

export function resolveSvgMapUrl(url?: string | null): string {
  if (!url) return "";
  if (url === "https://cdn.tixora.local/maps/default.svg") {
    return "/maps/default.svg";
  }
  if (url.startsWith("https://cdn.tixora.local/")) {
    return url.replace("https://cdn.tixora.local/", "/");
  }
  return url;
}

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_REVIEW", "PUBLISHED"],
  PENDING_REVIEW: ["APPROVED", "PUBLISHED", "REJECTED", "DRAFT"],
  APPROVED: ["PUBLISHED", "PAUSED", "DRAFT", "CANCELLED"],
  REJECTED: ["DRAFT", "PENDING_REVIEW"],
  PUBLISHED: ["PAUSED", "COMPLETED", "CANCELLED"],
  PAUSED: ["PUBLISHED", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ sàn duyệt",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Bị từ chối",
  PUBLISHED: "Đang mở bán",
  PAUSED: "Tạm ngưng",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

export const STATUS_WARNING_MESSAGES: Record<string, string> = {
  PAUSED: "Khách hàng sẽ tạm thời không thể tiếp tục đặt vé cho sự kiện này.",
  CANCELLED:
    "Toàn bộ vé đã phát hành sẽ bị vô hiệu hóa và kích hoạt quy trình hoàn tiền cho khách. Thao tác này không thể hoàn tác!",
  COMPLETED:
    "Đánh dấu sự kiện đã kết thúc để tiến hành chốt sổ đối soát doanh thu.",
  PUBLISHED:
    "Sự kiện sẽ được hiển thị công khai trên sàn và mở cổng bán vé cho khán giả.",
  REJECTED:
    "Sự kiện sẽ bị từ chối duyệt và gửi yêu cầu chỉnh sửa lại tới ban tổ chức.",
  APPROVED:
    "Phê duyệt thông tin sự kiện và sẵn sàng chờ tới thời điểm mở bán vé.",
  DRAFT: "Chuyển sự kiện về trạng thái soạn thảo bản nháp.",
  PENDING_REVIEW: "Gửi sự kiện vào danh sách chờ ban quản trị sàn kiểm duyệt.",
};

interface ConcertEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concertId: string | null;
  onSuccess: (updated: { id: string; [key: string]: unknown }) => void;
  onDeleteSuccess?: (id: string) => void;
}

interface EditableTicketTier {
  id?: string;
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
  position: number;
  status: string;
  sales_start_at?: string;
}

export function ConcertEditDrawer({
  isOpen,
  onClose,
  concertId,
  onSuccess,
  onDeleteSuccess,
}: ConcertEditDrawerProps) {
  const { success, error: toastError, warning } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [venues, setVenues] = useState<VenueItem[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MUSIC");
  const [location, setLocation] = useState("");
  const [venueId, setVenueId] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [performers, setPerformers] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [svgMapUrl, setSvgMapUrl] = useState("");
  const [currentStatus, setCurrentStatus] = useState("DRAFT");
  const [selectedStatus, setSelectedStatus] = useState("DRAFT");
  const [ticketTiers, setTicketTiers] = useState<EditableTicketTier[]>([]);

  // Dirty state tracking (only brighten save button when there are edits)
  const [initialSnapshot, setInitialSnapshot] = useState("");

  // Status Change Confirmation Modal
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingConcert, setIsDeletingConcert] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"info" | "tickets" | "status">(
    "info",
  );

  useEffect(() => {
    if (!isOpen || !concertId) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [concertData, venuesRes] = await Promise.all([
          getConcertById(concertId),
          getVenues().catch(() => ({ data: [] as VenueItem[] })),
        ]);

        if (!isMounted) return;

        setVenues(Array.isArray(venuesRes) ? venuesRes : venuesRes.data || []);
        setName(concertData.title || "");
        setCategory(concertData.category || "MUSIC");
        setLocation(
          concertData.venue
            ? `${concertData.venue}, ${concertData.city}`
            : concertData.city || "",
        );
        setVenueId(concertData.venue_id || "");
        setStartTime(
          concertData.startTime
            ? new Date(concertData.startTime).toISOString().slice(0, 16)
            : "",
        );
        setPerformers((concertData.performers || []).join(", "));
        setDescription(concertData.description || "");
        setPosterUrl(concertData.posterUrl || "");
        setSvgMapUrl(concertData.mapUrl || "");
        setCurrentStatus(concertData.status || "DRAFT");
        setSelectedStatus(concertData.status || "DRAFT");

        const tiers: EditableTicketTier[] = (concertData.ticketTiers || []).map(
          (t, idx) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            total_quantity: t.total_quantity,
            max_per_user: t.max_per_user || 4,
            gate_number: t.gate_number ?? null,
            position: t.position ?? idx,
            status: t.status ?? "book_now",
            sales_start_at: t.sales_start_at || undefined,
          }),
        );
        setTicketTiers(tiers);

        // Snapshot initial state to check for changes
        const snapshot = JSON.stringify({
          name: (concertData.title || "").trim(),
          category: concertData.category || "MUSIC",
          location: (concertData.venue
            ? `${concertData.venue}, ${concertData.city}`
            : concertData.city || ""
          ).trim(),
          venueId: concertData.venue_id || "",
          startTime: concertData.startTime
            ? new Date(concertData.startTime).toISOString().slice(0, 16)
            : "",
          performers: (concertData.performers || []).join(", "),
          description: (concertData.description || "").trim(),
          posterUrl: (concertData.posterUrl || "").trim(),
          svgMapUrl: (concertData.mapUrl || "").trim(),
          status: concertData.status || "DRAFT",
          ticketTiers: tiers.map((t, idx) => ({
            name: t.name.trim(),
            price: Number(t.price),
            total_quantity: Number(t.total_quantity),
            max_per_user: Number(t.max_per_user),
            gate_number: t.gate_number ? Number(t.gate_number) : null,
            position: idx,
            status: t.status || "book_now",
            sales_start_at: t.sales_start_at || "",
          })),
        });
        setInitialSnapshot(snapshot);
      } catch (err) {
        console.error("Failed to load concert details:", err);
        toastError("Không thể tải thông tin chi tiết sự kiện.");
        onClose();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, concertId, toastError, onClose]);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file);
      setPosterUrl(res.url);
      success("Tải lên ảnh poster thành công!");
    } catch {
      toastError("Tải lên ảnh poster thất bại.");
    }
  };

  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadSvg(file);
      setSvgMapUrl(res.url);
      success("Tải lên sơ đồ ghế SVG thành công!");
    } catch {
      toastError("Tải lên sơ đồ ghế SVG thất bại.");
    }
  };

  const handleAddTier = () => {
    setTicketTiers((prev) => [
      ...prev,
      {
        name: `Hạng vé ${prev.length + 1}`,
        price: 100000,
        total_quantity: 100,
        max_per_user: 4,
        position: prev.length,
        status: "book_now",
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (
    index: number,
    field: keyof EditableTicketTier,
    value: unknown,
  ) => {
    setTicketTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)),
    );
  };

  const handleSubmit = async (bypassStatusConfirm = false) => {
    if (!concertId) return;

    if (!name.trim()) {
      warning("Vui lòng nhập tên sự kiện.");
      return;
    }

    if (!startTime) {
      warning("Vui lòng chọn thời gian bắt đầu sự kiện.");
      return;
    }

    if (ticketTiers.length === 0) {
      warning("Sự kiện cần tối thiểu một hạng vé.");
      return;
    }

    // If status changed and not yet confirmed
    if (selectedStatus !== currentStatus && !bypassStatusConfirm) {
      setShowStatusConfirm(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        location: location.trim(),
        venue_id: venueId || null,
        start_time: new Date(startTime).toISOString(),
        performers: performers
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        description: description.trim(),
        poster_url: posterUrl.trim() || undefined,
        svg_map_url: svgMapUrl.trim() || undefined,
        status: selectedStatus,
        ticketTiers: ticketTiers.map((t, idx) => ({
          id: t.id,
          name: t.name.trim(),
          price: Number(t.price),
          total_quantity: Number(t.total_quantity),
          max_per_user: Number(t.max_per_user),
          gate_number: t.gate_number ? Number(t.gate_number) : null,
          position: idx,
          status: t.status || "book_now",
          sales_start_at: t.sales_start_at
            ? new Date(t.sales_start_at).toISOString()
            : null,
        })),
      };

      await updateConcert(concertId, payload);
      success("Cập nhật sự kiện thành công!");
      onSuccess({
        id: concertId,
        title: payload.name,
        status: payload.status,
        venue: payload.location,
        date: startTime.slice(0, 10),
      });
      onClose();
    } catch (err: unknown) {
      console.error("Failed to update concert:", err);
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toastError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          "Cập nhật sự kiện thất bại.",
      );
    } finally {
      setIsSaving(false);
      setShowStatusConfirm(false);
    }
  };

  const currentSnapshot = JSON.stringify({
    name: name.trim(),
    category,
    location: location.trim(),
    venueId,
    startTime,
    performers,
    description: description.trim(),
    posterUrl: posterUrl.trim(),
    svgMapUrl: svgMapUrl.trim(),
    status: selectedStatus,
    ticketTiers: ticketTiers.map((t, idx) => ({
      name: t.name.trim(),
      price: Number(t.price),
      total_quantity: Number(t.total_quantity),
      max_per_user: Number(t.max_per_user),
      gate_number: t.gate_number ? Number(t.gate_number) : null,
      position: idx,
      status: t.status || "book_now",
      sales_start_at: t.sales_start_at || "",
    })),
  });

  const isDirty = Boolean(
    initialSnapshot && currentSnapshot !== initialSnapshot,
  );

  const isFormFieldsDirty = Boolean(
    initialSnapshot &&
    JSON.stringify({
      name: name.trim(),
      category,
      location: location.trim(),
      venueId,
      startTime,
      performers,
      description: description.trim(),
      posterUrl: posterUrl.trim(),
      svgMapUrl: svgMapUrl.trim(),
      status: currentStatus,
      ticketTiers: ticketTiers.map((t, idx) => ({
        name: t.name.trim(),
        price: Number(t.price),
        total_quantity: Number(t.total_quantity),
        max_per_user: Number(t.max_per_user),
        gate_number: t.gate_number ? Number(t.gate_number) : null,
        position: idx,
        status: t.status || "book_now",
        sales_start_at: t.sales_start_at || "",
      })),
    }) !== initialSnapshot,
  );

  const handleConfirmStatusChange = async () => {
    if (!concertId || !selectedStatus) return;
    if (!isFormFieldsDirty) {
      setIsSaving(true);
      try {
        await updateConcert(concertId, { status: selectedStatus });
        success(
          `Đã chuyển trạng thái sự kiện sang ${STATUS_LABELS[selectedStatus] || selectedStatus}!`,
        );
        setCurrentStatus(selectedStatus);
        onSuccess({
          id: concertId,
          status: selectedStatus,
        });
        setShowStatusConfirm(false);
      } catch (err: unknown) {
        console.error("Failed to update status only:", err);
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
        setIsSaving(false);
      }
    } else {
      await handleSubmit(true);
    }
  };

  const canDelete = currentStatus === "DRAFT" || currentStatus === "REJECTED";

  const handleDeleteConcert = async () => {
    if (!concertId || !canDelete) return;
    setIsDeletingConcert(true);
    try {
      await deleteConcert(concertId);
      success(`Đã xóa sự kiện "${name}" thành công!`);
      setShowDeleteModal(false);
      onDeleteSuccess?.(concertId);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to delete concert from drawer", err);
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toastError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          "Xóa sự kiện thất bại.",
      );
    } finally {
      setIsDeletingConcert(false);
    }
  };

  if (!isOpen) return null;

  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const webAppUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body text-xs">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full pl-6 flex">
        <div className="w-screen max-w-2xl sm:max-w-3xl bg-white border-l border-slate-200 flex flex-col shadow-2xl relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {name || "Chỉnh sửa sự kiện"}
                  </h2>
                  <StatusBadge
                    status={currentStatus}
                    variant="concert"
                    size="xs"
                  />
                  {currentStatus === "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("PAUSED");
                        setShowStatusConfirm(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors shadow-2xs cursor-pointer"
                      title="Tạm ngưng mở bán vé ngay lập tức"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Tạm ngưng bán</span>
                    </button>
                  )}
                  {currentStatus === "PAUSED" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus("PUBLISHED");
                        setShowStatusConfirm(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                      title="Mở bán vé trở lại"
                    >
                      <Play className="w-3 h-3" />
                      <span>Mở bán lại</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  ID: {concertId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-slate-100 px-6 gap-6 bg-slate-50/50 shrink-0">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "info"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tickets"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Hạng vé</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-700 font-mono">
                {ticketTiers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "status"
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Trạng thái phát hành</span>
              {selectedStatus !== currentStatus && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <p className="text-xs">Đang tải dữ liệu sự kiện...</p>
              </div>
            ) : (
              <>
                {/* Tab: Thông tin chung */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tên sự kiện <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên sự kiện..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Thể loại sự kiện
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                        >
                          <option value="LIVE_MUSIC">
                            Âm nhạc trực tiếp (Live Music)
                          </option>
                          <option value="FESTIVAL">
                            Lễ hội âm nhạc (Festival)
                          </option>
                          <option value="THEATRE">
                            Nhạc kịch & Kịch nói (Theatre)
                          </option>
                          <option value="WORKSHOP">
                            Hội thảo & Triển lãm (Workshop)
                          </option>
                          <option value="TALKSHOW">
                            Talkshow & Fan Meeting
                          </option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Thời gian bắt đầu{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Liên kết Địa điểm (Venue)
                        </label>
                        <select
                          value={venueId}
                          onChange={(e) => {
                            const vId = e.target.value;
                            setVenueId(vId);
                            const found = venues.find((v) => v.id === vId);
                            if (found) {
                              setLocation(`${found.name}, ${found.address}`);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                        >
                          <option value="">-- Chọn địa điểm đã lưu --</option>
                          {venues.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.city})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Địa chỉ hiển thị
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Ví dụ: Trung tâm Triển lãm SECC, Quận 7, TP.HCM"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nghệ sĩ biểu diễn (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={performers}
                        onChange={(e) => setPerformers(e.target.value)}
                        placeholder="Ví dụ: Sơn Tùng M-TP, Vũ, Đen Vâu..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mô tả chi tiết sự kiện
                      </label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nội dung giới thiệu sự kiện, quy định vào cổng..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    {/* Poster URL */}
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Ảnh Poster sự kiện
                      </label>
                      <div className="flex gap-3 items-center">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt="Poster Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                            No poster
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={posterUrl}
                            onChange={(e) => setPosterUrl(e.target.value)}
                            placeholder="URL ảnh poster (https://...)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800"
                          />
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-md text-[11px] cursor-pointer shadow-2xs">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>Tải ảnh mới từ máy</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePosterUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Thẻ Sơ đồ ghế & Sân khấu */}
                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800">
                            Sơ đồ ghế & Sân khấu
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Chọn sơ đồ mẫu chuẩn hệ thống hoặc tải lên file SVG
                            vector
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs cursor-pointer shadow-2xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tải file SVG</span>
                          <input
                            type="file"
                            accept=".svg,image/svg+xml"
                            onChange={handleSvgUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Dropdown for system preset SVG maps */}
                      <div>
                        <select
                          value={
                            SYSTEM_SVG_MAPS.some((m) => m.value === svgMapUrl)
                              ? svgMapUrl
                              : svgMapUrl
                                ? "__custom__"
                                : ""
                          }
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              setSvgMapUrl(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                        >
                          <option value="">
                            -- Chọn sơ đồ mẫu có sẵn trên hệ thống --
                          </option>
                          {SYSTEM_SVG_MAPS.map((mapPreset) => (
                            <option
                              key={mapPreset.value}
                              value={mapPreset.value}
                            >
                              {mapPreset.label}
                            </option>
                          ))}
                          {svgMapUrl &&
                            !SYSTEM_SVG_MAPS.some(
                              (m) => m.value === svgMapUrl,
                            ) && (
                              <option value="__custom__">
                                Sơ đồ tùy chỉnh / Đường dẫn riêng (
                                {svgMapUrl.slice(0, 35)}...)
                              </option>
                            )}
                        </select>
                      </div>

                      {/* Visual Preview Box */}
                      {svgMapUrl ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-xs font-semibold text-slate-800">
                                Mặt bằng phân khu khán giả & Sân khấu
                              </span>
                            </div>
                            <a
                              href={resolveSvgMapUrl(svgMapUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800 hover:underline shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Mở toàn màn hình</span>
                            </a>
                          </div>

                          <div className="w-full h-48 sm:h-56 bg-slate-50/70 border border-slate-100 rounded-lg flex items-center justify-center p-3 overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveSvgMapUrl(svgMapUrl)}
                              alt="Xem trước sơ đồ ghế và sân khấu"
                              className="max-w-full max-h-full object-contain transition-transform group-hover:scale-[1.02]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-white">
                          <p className="text-xs text-slate-500 font-medium">
                            Chưa có sơ đồ ghế
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Vui lòng chọn một mẫu từ hệ thống ở trên hoặc tải
                            file SVG
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Hạng vé */}
                {activeTab === "tickets" && (
                  <div className="space-y-4">
                    {/* Ticket Tiers List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">
                            Danh sách hạng vé phát hành
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Cấu hình số lượng, giá bán và giới hạn vé cho từng
                            hạng ghế.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddTier}
                          className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm hạng vé</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {ticketTiers.map((tier, idx) => (
                          <div
                            key={tier.id || idx}
                            className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <span className="font-semibold text-slate-900 text-xs">
                                Hạng vé #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(idx)}
                                disabled={ticketTiers.length <= 1}
                                className="text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Xóa hạng vé này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">
                                  Tên hạng vé
                                </label>
                                <input
                                  type="text"
                                  value={tier.name}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium"
                                  placeholder="VIP, General..."
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">
                                  Giá vé (VNĐ)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={10000}
                                  value={tier.price}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "price",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs tabular-nums text-slate-900 font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">
                                  Tổng số lượng vé
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={tier.total_quantity}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "total_quantity",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs tabular-nums text-slate-900 font-medium"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">
                                  Số vé tối đa / 1 người
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={tier.max_per_user}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "max_per_user",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs tabular-nums text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">
                                  Cổng soát vé (Gate)
                                </label>
                                <input
                                  type="number"
                                  value={tier.gate_number ?? ""}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "gate_number",
                                      e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    )
                                  }
                                  placeholder="Ví dụ: 1, 2..."
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs tabular-nums text-slate-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Trạng thái phát hành */}
                {activeTab === "status" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Trạng thái hiện tại:
                        </span>
                        <StatusBadge
                          status={currentStatus}
                          variant="concert"
                          size="sm"
                        />
                      </div>

                      {validTransitions.length === 0 ? (
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs">
                          Sự kiện đã ở trạng thái kết thúc (
                          <strong>
                            {STATUS_LABELS[currentStatus] || currentStatus}
                          </strong>
                          ). Không thể thay đổi trạng thái nữa.
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1.5">
                            Chọn trạng thái mới:
                          </label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors shadow-2xs"
                          >
                            <option value={currentStatus}>
                              {STATUS_LABELS[currentStatus] || currentStatus}{" "}
                              (Hiện tại)
                            </option>
                            {validTransitions.map((st) => (
                              <option key={st} value={st}>
                                ➔ Chuyển sang: {STATUS_LABELS[st] || st}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Warning for selected new status */}
                      {selectedStatus !== currentStatus && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">
                              Lưu ý khi chuyển sang{" "}
                              {STATUS_LABELS[selectedStatus]}:
                            </p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              {STATUS_WARNING_MESSAGES[selectedStatus] ||
                                "Trạng thái sự kiện sẽ được cập nhật sau khi lưu."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/40 text-[11px] text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700">
                        Quy tắc máy trạng thái:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>
                          Sự kiện đang <strong>Đang mở bán</strong> hoặc{" "}
                          <strong>Tạm ngưng</strong> không thể chuyển về{" "}
                          <strong>Bản nháp</strong>.
                        </li>
                        <li>
                          Muốn ngừng nhận đơn đặt vé tạm thời, vui lòng chọn{" "}
                          <strong>Tạm ngưng</strong>.
                        </li>
                        <li>
                          Chỉ dùng <strong>Đã hủy</strong> khi show diễn bị bãi
                          bỏ vĩnh viễn và cần hoàn lại tiền cho khách hàng.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div>
              <a
                href={`${webAppUrl}/concerts/${concertId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem trang công khai</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút xóa màu đỏ kế bên nút hủy bỏ: không có icon, đậm khi cho phép xóa, nhạt khi không */}
              <button
                type="button"
                onClick={() => {
                  if (canDelete) {
                    setShowDeleteModal(true);
                  }
                }}
                disabled={!canDelete || isDeletingConcert}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  canDelete
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs cursor-pointer"
                    : "bg-rose-50 text-rose-300 border-rose-100 cursor-not-allowed opacity-60"
                }`}
                title={
                  canDelete
                    ? "Xóa sự kiện này khỏi hệ thống"
                    : "Chỉ được xóa sự kiện ở trạng thái Bản nháp hoặc Bị từ chối (chưa có vé bán)."
                }
              >
                {isDeletingConcert ? "Đang xóa..." : "Xóa sự kiện"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              {/* Nút lưu thay đổi: không có icon, chỉ sáng lên khi có chỉnh sửa (isDirty) */}
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving || isLoading || !isDirty}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isDirty && !isSaving
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                }`}
                title={
                  !isDirty
                    ? "Chưa có thay đổi nào để lưu"
                    : "Lưu các thay đổi của sự kiện"
                }
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete Concert */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[270] flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận xóa vĩnh viễn sự kiện
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa sự kiện{" "}
              <strong>&quot;{name}&quot;</strong> không? Toàn bộ thông tin cấu
              hình và hạng vé liên quan sẽ bị xóa vĩnh viễn. Thao tác này không
              thể hoàn tác!
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConcert}
                disabled={isDeletingConcert}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isDeletingConcert ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Change */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[260] flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-100">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận đổi trạng thái sự kiện
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái sự kiện{" "}
              <strong>&quot;{name}&quot;</strong> từ{" "}
              <span className="font-semibold text-slate-900">
                {STATUS_LABELS[currentStatus] || currentStatus}
              </span>{" "}
              sang{" "}
              <span className="font-semibold text-teal-700">
                {STATUS_LABELS[selectedStatus] || selectedStatus}
              </span>{" "}
              không?
            </p>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800">
              {STATUS_WARNING_MESSAGES[selectedStatus] ||
                "Hành động này sẽ thay đổi trạng thái mở bán của sự kiện."}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmStatusChange()}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
