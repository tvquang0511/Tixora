"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getVenues, VenueItem, ZonePreset } from "@/services/venue.service";
import {
  createConcert,
  updateConcert,
  getConcertById,
  CONCERT_CATEGORIES,
} from "@/services/concert.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";
import {
  Plus,
  Trash2,
  RotateCw,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ZoomIn,
} from "lucide-react";

interface TicketTierForm {
  id?: string;
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number;
}

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

export function toApiUrl(url?: string | null): string {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) {
    return `https://cdn.tixora.local${trimmed}`;
  }
  return trimmed;
}

function CreateOrEditEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  // Venues state
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CONCERT");
  const [performers, setPerformers] = useState<string[]>([]);
  const [newPerformer, setNewPerformer] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [svgMapUrl, setSvgMapUrl] = useState("");

  // Upload & Lightbox state
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingSvg, setIsUploadingSvg] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Ticket tiers
  const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([
    {
      name: "GA - Standing",
      price: 500000,
      total_quantity: 1000,
      max_per_user: 4,
      gate_number: 1,
    },
    {
      name: "VIP - Seated",
      price: 1500000,
      total_quantity: 300,
      max_per_user: 4,
      gate_number: 2,
    },
  ]);

  const [isLoadingDetails, setIsLoadingDetails] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    open: boolean;
    status: "DRAFT" | "PENDING_REVIEW";
  }>({ open: false, status: "PENDING_REVIEW" });

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const res = await getVenues({ limit: 50 });
        setVenues(res.data || []);
      } catch (err) {
        console.error("Failed to load venues", err);
      }
    };
    loadVenues();
  }, []);

  // Fetch event details if in Edit Mode
  useEffect(() => {
    if (!editId) return;
    let active = true;

    getConcertById(editId)
      .then((concert) => {
        if (!active) return;
        setName(concert.title || "");
        setDescription(concert.description || "");
        setCategory(concert.category || "CONCERT");
        setPerformers(concert.performers || []);
        setLocation(concert.location || concert.venue || "");
        if (concert.startTime) {
          const dt = new Date(concert.startTime);
          if (!isNaN(dt.getTime())) {
            const localIso = new Date(
              dt.getTime() - dt.getTimezoneOffset() * 60000,
            )
              .toISOString()
              .slice(0, 16);
            setStartTime(localIso);
          }
        }
        setPosterUrl(concert.posterUrl || "");
        setSvgMapUrl(resolveSvgMapUrl(concert.mapUrl) || "");
        if (concert.ticketTiers && concert.ticketTiers.length > 0) {
          setTicketTiers(
            concert.ticketTiers.map((t) => ({
              id: t.id,
              name: t.name,
              price: t.price,
              total_quantity: t.total_quantity,
              max_per_user: t.max_per_user || 4,
              gate_number: t.gate_number || 1,
            })),
          );
        }
        setIsLoadingDetails(false);
      })
      .catch((err) => {
        console.error("Failed to load concert for edit", err);
        if (active) {
          setError("Không thể tải thông tin sự kiện cần sửa.");
          setIsLoadingDetails(false);
        }
      });

    return () => {
      active = false;
    };
  }, [editId]);

  // When venue is selected, auto-fill location, svg, and zone presets
  const handleSelectVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    if (!venueId) return;

    const found = venues.find((v) => v.id === venueId);
    if (found) {
      setLocation(`${found.name}, ${found.address}, ${found.city}`);
      if (found.svg_template_url) {
        setSvgMapUrl(resolveSvgMapUrl(found.svg_template_url));
      }
      if (found.zone_presets && found.zone_presets.length > 0) {
        const tiers: TicketTierForm[] = found.zone_presets.map(
          (zp: ZonePreset) => ({
            name: zp.name,
            price: zp.default_price || 500000,
            total_quantity: 500,
            max_per_user: 4,
            gate_number: zp.gate_number || 1,
          }),
        );
        setTicketTiers(tiers);
      }
    }
  };

  const handleAddPerformer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPerformer.trim();
    if (!clean) return;
    if (performers.includes(clean)) {
      setNewPerformer("");
      return;
    }
    setPerformers([...performers, clean]);
    setNewPerformer("");
  };

  const handleRemovePerformer = (artist: string) => {
    setPerformers(performers.filter((p) => p !== artist));
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPoster(true);
      setError(null);
      const res = await uploadImage(file);
      setPosterUrl(res.url);
    } catch (err: unknown) {
      console.error("Poster upload failed", err);
      setError(err instanceof Error ? err.message : "Tải ảnh bìa thất bại");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingSvg(true);
      setError(null);
      const res = await uploadSvg(file);
      setSvgMapUrl(res.url);
    } catch (err: unknown) {
      console.error("SVG map upload failed", err);
      setError(err instanceof Error ? err.message : "Tải sơ đồ SVG thất bại");
    } finally {
      setIsUploadingSvg(false);
    }
  };

  const handleAddTier = () => {
    setTicketTiers([
      ...ticketTiers,
      {
        name: `Hạng vé ${ticketTiers.length + 1}`,
        price: 500000,
        total_quantity: 200,
        max_per_user: 4,
        gate_number: 1,
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) return;
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (
    index: number,
    field: keyof TicketTierForm,
    value: string | number | undefined,
  ) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTiers(updated);
  };

  const handleSave = async (targetStatus: "DRAFT" | "PENDING_REVIEW") => {
    if (!name.trim()) {
      setError("Vui lòng nhập Tên chương trình / Concert.");
      return;
    }
    if (!location.trim() || !startTime) {
      setError("Vui lòng điền đầy đủ Thời gian bắt đầu và Địa điểm tổ chức.");
      return;
    }
    if (ticketTiers.length === 0) {
      setError("Vui lòng cấu hình ít nhất 1 hạng vé.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || "Chưa có mô tả chi tiết.",
        location: location.trim(),
        ai_bio: "",
        start_time: new Date(startTime).toISOString(),
        svg_map_url:
          toApiUrl(svgMapUrl) || "https://cdn.tixora.local/maps/default.svg",
        poster_url: posterUrl?.trim() ? toApiUrl(posterUrl) : undefined,
        status: targetStatus,
        category: category || "CONCERT",
        venue_id: selectedVenueId || null,
        performers: performers,
        ticketTiers: ticketTiers.map((tier) => ({
          ...(tier.id ? { id: tier.id } : {}),
          name: tier.name.trim(),
          price: Number(tier.price) || 0,
          total_quantity: Number(tier.total_quantity) || 1,
          max_per_user: Number(tier.max_per_user) || 4,
          gate_number: tier.gate_number ? Number(tier.gate_number) : null,
        })),
      };

      if (isEdit && editId) {
        await updateConcert(editId, payload);
      } else {
        await createConcert(payload);
      }

      setSuccessInfo({ open: true, status: targetStatus });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lưu sự kiện thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="py-24 text-center text-slate-400">
        <RotateCw className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-3" />
        <p className="text-sm">Đang tải thông tin sự kiện để chỉnh sửa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isEdit ? "Chỉnh Sửa Sự Kiện" : "Tạo Sự Kiện Mới"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isEdit
              ? "Cập nhật thông tin chi tiết chương trình, sơ đồ và các hạng vé"
              : "Thiết lập thông tin chương trình, chọn sơ đồ địa điểm và cấu hình các hạng vé phân khu"}
          </p>
        </div>

        <Link
          href="/organizer/events"
          className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave("PENDING_REVIEW");
        }}
        className="space-y-8"
      >
        {/* Phần 1: Thông tin cơ bản sự kiện */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 border border-slate-700/80 shadow-xl shadow-black/30 space-y-6">
          <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
            1. Thông Tin Cơ Bản Sự Kiện
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên chương trình / Concert{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Anh Trai Say Hi Live Concert 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Thể loại sự kiện
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
              >
                {CONCERT_CATEGORIES.filter((c) => c.code !== "ALL").map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nghệ sĩ biểu diễn (Performers) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nghệ sĩ biểu diễn
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nhập tên nghệ sĩ và nhấn Thêm"
                  value={newPerformer}
                  onChange={(e) => setNewPerformer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPerformer();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddPerformer()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Thêm
                </button>
              </div>
              {performers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900/90 border border-slate-700/70 rounded-xl">
                  {performers.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full text-xs font-medium"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePerformer(p)}
                        className="hover:text-rose-400 text-teal-500 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mô tả giới thiệu sự kiện
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả nghệ sĩ tham gia, lưu ý vé, thời gian mở cửa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Poster Upload & Preview */}
            <div className="sm:col-span-2 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Ảnh bìa sự kiện (Poster)
              </label>

              {posterUrl && (
                <div
                  onClick={() => setLightboxUrl(posterUrl)}
                  className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center cursor-zoom-in group shadow-md"
                  title="Nhấp để phóng to ảnh bìa"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl}
                    alt="Poster preview"
                    className="w-full h-full object-cover transition-transform group-hover:scale-102"
                  />
                  <div className="absolute top-3 right-3 bg-slate-950/70 p-1.5 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              )}

              <div className="relative border-2 border-dashed border-slate-700 hover:border-teal-400/80 rounded-2xl p-5 bg-slate-900/60 transition-colors text-center cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterUpload}
                  disabled={isUploadingPoster}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-xs text-slate-300 font-medium">
                  {isUploadingPoster ? (
                    <span className="text-teal-400 animate-pulse">
                      Đang tải ảnh bìa lên...
                    </span>
                  ) : (
                    <>
                      <span className="text-teal-400 font-semibold underline">
                        Nhấp để tải ảnh bìa lên
                      </span>{" "}
                      hoặc kéo thả tập tin vào đây
                    </>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Định dạng PNG, JPG, WEBP tối đa 5MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phần 2: Địa điểm tổ chức & Sơ đồ phân khu */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 border border-slate-700/80 shadow-xl shadow-black/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
              2. Địa Điểm Tổ Chức & Sơ Đồ Phân Khu
            </h2>
            <span className="text-xs text-slate-400">
              Chọn mẫu địa điểm có sẵn để tự động tải sơ đồ SVG
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chọn mẫu địa điểm có sẵn (Venue Preset)
              </label>
              <select
                value={selectedVenueId}
                onChange={(e) => handleSelectVenue(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
              >
                <option value="">-- Chọn địa điểm từ hệ thống --</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} ({venue.city}) - Sức chứa{" "}
                    {venue.capacity ? venue.capacity.toLocaleString() : "N/A"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Thời gian bắt đầu biểu diễn{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa điểm tổ chức cụ thể <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Sân vận động Mỹ Đình, Lê Đức Thọ, Hà Nội"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Sơ đồ phân khu SVG Map & Preview Container */}
            <div className="sm:col-span-2 space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Sơ đồ phân khu ghế ngồi (SVG Map)
                </label>
                {svgMapUrl && (
                  <span className="text-[11px] text-teal-400 font-medium">
                    Đã tải sơ đồ
                  </span>
                )}
              </div>

              {/* KHUNG XEM TRƯỚC SƠ ĐỒ PHÂN KHU (Visual Map Preview) */}
              {svgMapUrl && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700/80 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Xem trước sơ đồ phân khu đã chọn
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxUrl(resolveSvgMapUrl(svgMapUrl))
                      }
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium underline cursor-pointer"
                    >
                      Phóng to toàn màn hình
                    </button>
                  </div>

                  <div
                    onClick={() => setLightboxUrl(resolveSvgMapUrl(svgMapUrl))}
                    className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-3 cursor-zoom-in group overflow-hidden"
                    title="Nhấp để phóng to sơ đồ phân khu"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveSvgMapUrl(svgMapUrl)}
                      alt="Sơ đồ phân khu"
                      className="max-w-full max-h-full object-contain transition-transform group-hover:scale-102"
                    />
                  </div>
                </div>
              )}

              {/* Upload SVG file */}
              <div className="relative border-2 border-dashed border-slate-700 hover:border-teal-400/80 rounded-2xl p-5 bg-slate-900/60 transition-colors text-center cursor-pointer group">
                <input
                  type="file"
                  accept=".svg,image/svg+xml,image/*"
                  onChange={handleSvgUpload}
                  disabled={isUploadingSvg}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-xs text-slate-300 font-medium">
                  {isUploadingSvg ? (
                    <span className="text-teal-400 animate-pulse">
                      Đang tải sơ đồ lên...
                    </span>
                  ) : (
                    <>
                      <span className="text-teal-400 font-semibold underline">
                        Nhấp để tải sơ đồ SVG mới lên
                      </span>{" "}
                      hoặc kéo thả tập tin vào đây
                    </>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hỗ trợ tệp SVG, PNG, JPG (tối đa 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phần 3: Cấu hình các hạng vé & giá bán */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/85 border border-slate-700/80 shadow-xl shadow-black/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
                3. Cấu Hình Các Hạng Vé & Giá Bán
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Định giá vé, số lượng phát hành và cổng soát vé tương ứng
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTier}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm hạng vé
            </button>
          </div>

          <div className="space-y-4">
            {ticketTiers.map((tier, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-md grid grid-cols-1 sm:grid-cols-5 gap-3 items-end hover:border-slate-600 transition-all"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Tên hạng vé
                  </label>
                  <input
                    type="text"
                    required
                    value={tier.name}
                    onChange={(e) =>
                      handleUpdateTier(index, "name", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/70 rounded-lg text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Giá vé (VNĐ)
                    </label>
                    <span className="text-[10px] text-teal-400 font-mono font-semibold">
                      {new Intl.NumberFormat("vi-VN").format(tier.price || 0)}đ
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={tier.price}
                    onChange={(e) =>
                      handleUpdateTier(index, "price", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/70 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Số lượng phát hành
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tier.total_quantity}
                    onChange={(e) =>
                      handleUpdateTier(
                        index,
                        "total_quantity",
                        Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/70 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Cổng / Gate
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tier.gate_number || 1}
                      onChange={(e) =>
                        handleUpdateTier(
                          index,
                          "gate_number",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/70 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Xóa hạng vé"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Action Bar ở chân trang */}
        <div className="sticky bottom-0 z-30 -mx-4 -mb-8 sm:-mx-6 lg:-mx-8 px-6 py-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-4 shadow-2xl">
          <Link
            href="/organizer/events"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Hủy bỏ
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSave("DRAFT")}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Lưu bản nháp
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSave("PENDING_REVIEW")}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 inline-flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEdit ? (
                "Cập nhật & Gửi duyệt"
              ) : (
                "Gửi duyệt sự kiện"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Lightbox Preview Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xs z-[300] flex items-center justify-center p-4 cursor-zoom-out select-none"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors cursor-pointer text-xl font-bold bg-white/10 hover:bg-white/20 w-9 h-9 rounded-lg flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Xem ảnh phóng to"
            className="max-w-full max-h-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
          />
        </div>
      )}

      {/* Success Modal */}
      {successInfo.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {successInfo.status === "DRAFT"
                  ? "Đã Lưu Bản Nháp!"
                  : isEdit
                    ? "Cập Nhật Thành Công!"
                    : "Gửi Sự Kiện Thành Công!"}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {successInfo.status === "DRAFT"
                  ? `Sự kiện "${name}" đã được lưu ở trạng thái Bản nháp. Bạn có thể quay lại tiếp tục chỉnh sửa bất cứ lúc nào.`
                  : `Chương trình "${name}" đã được nộp lên hệ thống Tixora ở trạng thái Chờ duyệt. Ban Quản Trị sẽ phản hồi trong thời gian sớm nhất.`}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => router.push("/organizer/events")}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/25 transition-transform active:scale-95 cursor-pointer"
              >
                Quản lý sự kiện của tôi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizerCreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-3" />
          <p className="text-sm">Đang tải biểu mẫu sự kiện...</p>
        </div>
      }
    >
      <CreateOrEditEventForm />
    </Suspense>
  );
}
