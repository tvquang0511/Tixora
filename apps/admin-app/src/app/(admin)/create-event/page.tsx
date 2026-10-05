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
  PlusCircle,
  Trash2,
  Upload,
  Maximize2,
} from "lucide-react";
import { SYSTEM_SVG_MAPS } from "../events/_components/ConcertEditDrawer";

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
      <div className="card max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        <h3 className="font-sans text-sm font-semibold text-slate-900">
          {title}
        </h3>
        <p className="font-sans text-xs text-slate-600 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="btn btn-secondary btn-sm cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger btn-sm cursor-pointer"
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
      <div className="head stickyhead">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex text-slate-400 font-sans text-xs font-medium mb-1"
          >
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li className="inline-flex items-center">
                <Link
                  className="hover:text-[#0052ff] transition-colors"
                  href="/events"
                >
                  Sự kiện
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400" />
                  <span className="text-[#0052ff] font-semibold">
                    {isEditing ? "Chỉnh sửa" : "Tạo mới"}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="htcaa-h1">
            {isEditing
              ? "Chỉnh sửa thông tin sự kiện"
              : "Thiết lập sự kiện mới"}
          </h1>
          <p className="sub">
            {isEditing
              ? "Cập nhật nội dung, sơ đồ sân khấu và thiết lập các hạng vé"
              : "Khởi tạo sự kiện ca nhạc, địa điểm tổ chức và phân hạng bán vé"}
          </p>
        </div>
      </div>

      {/* Form Wizard */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Section 1: Basic Info */}
        <section className="card p-5 space-y-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider border-b border-slate-100 pb-3 text-slate-900">
            1. Thông tin cơ bản sự kiện
          </h3>
          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                Tên sự kiện *
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs transition-colors"
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
                className="select-trigger w-full text-xs font-sans"
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
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-sans transition-colors"
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
                  className="btn btn-secondary btn-sm shrink-0 cursor-pointer"
                >
                  Thêm
                </button>
              </div>
              {formData.performers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/70 border border-slate-100 rounded-lg">
                  {formData.performers.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0052ff] rounded-full text-xs font-sans font-medium select-none"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePerformer(p)}
                        className="hover:text-rose-600 text-[#0052ff] transition-colors font-bold cursor-pointer"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs transition-colors"
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
              <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-6 hover:border-[#0052ff] bg-slate-50/50 transition-colors cursor-pointer group relative">
                <input
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  disabled={isUploadingImage}
                />
                <div className="text-center font-sans">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-[#0052ff] underline">
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

        {/* Section 2: Venue & Timing */}
        <section className="card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Địa Điểm & Thời Gian Tổ Chức
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Chọn địa điểm từ danh sách cơ sở có sẵn hoặc nhập địa chỉ sự
                kiện
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
            <div>
              <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                Chọn cơ sở / địa điểm có sẵn (Venue Preset)
              </label>
              <select
                className="select-trigger w-full text-xs font-sans font-medium"
                value={formData.venue_id}
                onChange={(e) => handleVenueSelect(e.target.value)}
              >
                <option value="">
                  -- Chọn địa điểm từ hệ thống (nếu có) --
                </option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city}) - Sức chứa:{" "}
                    {v.capacity ? v.capacity.toLocaleString() : "Chưa xác định"}
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-sans transition-colors"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                Địa điểm tổ chức cụ thể <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs transition-colors"
                type="text"
                placeholder="Ví dụ: Sân vận động Quốc gia Mỹ Đình, Lê Đức Thọ, Hà Nội"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>
        </section>

        {/* Section 3: Seating Map & Stage */}
        <section className="card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Sơ Đồ Ghế & Sân Khấu
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Sơ đồ trực quan định vị sân khấu, các khán đài và phân khu chỗ
                ngồi
              </p>
            </div>
            <label className="btn btn-secondary btn-sm cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {isUploadingSvg ? "Đang tải lên..." : "Tải sơ đồ SVG mới"}
              </span>
              <input
                type="file"
                accept=".svg,image/svg+xml,image/*"
                onChange={handleSvgMapChange}
                disabled={isUploadingSvg}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* Dropdown for system preset SVG maps */}
            <div>
              <label className="block font-sans text-xs font-semibold text-slate-700 mb-1.5">
                Chọn sơ đồ mẫu chuẩn hệ thống
              </label>
              <select
                value={
                  SYSTEM_SVG_MAPS.some((m) => m.value === formData.svg_map_url)
                    ? formData.svg_map_url
                    : formData.svg_map_url
                      ? "__custom__"
                      : ""
                }
                onChange={(e) => {
                  if (e.target.value !== "__custom__") {
                    setFormData((prev) => ({
                      ...prev,
                      svg_map_url: e.target.value,
                    }));
                  }
                }}
                className="select-trigger w-full text-xs font-sans font-medium"
              >
                <option value="">-- Chọn mẫu sơ đồ từ hệ thống --</option>
                {SYSTEM_SVG_MAPS.map((mapPreset) => (
                  <option key={mapPreset.value} value={mapPreset.value}>
                    {mapPreset.label}
                  </option>
                ))}
                {formData.svg_map_url &&
                  !SYSTEM_SVG_MAPS.some(
                    (m) => m.value === formData.svg_map_url,
                  ) && (
                    <option value="__custom__">
                      Sơ đồ tùy chỉnh / Đường dẫn riêng (
                      {formData.svg_map_url.slice(0, 35)}...)
                    </option>
                  )}
              </select>
            </div>

            {/* Visual Preview Box */}
            {formData.svg_map_url ? (
              <div className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#0052ff]" />
                    <span className="text-xs font-semibold text-slate-800">
                      Mặt bằng phân khu khán giả & Sân khấu
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxUrl(resolveSvgMapUrl(formData.svg_map_url))
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#0052ff] hover:underline font-semibold cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Phóng to toàn màn hình</span>
                  </button>
                </div>

                <div
                  onClick={() =>
                    setLightboxUrl(resolveSvgMapUrl(formData.svg_map_url))
                  }
                  className="w-full h-64 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-4 cursor-zoom-in group shadow-2xs overflow-hidden relative"
                  title="Nhấp để phóng to toàn màn hình"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveSvgMapUrl(formData.svg_map_url)}
                    alt="Sơ đồ ghế ngồi và sân khấu"
                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Nhấp để phóng to
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/40">
                <p className="text-xs text-slate-500 font-medium">
                  Chưa có sơ đồ ghế
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chọn một mẫu từ hệ thống ở trên hoặc tải file SVG để hiển thị
                  sơ đồ phân khu
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Ticketing */}
        <section className="card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-900">
              4. Cấu hình các hạng vé & giá bán
            </h3>
            <button
              onClick={handleAddTier}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#0052ff]" /> Thêm hạng vé
            </button>
          </div>

          {ticketCategories.map((tier, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 relative shadow-2xs space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <input
                  className="font-sans text-sm font-semibold bg-white border border-slate-200 px-3 py-1.5 w-2/3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] rounded-lg transition-colors"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-sans">
                <div>
                  <label className="block font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Giá vé (VNĐ)
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs text-right font-mono transition-colors"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs text-right font-mono transition-colors"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-mono transition-colors"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-mono transition-colors"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-mono transition-colors"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] text-xs font-sans transition-colors"
                    type="datetime-local"
                    value={tier.sales_start_at}
                    onChange={(e) =>
                      handleTierChange(index, "sales_start_at", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block font-sans text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Trạng thái bán vé
                  </label>
                  <select
                    className="select-trigger w-full text-xs font-sans font-medium"
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

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[250px] bg-white/95 backdrop-blur-xs border-t border-slate-200 px-6 py-3 flex items-center justify-between z-30 select-none shadow-md">
        <button
          type="button"
          onClick={handleCancelClick}
          className="btn btn-secondary btn-sm cursor-pointer"
        >
          Hủy bỏ
        </button>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => handleSave("DRAFT")}
              disabled={isSaving}
              className="btn btn-secondary btn-sm cursor-pointer"
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
            className="btn btn-primary btn-sm cursor-pointer"
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
