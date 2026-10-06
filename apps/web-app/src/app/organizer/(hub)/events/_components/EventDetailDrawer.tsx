"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  MapPin,
  Ticket,
  Image as ImageIcon,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Calendar,
  Save,
  Pause,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import {
  getConcertById,
  updateConcert,
  deleteConcert,
  ConcertDetailItem,
  CreateConcertDto,
} from "@/services/concert.service";
import { getVenues, type VenueItem } from "@/services/venue.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";
import {
  SYSTEM_SVG_MAPS,
  CATEGORY_OPTIONS,
  resolveSvgMapUrl,
} from "./CreateEventModal";

interface EditableTicketTier {
  id?: string;
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
  remaining_quantity?: number;
}

interface EventDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concertId: string | null;
  onSuccess: (updated: { id: string; [key: string]: unknown }) => void;
  onDeleteSuccess?: (id: string) => void;
}

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

export const STATUS_BADGE_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PENDING_REVIEW:
    "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse",
  DRAFT: "bg-slate-800 text-slate-400 border-slate-700",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  APPROVED: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export function EventDetailDrawer({
  isOpen,
  onClose,
  concertId,
  onSuccess,
  onDeleteSuccess,
}: EventDetailDrawerProps) {
  const { success, error: toastError, warning } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active drawer tab: "info" | "media" | "tickets" | "status"
  const [activeTab, setActiveTab] = useState<
    "info" | "media" | "tickets" | "status"
  >("info");

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CONCERT");
  const [location, setLocation] = useState("");
  const [venueId, setVenueId] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [svgMapUrl, setSvgMapUrl] = useState("/maps/default.svg");
  const [currentStatus, setCurrentStatus] = useState("DRAFT");
  const [selectedStatus, setSelectedStatus] = useState("DRAFT");
  const [ticketTiers, setTicketTiers] = useState<EditableTicketTier[]>([]);
  const [performers, setPerformers] = useState<string[]>([]);
  const [newPerformer, setNewPerformer] = useState("");

  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingSvg, setIsUploadingSvg] = useState(false);

  // Load venues once
  useEffect(() => {
    if (isOpen) {
      getVenues({ limit: 100 })
        .then((res) => {
          if (res?.data) setVenues(res.data);
        })
        .catch((err) => console.error("Failed to load venues", err));
    }
  }, [isOpen]);

  // Load concert details when concertId changes
  useEffect(() => {
    if (!isOpen || !concertId) return;

    let active = true;
    const timer = setTimeout(() => {
      setIsLoading(true);

      getConcertById(concertId)
        .then((data: ConcertDetailItem) => {
          if (!active) return;
          setName(data.title || "");
          setCategory(data.category || "CONCERT");
          setLocation(data.location || data.venue || "");
          setVenueId(data.venue_id || "");
          setDescription(data.description || "");
          setPosterUrl(data.posterUrl || "");
          setSvgMapUrl(data.mapUrl || "/maps/default.svg");
          setCurrentStatus(data.status || "DRAFT");
          setSelectedStatus(data.status || "DRAFT");
          setPerformers(data.performers || []);

          if (data.startTime) {
            const d = new Date(data.startTime);
            if (!isNaN(d.getTime())) {
              setStartTime(d.toISOString().slice(0, 16));
            } else {
              setStartTime("");
            }
          } else {
            setStartTime("");
          }

          if (data.ticketTiers && data.ticketTiers.length > 0) {
            setTicketTiers(
              data.ticketTiers.map((t) => ({
                id: t.id,
                name: t.name,
                price: t.price,
                total_quantity: t.total_quantity,
                max_per_user: t.max_per_user || 4,
                gate_number: t.gate_number,
                remaining_quantity: t.remaining_quantity,
              })),
            );
          } else {
            setTicketTiers([]);
          }
        })
        .catch((err) => {
          console.error("Failed to load concert details:", err);
          if (active) {
            toastError("Không thể tải thông tin chi tiết sự kiện.");
            onClose();
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, concertId, onClose, toastError]);

  const handleVenueChange = (selectedVenueId: string) => {
    setVenueId(selectedVenueId);
    if (!selectedVenueId) return;

    const matchedVenue = venues.find((v) => v.id === selectedVenueId);
    if (matchedVenue) {
      setLocation(`${matchedVenue.name}, ${matchedVenue.city}`);
      if (matchedVenue.svg_template_url) {
        setSvgMapUrl(resolveSvgMapUrl(matchedVenue.svg_template_url));
      }
    }
  };

  const handleAddPerformer = () => {
    const trimmed = newPerformer.trim();
    if (trimmed && !performers.includes(trimmed)) {
      setPerformers([...performers, trimmed]);
      setNewPerformer("");
    }
  };

  const handleRemovePerformer = (item: string) => {
    setPerformers(performers.filter((p) => p !== item));
  };

  const handlePosterUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPoster(true);
      const res = await uploadImage(file);
      setPosterUrl(res.url);
      success("Tải ảnh poster thành công!");
    } catch (err) {
      console.error("Poster upload failed:", err);
      toastError("Không thể tải ảnh poster lên.");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleSvgMapUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingSvg(true);
      const res = await uploadSvg(file);
      setSvgMapUrl(res.url);
      success("Tải sơ đồ khán phòng thành công!");
    } catch (err) {
      console.error("SVG Map upload failed:", err);
      toastError("Không thể tải sơ đồ SVG lên.");
    } finally {
      setIsUploadingSvg(false);
    }
  };

  const handleAddTier = () => {
    const nextIdx = ticketTiers.length + 1;
    setTicketTiers([
      ...ticketTiers,
      {
        name: `Hạng Vé ${nextIdx}`,
        price: 250000,
        total_quantity: 200,
        max_per_user: 4,
        gate_number: 1,
      },
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    if (ticketTiers.length <= 1) {
      warning("Sự kiện cần tối thiểu 1 hạng vé.");
      return;
    }
    setTicketTiers(ticketTiers.filter((_, i) => i !== idx));
  };

  const handleTierChange = <K extends keyof EditableTicketTier>(
    idx: number,
    field: K,
    value: EditableTicketTier[K],
  ) => {
    const updated = [...ticketTiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setTicketTiers(updated);
  };

  const handleSave = async (customStatus?: string) => {
    if (!concertId) return;

    if (!name.trim()) {
      setActiveTab("info");
      warning("Vui lòng nhập tên sự kiện.");
      return;
    }

    if (!location.trim()) {
      setActiveTab("info");
      warning("Vui lòng nhập hoặc chọn địa điểm tổ chức.");
      return;
    }

    if (!startTime) {
      setActiveTab("info");
      warning("Vui lòng chọn thời gian bắt đầu sự kiện.");
      return;
    }

    const startDt = new Date(startTime);
    if (isNaN(startDt.getTime())) {
      setActiveTab("info");
      warning("Thời gian bắt đầu sự kiện không hợp lệ.");
      return;
    }

    if (ticketTiers.length === 0) {
      setActiveTab("tickets");
      warning("Vui lòng cấu hình ít nhất 1 hạng vé.");
      return;
    }

    for (const t of ticketTiers) {
      if (!t.name.trim()) {
        setActiveTab("tickets");
        warning("Tên hạng vé không được để trống.");
        return;
      }
      if (t.total_quantity <= 0) {
        setActiveTab("tickets");
        warning(`Hạng vé "${t.name}" cần có số lượng phát hành lớn hơn 0.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const finalStatus = customStatus || selectedStatus || currentStatus;

      const payload: Partial<CreateConcertDto> = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        venue_id: venueId || null,
        start_time: startDt.toISOString(),
        svg_map_url: svgMapUrl || "/maps/default.svg",
        poster_url: posterUrl.trim() || undefined,
        status: finalStatus,
        category,
        performers,
        ticketTiers: ticketTiers.map((t) => ({
          ...(t.id ? { id: t.id } : {}),
          name: t.name.trim(),
          price: Number(t.price) || 0,
          total_quantity: Number(t.total_quantity) || 1,
          max_per_user: Number(t.max_per_user) || 4,
          gate_number: t.gate_number ? Number(t.gate_number) : null,
        })),
      };

      await updateConcert(concertId, payload);
      success("Cập nhật thông tin sự kiện thành công!");
      setCurrentStatus(finalStatus);
      onSuccess({
        id: concertId,
        title: name.trim(),
        venue: location.trim(),
        status: finalStatus,
        category,
        posterUrl: posterUrl.trim(),
      });
    } catch (err: unknown) {
      console.error("Update concert failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Cập nhật sự kiện thất bại. Vui lòng kiểm tra lại.";
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const canDelete = currentStatus === "DRAFT" || currentStatus === "REJECTED";

  const handleDelete = async () => {
    if (!concertId || !canDelete) return;
    setIsDeleting(true);
    try {
      await deleteConcert(concertId);
      success(`Đã xóa sự kiện "${name}" thành công!`);
      setShowDeleteModal(false);
      onDeleteSuccess?.(concertId);
      onClose();
    } catch (err: unknown) {
      console.error("Delete concert failed:", err);
      toastError("Xóa sự kiện thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const totalCap = ticketTiers.reduce(
    (sum, t) => sum + (Number(t.total_quantity) || 0),
    0,
  );
  const minPrice =
    ticketTiers.length > 0
      ? Math.min(...ticketTiers.map((t) => Number(t.price) || 0))
      : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body text-xs">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full pl-6 flex">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-screen max-w-2xl sm:max-w-3xl bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl relative text-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {name || "Chi Tiết Sự Kiện"}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      STATUS_BADGE_STYLES[currentStatus] ||
                      "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {STATUS_LABELS[currentStatus] || currentStatus}
                  </span>
                </div>
                {concertId && (
                  <p className="text-[11px] font-mono text-teal-400">
                    Mã: TIX-{concertId.slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStatus === "PUBLISHED" && (
                  <a
                    href={`/concerts/${concertId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Trang bán vé</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-400 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <span className="block text-[10px] text-slate-500">
                  Sức chứa
                </span>
                <span className="font-bold text-white">
                  {totalCap.toLocaleString("vi-VN")} chỗ
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <span className="block text-[10px] text-slate-500">
                  Giá vé từ
                </span>
                <span className="font-bold text-teal-400">
                  {minPrice.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <span className="block text-[10px] text-slate-500">
                  Hạng vé
                </span>
                <span className="font-bold text-white">
                  {ticketTiers.length} phân khu
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <span className="block text-[10px] text-slate-500">
                  Địa điểm
                </span>
                <span className="font-bold text-white truncate block">
                  {location || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/30 px-6 gap-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "info"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Thông tin chung
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "media"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Poster & Sơ đồ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "tickets"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Hạng vé ({ticketTiers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === "status"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Trạng thái & Quản trị
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {isLoading ? (
              <div className="py-20 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
                Đang tải dữ liệu chi tiết sự kiện...
              </div>
            ) : (
              <>
                {/* TAB 1: THÔNG TIN CHUNG */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Tên sự kiện / Show diễn{" "}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Live Concert Tinh Hoa Bắc Bộ 2026..."
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Thể loại chương trình
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Thời gian bắt đầu{" "}
                          <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Chọn địa điểm đối tác có sẵn
                      </label>
                      <select
                        value={venueId}
                        onChange={(e) => handleVenueChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                      >
                        <option value="">
                          -- Tự nhập địa điểm tổ chức riêng --
                        </option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.city}) - Sức chứa:{" "}
                            {v.capacity || "N/A"} chỗ
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Địa chỉ chi tiết nơi tổ chức{" "}
                        <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="VD: Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nghệ sĩ biểu diễn / Lineup
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPerformer}
                          onChange={(e) => setNewPerformer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddPerformer();
                            }
                          }}
                          placeholder="Nhập tên ca sĩ/nghệ sĩ và nhấn Enter hoặc Thêm..."
                          className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddPerformer}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                        >
                          Thêm
                        </button>
                      </div>
                      {performers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {performers.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs"
                            >
                              {p}
                              <button
                                type="button"
                                onClick={() => handleRemovePerformer(p)}
                                className="hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mô tả giới thiệu sự kiện
                      </label>
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả nội dung chương trình, các mốc thời gian, quy định tham gia..."
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: POSTER & SƠ ĐỒ */}
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {/* Poster */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-teal-400" />
                            Ảnh Poster Banner Sự Kiện
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tỷ lệ đề xuất 16:9 hoặc 3:2, độ phân giải sắc nét
                          </p>
                        </div>

                        <label className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                          {isUploadingPoster ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Tải ảnh mới</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                          {posterUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={posterUrl}
                              alt="Poster Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Chưa có poster
                            </span>
                          )}
                        </div>
                        <div className="w-full flex-1 space-y-1">
                          <label className="text-[11px] text-slate-400">
                            Hoặc nhập URL hình ảnh trực tiếp:
                          </label>
                          <input
                            type="text"
                            value={posterUrl}
                            onChange={(e) => setPosterUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SVG Map */}
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-400" />
                            Sơ đồ khán phòng & Phân khu (SVG)
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Chọn sơ đồ mẫu chuẩn hệ thống hoặc tải lên file SVG
                            vector
                          </p>
                        </div>

                        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                          {isUploadingSvg ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Tải file SVG</span>
                          <input
                            type="file"
                            accept=".svg,image/svg+xml"
                            onChange={handleSvgMapUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

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
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                        >
                          {SYSTEM_SVG_MAPS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                          {svgMapUrl &&
                            !SYSTEM_SVG_MAPS.some(
                              (m) => m.value === svgMapUrl,
                            ) && (
                              <option value="__custom__">
                                Sơ đồ tùy chỉnh ({svgMapUrl.slice(0, 30)}...)
                              </option>
                            )}
                        </select>
                      </div>

                      {svgMapUrl && (
                        <div className="h-44 rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={svgMapUrl}
                            alt="SVG Map Preview"
                            className="max-h-full max-w-full object-contain filter invert-0 opacity-90"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: HẠNG VÉ */}
                {activeTab === "tickets" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Danh sách Hạng vé
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Điều chỉnh giá bán, hạn mức mua và cổng check-in
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm hạng vé
                      </button>
                    </div>

                    <div className="space-y-3">
                      {ticketTiers.map((tier, idx) => (
                        <div
                          key={tier.id || idx}
                          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-400">
                              Hạng vé #{idx + 1}
                            </span>
                            {ticketTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Tên hạng vé
                              </label>
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) =>
                                  handleTierChange(idx, "name", e.target.value)
                                }
                                placeholder="VIP, GA, Early Bird..."
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
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
                                    Math.max(0, Number(e.target.value) || 0),
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Số lượng vé phát hành
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={tier.total_quantity}
                                onChange={(e) =>
                                  handleTierChange(
                                    idx,
                                    "total_quantity",
                                    Math.max(1, Number(e.target.value) || 1),
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  Max / Người
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
                                      Math.max(1, Number(e.target.value) || 1),
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  Cổng vào (Gate)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={tier.gate_number || 1}
                                  onChange={(e) =>
                                    handleTierChange(
                                      idx,
                                      "gate_number",
                                      Number(e.target.value) || 1,
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: TRẠNG THÁI & QUẢN TRỊ */}
                {activeTab === "status" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        Trạng thái vận hành của sự kiện
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Chuyển đổi trạng thái xử lý sự kiện phù hợp với tiến độ
                        tổ chức.
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Gửi duyệt nếu đang DRAFT hoặc REJECTED */}
                        {(currentStatus === "DRAFT" ||
                          currentStatus === "REJECTED") && (
                          <button
                            type="button"
                            onClick={() => void handleSave("PENDING_REVIEW")}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Gửi yêu cầu sàn phê duyệt
                          </button>
                        )}

                        {/* Tạm ngưng nếu đang PUBLISHED */}
                        {currentStatus === "PUBLISHED" && (
                          <button
                            type="button"
                            onClick={() => void handleSave("PAUSED")}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Tạm ngưng mở bán vé
                          </button>
                        )}

                        {/* Tiếp tục mở bán nếu đang PAUSED */}
                        {currentStatus === "PAUSED" && (
                          <button
                            type="button"
                            onClick={() => void handleSave("PUBLISHED")}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Tiếp tục mở bán vé
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lưu ý quy định kiểm duyệt */}
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                      <span className="font-semibold text-slate-300 block">
                        Quy trình phê duyệt sự kiện:
                      </span>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          Khi gửi{" "}
                          <strong>Chờ sàn duyệt (PENDING_REVIEW)</strong>, ban
                          quản trị Tixora sẽ kiểm tra giấy tờ và nội dung trong
                          vòng 2-4 giờ làm việc.
                        </li>
                        <li>
                          Sau khi được duyệt, sự kiện sẽ tự động chuyển sang{" "}
                          <strong>Đang mở bán (PUBLISHED)</strong> theo đúng
                          lịch phát hành vé.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-800 bg-slate-900/60 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isSaving || isDeleting}
                  className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa sự kiện
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 inline-flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Xác nhận xóa sự kiện?
              </h3>
              <p className="text-xs text-slate-400">
                Hành động này sẽ xóa hoàn toàn sự kiện &quot;{name}&quot; và
                không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
