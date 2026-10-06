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
  CheckCircle2,
  Loader2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { createConcert, CreateConcertDto } from "@/services/concert.service";
import { getVenues, type VenueItem } from "@/services/venue.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";

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

export const CATEGORY_OPTIONS = [
  { value: "CONCERT", label: "Live Concert (Đại nhạc hội)" },
  { value: "MUSIC_FESTIVAL", label: "Lễ hội Âm nhạc (Music Festival)" },
  { value: "ACOUSTIC", label: "Đêm nhạc Trữ tình / Acoustic" },
  { value: "THEATRE", label: "Kịch nghệ & Nhạc kịch (Theatre)" },
  { value: "CONFERENCE", label: "Hội thảo & Sự kiện Doanh nghiệp" },
  { value: "SPORTS", label: "Sự kiện Thể thao & Giải đấu" },
  { value: "OTHER", label: "Khác" },
];

interface TicketTierItem {
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const { success, error: toastError, warning } = useToast();

  const [activeTab, setActiveTab] = useState<"info" | "media" | "tickets">(
    "info",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
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

  // Venues list
  const [venues, setVenues] = useState<VenueItem[]>([]);

  // Ticket Tiers
  const [ticketTiers, setTicketTiers] = useState<TicketTierItem[]>([
    {
      name: "Vé Tiêu Chuẩn (GA)",
      price: 350000,
      total_quantity: 500,
      max_per_user: 4,
      gate_number: 1,
    },
    {
      name: "Vé VIP (Gần Sân Khấu)",
      price: 950000,
      total_quantity: 150,
      max_per_user: 4,
      gate_number: 2,
    },
  ]);

  // Load venues on open
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
      },
      {
        name: "Vé VIP (Gần Sân Khấu)",
        price: 950000,
        total_quantity: 150,
        max_per_user: 4,
        gate_number: 2,
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
      toastError("Không thể tải ảnh poster lên. Vui lòng thử lại.");
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

  const handleTierChange = <K extends keyof TicketTierItem>(
    idx: number,
    field: K,
    value: TicketTierItem[K],
  ) => {
    const updated = [...ticketTiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setTicketTiers(updated);
  };

  // Calculations
  const totalTickets = ticketTiers.reduce(
    (sum, t) => sum + (Number(t.total_quantity) || 0),
    0,
  );
  const potentialRevenue = ticketTiers.reduce(
    (sum, t) => sum + (Number(t.price) || 0) * (Number(t.total_quantity) || 0),
    0,
  );

  const handleSubmit = async (targetStatus: "DRAFT" | "PENDING_REVIEW") => {
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
      const payload: CreateConcertDto = {
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
        ticketTiers: ticketTiers.map((t) => ({
          name: t.name.trim(),
          price: Number(t.price) || 0,
          total_quantity: Number(t.total_quantity) || 1,
          max_per_user: Number(t.max_per_user) || 4,
          gate_number: t.gate_number ? Number(t.gate_number) : null,
        })),
      };

      await createConcert(payload);
      success(
        targetStatus === "PENDING_REVIEW"
          ? "Đã gửi sự kiện lên sàn để phê duyệt thành công!"
          : "Đã lưu bản nháp sự kiện thành công!",
      );
      handleResetForm();
      onSuccess();
    } catch (err: unknown) {
      console.error("Create concert failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Tạo sự kiện thất bại. Vui lòng kiểm tra lại thông tin.";
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 text-left shadow-2xl shadow-black/60 transition-all flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Tạo Sự Kiện Mới
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thiết lập thông tin chương trình, sơ đồ khán phòng và phát
                  hành vé
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/30 px-6 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "info"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              1. Thông tin chung
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "media"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              2. Poster & Sơ đồ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tickets")}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === "tickets"
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              3. Cấu hình Hạng vé ({ticketTiers.length})
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
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
                      Thời gian bắt đầu <span className="text-rose-400">*</span>
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
                    Chọn địa điểm đối tác có sẵn (Khuyên dùng)
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
                        {v.name} ({v.city}) - Sức chứa: {v.capacity || "N/A"}{" "}
                        chỗ
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
                    rows={4}
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
                {/* Poster upload */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-teal-400" />
                        Ảnh Poster Banner Sự Kiện
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tỷ lệ đề xuất 16:9 hoặc 3:2, độ phân giải tối thiểu
                        1200x675
                      </p>
                    </div>

                    <label className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                      {isUploadingPoster ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Tải ảnh lên</span>
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
                          Chưa có ảnh poster
                        </span>
                      )}
                    </div>
                    <div className="w-full flex-1 space-y-1">
                      <label className="text-[11px] text-slate-400">
                        Hoặc nhập trực tiếp đường dẫn URL hình ảnh:
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

                {/* SVG Map Selection */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-400" />
                        Sơ đồ khán phòng & Phân khu (SVG)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chọn sơ đồ chuẩn hệ thống hoặc tải lên file SVG vector
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
                        !SYSTEM_SVG_MAPS.some((m) => m.value === svgMapUrl) && (
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

            {/* TAB 3: CẤU HÌNH HẠNG VÉ */}
            {activeTab === "tickets" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Danh sách các Hạng vé mở bán
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cấu hình mức giá, số lượng ghế tối đa và cổng check-in
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
                      key={idx}
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
                            placeholder="VD: VIP 1, GA, Early Bird..."
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

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-teal-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>
                      Tổng số vé:{" "}
                      <strong>{totalTickets.toLocaleString("vi-VN")}</strong> vé
                    </span>
                  </div>
                  <div className="text-teal-300 font-semibold">
                    Doanh thu dự kiến:{" "}
                    <span className="text-white text-sm font-bold">
                      {potentialRevenue.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-slate-800 bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => void handleSubmit("DRAFT")}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Lưu Bản nháp
              </button>

              <button
                type="button"
                onClick={() => void handleSubmit("PENDING_REVIEW")}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 inline-flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tạo sự kiện...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gửi duyệt sự kiện</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
