"use client";

import Link from "next/link";
import { useEffect, useState, Suspense, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import {
  createConcert,
  updateConcert,
  getConcertById,
} from "@/services/concert.service";
import { getVenues, type VenueItem } from "@/services/venue.service";
import { uploadImage, uploadSvg } from "@/services/upload.service";
import { getErrorMessage } from "@/utils/error.utils";
import {
  ChevronRight,
  Info,
  ImagePlus,
  Ticket,
  PlusCircle,
  Trash2,
  Building2,
} from "lucide-react";

type TicketCategory = {
  id?: string;
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number | null;
  position: number;
  status: string;
  sales_start_at: string;
};

const formatNumberString = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined || value === "") return "";
  const numString = String(value).replace(/\D/g, "");
  if (!numString) return "";
  const num = parseInt(numString, 10);
  return new Intl.NumberFormat("vi-VN").format(num);
};

const parseFormattedNumber = (value: string): number => {
  const cleanString = value.replace(/\./g, "").replace(/,/g, "");
  const num = parseInt(cleanString, 10);
  return isNaN(num) ? 0 : num;
};

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

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[250] flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <h3 className="font-sans text-sm font-semibold text-slate-900">
          {title}
        </h3>
        <p className="font-sans text-xs text-slate-600 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-sans font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-sans font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const { success, error: toastError, warning } = useToast();

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingSvg, setIsUploadingSvg] = useState(false);

  // Confirmation Modals State
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Lightbox view state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Performers tags state
  const [newPerformer, setNewPerformer] = useState("");

  // Venues Preset State
  const [venues, setVenues] = useState<VenueItem[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    venue_id: "",
    start_time: "",
    svg_map_url: "/maps/default.svg",
    poster_url: "",
    status: "DRAFT",
    category: "CONCERT",
    performers: [] as string[],
  });

  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>(
    () => [
      {
        name: "Vé Phổ Thông",
        price: 500000,
        total_quantity: 1000,
        max_per_user: 4,
        gate_number: 1,
        position: 1,
        status: "book_now",
        sales_start_at: new Date().toISOString().slice(0, 16),
      },
    ],
  );

  const handleCoverImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImage(file);
      setFormData((prev) => ({ ...prev, poster_url: res.url }));
      success("Đăng tải ảnh bìa thành công!");
    } catch (error) {
      console.error("Image upload failed", error);
      toastError("Tải ảnh bìa lên thất bại.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSvgMapChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    try {
      setIsUploadingSvg(true);
      let res;
      if (isSvg) {
        res = await uploadSvg(file);
      } else {
        res = await uploadImage(file);
      }
      setFormData((prev) => ({ ...prev, svg_map_url: res.url }));
      success("Đăng tải sơ đồ ghế ngồi thành công!");
    } catch (error) {
      console.error("Map upload failed", error);
      toastError("Tải sơ đồ ghế ngồi thất bại.");
    } finally {
      setIsUploadingSvg(false);
    }
  };

  useEffect(() => {
    getVenues({ limit: 100 })
      .then((res) => {
        if (res && res.data) {
          setVenues(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load venues", err);
      });
  }, []);

  useEffect(() => {
    if (editId) {
      getConcertById(editId)
        .then((data) => {
          let formattedDate = "";
          try {
            if (data.startTime) {
              const dateObj = new Date(data.startTime);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toISOString().slice(0, 16);
              }
            }
          } catch {
            // Ignore date formatting issues
          }

          setFormData({
            name: data.title || "",
            description: data.description || "",
            location:
              data.venue && data.city
                ? `${data.venue}, ${data.city}`
                : data.venue || "",
            venue_id: data.venue_id || "",
            start_time: formattedDate,
            svg_map_url: resolveSvgMapUrl(data.mapUrl) || "/maps/default.svg",
            poster_url: data.posterUrl || "",
            status: data.status || "DRAFT",
            category: data.category || "CONCERT",
            performers: data.performers || [],
          });

          if (data.ticketTiers && data.ticketTiers.length > 0) {
            setTicketCategories(
              data.ticketTiers.map((t) => ({
                id: t.id,
                name: t.name,
                price: t.price,
                total_quantity: t.total_quantity,
                max_per_user: t.max_per_user,
                gate_number: t.gate_number ?? null,
                position: t.position ?? 1,
                status: t.status || "book_now",
                sales_start_at: t.sales_start_at
                  ? new Date(t.sales_start_at).toISOString().slice(0, 16)
                  : "",
              })),
            );
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load concert", err);
          toastError("Không thể tải thông tin sự kiện.");
          setIsLoading(false);
        });
    }
  }, [editId, toastError]);

  const handleVenueSelect = (selectedVenueId: string) => {
    if (!selectedVenueId) {
      setFormData((prev) => ({ ...prev, venue_id: "" }));
      return;
    }

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);
    if (!selectedVenue) return;

    const resolvedMapUrl = resolveSvgMapUrl(selectedVenue.svg_template_url);

    setFormData((prev) => ({
      ...prev,
      venue_id: selectedVenue.id,
      location: `${selectedVenue.name}, ${selectedVenue.address}, ${selectedVenue.city}`,
      svg_map_url: resolvedMapUrl || prev.svg_map_url,
    }));

    if (
      selectedVenue.zone_presets &&
      Array.isArray(selectedVenue.zone_presets) &&
      selectedVenue.zone_presets.length > 0
    ) {
      const perZoneCap = Math.floor(
        (selectedVenue.capacity || 1000) / selectedVenue.zone_presets.length,
      );
      const newTiers: TicketCategory[] = selectedVenue.zone_presets.map(
        (zp, idx) => ({
          name: zp.name,
          price: zp.default_price || 500000,
          total_quantity: perZoneCap,
          max_per_user: 4,
          gate_number: zp.gate_number || idx + 1,
          position: idx + 1,
          status: "book_now",
          sales_start_at: new Date().toISOString().slice(0, 16),
        }),
      );
      setTicketCategories(newTiers);
      success(
        `Đã tự động áp dụng sơ đồ & ${newTiers.length} phân khu vé mẫu từ ${selectedVenue.name}!`,
      );
    } else {
      success(`Đã chọn địa điểm ${selectedVenue.name}!`);
    }
  };

  const handleSave = async (targetStatus?: string) => {
    if (!formData.name || !formData.location || !formData.start_time) {
      warning(
        "Vui lòng điền đầy đủ Tên sự kiện, Địa điểm và Thời gian bắt đầu.",
      );
      return;
    }

    const startDate = new Date(formData.start_time);
    if (startDate <= new Date()) {
      warning("Thời gian bắt đầu sự kiện phải ở tương lai.");
      return;
    }

    setIsSaving(true);
    try {
      const finalStatus = targetStatus || formData.status || "DRAFT";
      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        venue_id: formData.venue_id || null,
        start_time: startDate.toISOString(),
        svg_map_url:
          toApiUrl(formData.svg_map_url) ||
          "https://cdn.tixora.local/maps/default.svg",
        poster_url: formData.poster_url?.trim()
          ? toApiUrl(formData.poster_url)
          : undefined,
        status: finalStatus,
        category: formData.category || "CONCERT",
        performers: formData.performers,
        ticketTiers: ticketCategories.map((tc) => ({
          id: tc.id,
          name: tc.name,
          price: Number(tc.price),
          total_quantity: Number(tc.total_quantity),
          max_per_user: Number(tc.max_per_user),
          gate_number: tc.gate_number ? Number(tc.gate_number) : null,
          position: Number(tc.position),
          status: tc.status,
          sales_start_at:
            tc.sales_start_at && tc.sales_start_at.trim() !== ""
              ? new Date(tc.sales_start_at).toISOString()
              : null,
        })),
      };

      if (isEditing) {
        await updateConcert(editId, payload);
        success("Cập nhật sự kiện thành công!");
      } else {
        await createConcert({ ...payload, ai_bio: "" });
        success(
          finalStatus === "PUBLISHED"
            ? "Tạo và mở bán sự kiện thành công!"
            : "Lưu bản nháp sự kiện thành công!",
        );
      }
      router.push("/events");
    } catch (error: unknown) {
      console.error("Failed to save event", error);
      toastError(`Lưu sự kiện thất bại: ${getErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTier = () => {
    const nextPos = ticketCategories.length + 1;
    setTicketCategories([
      ...ticketCategories,
      {
        name: `Hạng Vé ${nextPos}`,
        price: 0,
        total_quantity: 100,
        max_per_user: 4,
        gate_number: 1,
        position: nextPos,
        status: "book_now",
        sales_start_at: new Date().toISOString().slice(0, 16),
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setConfirmDeleteIdx(index);
  };

  const confirmDeleteTier = () => {
    if (confirmDeleteIdx !== null) {
      setTicketCategories(
        ticketCategories.filter((_, i) => i !== confirmDeleteIdx),
      );
      setConfirmDeleteIdx(null);
      success("Đã xóa hạng vé thành công.");
    }
  };

  const handleTierChange = (
    index: number,
    field: keyof TicketCategory,
    value: string | number | null,
  ) => {
    const newTiers = [...ticketCategories];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketCategories(newTiers);
  };

  const handleAddPerformer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newPerformer.trim();
    if (!cleanName) return;
    if (formData.performers.includes(cleanName)) {
      warning("Nghệ sĩ này đã có trong danh sách.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      performers: [...prev.performers, cleanName],
    }));
    setNewPerformer("");
  };

  const handleRemovePerformer = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      performers: prev.performers.filter((p) => p !== name),
    }));
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formData.name || formData.location || ticketCategories.length > 1) {
      setConfirmCancel(true);
    } else {
      router.push("/events");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="pb-4 border-b border-slate-200">
        <nav
          aria-label="Breadcrumb"
          className="flex text-slate-500 font-sans text-xs font-medium mb-1"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link
                className="hover:text-teal-600 transition-colors"
                href="/events"
              >
                Sự kiện
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400" />
                <span className="text-teal-600 font-semibold">
                  {isEditing ? "Chỉnh sửa" : "Tạo mới"}
                </span>
              </div>
            </li>
          </ol>
        </nav>
        <h2 className="font-sans text-xl font-bold text-slate-900">
          {isEditing ? "Chỉnh sửa thông tin sự kiện" : "Thiết lập sự kiện mới"}
        </h2>
      </header>

      {/* Form Wizard */}
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3 mb-5 text-slate-900">
              1. Thông tin cơ bản sự kiện
            </h3>
            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Tên sự kiện *
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                  placeholder="Ví dụ: Mắt Nhắm Mắt Mở 2026"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Thể loại sự kiện *
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="CONCERT">Live Concert</option>
                  <option value="LIVE_MUSIC">Nhạc Sống & Band</option>
                  <option value="EDM_NIGHTLIFE">EDM & Party</option>
                  <option value="FESTIVAL">Festival & Lễ hội</option>
                  <option value="THEATER_ARTS">Sân khấu & Kịch</option>
                  <option value="FANMEETING">Fan Meeting</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              {/* Performers Input chips */}
              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Nghệ sĩ biểu diễn
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans"
                    placeholder="Nhập tên nghệ sĩ và nhấn Thêm (hoặc Enter)"
                    type="text"
                    value={newPerformer}
                    onChange={(e) => setNewPerformer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPerformer(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPerformer}
                    className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    Thêm
                  </button>
                </div>
                {formData.performers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/70 border border-slate-100 rounded-lg">
                    {formData.performers.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-sans font-medium select-none"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => handleRemovePerformer(p)}
                          className="hover:text-rose-600 text-teal-500 transition-colors font-bold cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 font-sans italic">
                    Chưa cấu hình nghệ sĩ nào cho sự kiện.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Mô tả sự kiện
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                  placeholder="Nhập mô tả về sự kiện, thời gian mở cửa, lưu ý..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Ảnh bìa sự kiện (Poster)
                </label>
                {formData.poster_url && (
                  <div
                    onClick={() => setLightboxUrl(formData.poster_url)}
                    className="mb-3 relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-zoom-in group shadow-xs flex items-center justify-center"
                    title="Click để phóng to ảnh bìa"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.poster_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-6 hover:border-teal-500 bg-slate-50/50 transition-colors cursor-pointer group relative">
                  <input
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    disabled={isUploadingImage}
                  />
                  <div className="text-center font-sans">
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-teal-600 underline">
                        {isUploadingImage
                          ? "Đang tải ảnh lên..."
                          : "Tải ảnh bìa mới lên"}
                      </span>{" "}
                      {!isUploadingImage && "hoặc kéo thả tập tin vào đây"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, WEBP tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Venue & Seating Map */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Địa Điểm Tổ Chức & Sơ Đồ Phân Khu
              </h3>
              <span className="text-[11px] text-slate-500 font-sans">
                Chọn mẫu địa điểm có sẵn để tự động tải sơ đồ SVG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                  Chọn mẫu địa điểm có sẵn (Venue Preset)
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans cursor-pointer font-medium"
                  value={formData.venue_id}
                  onChange={(e) => handleVenueSelect(e.target.value)}
                >
                  <option value="">-- Chọn địa điểm từ hệ thống --</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city}) - Sức chứa:{" "}
                      {v.capacity
                        ? v.capacity.toLocaleString()
                        : "Chưa xác định"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                  Thời gian bắt đầu biểu diễn{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                  Địa điểm tổ chức cụ thể{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                  type="text"
                  placeholder="Ví dụ: Sân vận động Quốc gia Mỹ Đình, Lê Đức Thọ, Hà Nội"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              {/* Sơ đồ phân khu SVG Map & Preview Container */}
              <div className="sm:col-span-2 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-sans text-xs font-semibold text-slate-700">
                    Sơ đồ phân khu ghế ngồi (SVG Map)
                  </label>
                  {formData.svg_map_url && (
                    <span className="text-[11px] text-teal-600 font-medium">
                      Đã tải sơ đồ
                    </span>
                  )}
                </div>

                {/* SƠ ĐỒ PHÂN KHU XEM TRƯỚC (Preview Box) */}
                {formData.svg_map_url && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        Xem trước sơ đồ phân khu đã chọn
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxUrl(resolveSvgMapUrl(formData.svg_map_url))
                        }
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer underline"
                      >
                        Phóng to toàn màn hình
                      </button>
                    </div>
                    <div
                      onClick={() =>
                        setLightboxUrl(resolveSvgMapUrl(formData.svg_map_url))
                      }
                      className="w-full h-64 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-3 cursor-zoom-in group shadow-2xs overflow-hidden"
                      title="Nhấp để phóng to sơ đồ ghế ngồi"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveSvgMapUrl(formData.svg_map_url)}
                        alt="Sơ đồ ghế ngồi"
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-102"
                      />
                    </div>
                  </div>
                )}

                {/* Upload SVG file */}
                <div className="relative border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 bg-slate-50/50 transition-colors text-center cursor-pointer group">
                  <input
                    type="file"
                    accept=".svg,image/svg+xml,image/*"
                    onChange={handleSvgMapChange}
                    disabled={isUploadingSvg}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center font-sans">
                    <p className="text-xs text-slate-700 font-medium">
                      {isUploadingSvg ? (
                        <span className="text-teal-600 animate-pulse font-semibold">
                          Đang tải sơ đồ lên...
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-teal-600 underline">
                            Nhấp để tải sơ đồ SVG mới lên
                          </span>{" "}
                          hoặc kéo thả tập tin vào đây
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hỗ trợ tệp SVG, PNG, JPG (tối đa 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Ticketing */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Cấu hình các hạng vé & giá bán
              </h3>
              <button
                onClick={handleAddTier}
                className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors font-sans text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm hạng vé
              </button>
            </div>

            {ticketCategories.map((tier, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50/70 relative shadow-xs"
              >
                <div className="flex justify-between items-start mb-3">
                  <input
                    className="font-sans text-sm font-semibold bg-white border border-slate-300 px-3 py-1.5 w-2/3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-lg"
                    placeholder="Tên hạng vé (ví dụ: VIP, GA, SVIP...)"
                    type="text"
                    value={tier.name}
                    onChange={(e) =>
                      handleTierChange(index, "name", e.target.value)
                    }
                  />
                  <button
                    onClick={() => handleRemoveTier(index)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa hạng vé"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 font-sans">
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Giá vé (VNĐ)
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-right font-mono"
                      type="text"
                      value={formatNumberString(tier.price)}
                      onChange={(e) => {
                        const rawVal = parseFormattedNumber(e.target.value);
                        handleTierChange(index, "price", rawVal);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Tổng số lượng vé
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-right font-mono"
                      type="text"
                      value={formatNumberString(tier.total_quantity)}
                      onChange={(e) => {
                        const rawVal = parseFormattedNumber(e.target.value);
                        handleTierChange(index, "total_quantity", rawVal);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Tối đa / Người mua
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono"
                      type="number"
                      value={tier.max_per_user}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "max_per_user",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Số cổng vào
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono"
                      type="number"
                      placeholder="Ví dụ: 1"
                      value={tier.gate_number ?? ""}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "gate_number",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                  </div>
                </div>

                {/* Additional parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 font-sans">
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Thứ tự hiển thị
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono"
                      type="number"
                      value={tier.position}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "position",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Thời gian mở bán
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans"
                      type="datetime-local"
                      value={tier.sales_start_at}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          "sales_start_at",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Trạng thái bán vé
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans cursor-pointer font-medium"
                      value={tier.status}
                      onChange={(e) =>
                        handleTierChange(index, "status", e.target.value)
                      }
                    >
                      <option value="book_now">BOOK NOW (Đang mở bán)</option>
                      <option value="sold_out">SOLD OUT (Hết vé)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 flex items-center justify-between z-30 select-none shadow-md">
        <button
          type="button"
          onClick={handleCancelClick}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-xs font-medium cursor-pointer"
        >
          Hủy bỏ
        </button>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => handleSave("DRAFT")}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-sans text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              Lưu bản nháp
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              handleSave(isEditing ? formData.status : "PUBLISHED")
            }
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-teal-600 text-white font-sans text-xs font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSaving
              ? "Đang lưu dữ liệu..."
              : isEditing
                ? "Lưu thay đổi"
                : "Phát hành & Mở bán"}
          </button>
        </div>
      </div>

      {/* Reusable Confirm Modals */}
      <ConfirmModal
        isOpen={confirmDeleteIdx !== null}
        title="Xác nhận xóa hạng vé"
        message="Bạn có chắc chắn muốn xóa hạng vé này? Các thông tin cấu hình giá và số lượng vé của hạng này sẽ mất."
        confirmLabel="Xóa hạng vé"
        cancelLabel="Hủy"
        onConfirm={confirmDeleteTier}
        onCancel={() => setConfirmDeleteIdx(null)}
      />

      <ConfirmModal
        isOpen={confirmCancel}
        title="Hủy bỏ thay đổi"
        message="Bạn có chắc chắn muốn rời đi? Các thay đổi chưa lưu trên biểu mẫu sẽ bị mất."
        confirmLabel="Rời đi"
        cancelLabel="Ở lại"
        onConfirm={() => router.push("/events")}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-xs z-[300] flex items-center justify-center p-4 cursor-zoom-out select-none"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors cursor-pointer text-xl font-bold bg-white/10 hover:bg-white/20 w-9 h-9 rounded-lg flex items-center justify-center font-sans"
            onClick={() => setLightboxUrl(null)}
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Xem ảnh lớn"
            className="max-w-full max-h-full object-contain rounded-2xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin border-2 border-slate-900 border-t-transparent" />
        </div>
      }
    >
      <EventForm />
    </Suspense>
  );
}
