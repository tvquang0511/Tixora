"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  MapPin,
  Ticket,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { createConcert } from "@/services/concert.service";
import { getVenues, type VenueItem } from "@/services/venue.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";
import { getErrorMessage } from "@/utils/error.utils";
import { SYSTEM_SVG_MAPS, resolveSvgMapUrl } from "./ConcertEditDrawer";

interface TicketTierItem {
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
  position: number;
  status: string;
  sales_start_at: string;
}

interface CreateConcertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "CONCERT", label: "Live Concert (Đại nhạc hội)" },
  { value: "MUSIC_FESTIVAL", label: "Lễ hội Âm nhạc (Music Festival)" },
  { value: "ACOUSTIC", label: "Đêm nhạc Trữ tình / Acoustic" },
  { value: "THEATRE", label: "Kịch nghệ & Nhạc kịch (Theatre)" },
  { value: "CONFERENCE", label: "Hội thảo & Sự kiện Doanh nghiệp" },
  { value: "SPORTS", label: "Sự kiện Thể thao & Giải đấu" },
];

export function CreateConcertModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateConcertModalProps) {
  const { success, error: toastError, warning } = useToast();

  // Active sub-tab in modal: "info" | "media" | "tickets"
  const [activeTab, setActiveTab] = useState<"info" | "media" | "tickets">(
    "info",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingSvg, setIsUploadingSvg] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CONCERT");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [venueId, setVenueId] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [svgMapUrl, setSvgMapUrl] = useState("/maps/default.svg");

  // Performers tags
  const [performers, setPerformers] = useState<string[]>([]);
  const [newPerformer, setNewPerformer] = useState("");

  // Venues list from DB
  const [venues, setVenues] = useState<VenueItem[]>([]);

  // Ticket Tiers
  const [ticketTiers, setTicketTiers] = useState<TicketTierItem[]>([
    {
      name: "Vé Tiêu Chuẩn (GA)",
      price: 350000,
      total_quantity: 500,
      max_per_user: 4,
      gate_number: 1,
      position: 1,
      status: "book_now",
      sales_start_at: new Date().toISOString().slice(0, 16),
    },
    {
      name: "Vé VIP (Gần Sân Khấu)",
      price: 950000,
      total_quantity: 150,
      max_per_user: 4,
      gate_number: 2,
      position: 2,
      status: "book_now",
      sales_start_at: new Date().toISOString().slice(0, 16),
    },
  ]);

  // Load venues on mount
  useEffect(() => {
    if (isOpen) {
      getVenues({ limit: 100 })
        .then((res) => {
          if (res?.data) setVenues(res.data);
        })
        .catch((err) => {
          console.error("Failed to load venues:", err);
        });
    }
  }, [isOpen]);

  // Reset form when opening modal
  const handleResetForm = () => {
    setName("");
    setCategory("CONCERT");
    setStartTime("");
    setLocation("");
    setVenueId("");
    setDescription("");
    setPosterUrl("");
    setSvgMapUrl("/maps/default.svg");
    setPerformers([]);
    setNewPerformer("");
    setTicketTiers([
      {
        name: "Vé Tiêu Chuẩn (GA)",
        price: 350000,
        total_quantity: 500,
        max_per_user: 4,
        gate_number: 1,
        position: 1,
        status: "book_now",
        sales_start_at: new Date().toISOString().slice(0, 16),
      },
      {
        name: "Vé VIP (Gần Sân Khấu)",
        price: 950000,
        total_quantity: 150,
        max_per_user: 4,
        gate_number: 2,
        position: 2,
        status: "book_now",
        sales_start_at: new Date().toISOString().slice(0, 16),
      },
    ]);
    setActiveTab("info");
  };

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

  // Performers tag addition
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

  // Upload poster image
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImage(file);
      setPosterUrl(res.url);
      success("Tải ảnh poster thành công!");
    } catch (err) {
      console.error("Poster upload failed:", err);
      toastError("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Upload SVG Map
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

  // Tier operations
  const handleAddTier = () => {
    const nextIdx = ticketTiers.length + 1;
    setTicketTiers([
      ...ticketTiers,
      {
        name: `Hạng Vé ${nextIdx}`,
        price: 250000,
        total_quantity: 200,
        max_per_user: 4,
        gate_number: nextIdx,
        position: nextIdx,
        status: "book_now",
        sales_start_at: new Date().toISOString().slice(0, 16),
      },
    ]);
  };

  const handleRemoveTier = (idx: number) => {
    if (ticketTiers.length <= 1) {
      warning("Sự kiện cần tối thiểu một hạng vé mở bán.");
      return;
    }
    setTicketTiers(ticketTiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTier = <K extends keyof TicketTierItem>(
    idx: number,
    field: K,
    value: TicketTierItem[K],
  ) => {
    const updated = [...ticketTiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setTicketTiers(updated);
  };

  // Summary calculations
  const totalTickets = ticketTiers.reduce(
    (sum, t) => sum + (Number(t.total_quantity) || 0),
    0,
  );
  const potentialRevenue = ticketTiers.reduce(
    (sum, t) => sum + (Number(t.price) || 0) * (Number(t.total_quantity) || 0),
    0,
  );

  // Submit form
  const handleSubmit = async (
    e: FormEvent,
    targetStatus: "DRAFT" | "PUBLISHED",
  ) => {
    e.preventDefault();

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

    // Validate ticket tiers
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
      const payload = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        venue_id: venueId || null,
        ai_bio: name.trim(),
        start_time: startDt.toISOString(),
        svg_map_url: svgMapUrl || "/maps/default.svg",
        poster_url: posterUrl.trim() || undefined,
        status: targetStatus,
        category,
        performers,
        ticketTiers: ticketTiers.map((t, i) => ({
          name: t.name.trim(),
          price: Number(t.price) || 0,
          total_quantity: Number(t.total_quantity) || 0,
          max_per_user: Number(t.max_per_user) || 4,
          gate_number: t.gate_number ? Number(t.gate_number) : null,
          position: i + 1,
          status: t.status || "book_now",
          sales_start_at: t.sales_start_at
            ? new Date(t.sales_start_at).toISOString()
            : null,
        })),
      };

      await createConcert(payload);
      success(
        targetStatus === "PUBLISHED"
          ? "Tạo và mở bán sự kiện thành công!"
          : "Lưu bản nháp sự kiện thành công!",
      );
      handleResetForm();
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create event:", err);
      toastError(`Tạo sự kiện thất bại: ${getErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl sm:max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* ── Modal Header ── */}
            <div className="p-4 sm:px-6 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                    Tạo sự kiện mới
                  </h3>
                  <p className="text-slate-500 text-[11px] truncate mt-0.5">
                    Thiết lập thông tin chương trình, sơ đồ khán phòng và các
                    hạng vé
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Tab Bar Navigation ── */}
            <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-white">
              <div className="htcaa-segmented w-full grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`htcaa-segmented-item text-xs py-1.5 flex items-center justify-center gap-1.5 ${
                    activeTab === "info" ? "active" : ""
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>1. Thông tin chung</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className={`htcaa-segmented-item text-xs py-1.5 flex items-center justify-center gap-1.5 ${
                    activeTab === "media" ? "active" : ""
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>2. Ảnh & Sơ đồ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tickets")}
                  className={`htcaa-segmented-item text-xs py-1.5 flex items-center justify-center gap-1.5 ${
                    activeTab === "tickets" ? "active" : ""
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>3. Hạng vé ({ticketTiers.length})</span>
                </button>
              </div>
            </div>

            {/* ── Modal Body (Scrollable) ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: THÔNG TIN CHUNG */}
              {activeTab === "info" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên sự kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Những Thành Phố Mơ Màng - Tour 2026"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0052ff] bg-white text-slate-900 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Thể loại chương trình
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="select-trigger w-full"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Thời gian bắt đầu sự kiện{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0052ff] bg-white text-slate-900 font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Chọn từ địa điểm mẫu (Tùy chọn)
                      </label>
                      <select
                        value={venueId}
                        onChange={(e) => handleVenueChange(e.target.value)}
                        className="select-trigger w-full"
                      >
                        <option value="">
                          -- Chọn địa điểm trong hệ thống --
                        </option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.city})
                            {v.capacity
                              ? ` - Sức chứa: ${v.capacity.toLocaleString("vi-VN")}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Địa chỉ & Nơi tổ chức{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Trung tâm Triển lãm SECC, Quận 7, TP. HCM"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0052ff] bg-white text-slate-900 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nghệ sĩ / Khách mời biểu diễn
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập tên nghệ sĩ rồi bấm Thêm…"
                        value={newPerformer}
                        onChange={(e) => setNewPerformer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPerformer();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0052ff] bg-white text-slate-900 font-sans"
                      />
                      <button
                        type="button"
                        onClick={handleAddPerformer}
                        className="btn btn-secondary btn-sm shrink-0"
                      >
                        Thêm
                      </button>
                    </div>

                    {performers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {performers.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200"
                          >
                            <span>{p}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePerformer(p)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mô tả chương trình
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Giới thiệu nội dung, thời lượng, quy định độ tuổi và các lưu ý check-in…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0052ff] bg-white text-slate-900 font-sans resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HÌNH ẢNH & SƠ ĐỒ */}
              {activeTab === "media" && (
                <div className="space-y-5 text-xs">
                  {/* Poster Image Section */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        Ảnh Poster / Banner sự kiện
                      </span>
                      {posterUrl && (
                        <button
                          type="button"
                          onClick={() => setPosterUrl("")}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          Gỡ ảnh
                        </button>
                      )}
                    </div>

                    <div className="flex items-start gap-4 flex-col sm:flex-row">
                      <div className="w-28 h-36 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center relative">
                        {posterUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={posterUrl}
                            alt="Poster preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2 text-slate-400 text-[10px]">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <span>Chưa có ảnh</span>
                          </div>
                        )}
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#0052ff] animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <p className="text-[11px] text-slate-500">
                          Định dạng hỗ trợ: JPG, PNG, WebP. Kích thước khuyến
                          nghị 3:4 hoặc 16:9.
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {isUploadingImage
                                ? "Đang tải…"
                                : "Tải ảnh từ máy"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                          value={posterUrl}
                          onChange={(e) => setPosterUrl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seat Map / Hall Map Section */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <span className="font-semibold text-slate-800 block">
                      Sơ đồ khán phòng (Seat Map SVG)
                    </span>

                    <div className="space-y-2">
                      <label className="block text-[11px] text-slate-600">
                        Chọn sơ đồ khán phòng chuẩn có sẵn:
                      </label>
                      <select
                        value={svgMapUrl}
                        onChange={(e) => setSvgMapUrl(e.target.value)}
                        className="select-trigger w-full"
                      >
                        {SYSTEM_SVG_MAPS.map((map) => (
                          <option key={map.value} value={map.value}>
                            {map.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingSvg
                            ? "Đang tải sơ đồ…"
                            : "Tải file SVG tùy chỉnh"}
                        </span>
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          onChange={handleSvgMapUpload}
                          disabled={isUploadingSvg}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-500 truncate">
                        Sơ đồ hiện tại:{" "}
                        <strong className="text-slate-700 font-mono">
                          {svgMapUrl}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: HẠNG VÉ & BẢNG GIÁ */}
              {activeTab === "tickets" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        Cấu hình các hạng vé
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Thiết lập giá bán, số lượng phát hành và cổng check-in
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTier}
                      className="btn btn-secondary btn-sm inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm hạng vé</span>
                    </button>
                  </div>

                  {/* Tier items table */}
                  <div className="space-y-2.5">
                    {ticketTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-[#0052ff] transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0052ff] font-bold text-[11px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>Hạng vé #{idx + 1}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            disabled={ticketTiers.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Xóa hạng vé này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Tên hạng vé
                            </label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) =>
                                handleUpdateTier(idx, "name", e.target.value)
                              }
                              placeholder="VD: VIP, Khán đài A, GA…"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Giá vé (VND)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="10000"
                              value={tier.price}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "price",
                                  Math.max(0, Number(e.target.value)),
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Số lượng vé
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={tier.total_quantity}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "total_quantity",
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Cổng soát vé
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={tier.gate_number || ""}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "gate_number",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              placeholder="Cổng 1, 2…"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Vé tối đa / người
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={tier.max_per_user}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "max_per_user",
                                  Math.max(1, Number(e.target.value)),
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Mở bán từ lúc
                            </label>
                            <input
                              type="datetime-local"
                              value={tier.sales_start_at}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "sales_start_at",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[11.5px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">
                        Tổng vé phát hành:{" "}
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {totalTickets.toLocaleString("vi-VN")} vé
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">
                        GMV tối đa ước tính:{" "}
                      </span>
                      <strong className="text-[#0052ff] font-mono font-bold">
                        {new Intl.NumberFormat("vi-VN").format(
                          potentialRevenue,
                        )}
                        đ
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Modal Footer ── */}
            <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeTab !== "info" && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(activeTab === "tickets" ? "media" : "info")
                    }
                    className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                )}
                {activeTab !== "tickets" && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(activeTab === "info" ? "media" : "tickets")
                    }
                    className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                  >
                    <span>Tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="btn btn-secondary btn-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "DRAFT")}
                  disabled={isSaving}
                  className="btn btn-secondary btn-sm"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Lưu bản nháp</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "PUBLISHED")}
                  disabled={isSaving}
                  className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Mở bán ngay</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
