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
import { uploadImage, uploadSvg } from "@/services/upload.service";
import { getErrorMessage } from "@/utils/error.utils";
import {
  ChevronRight,
  Info,
  ImagePlus,
  Ticket,
  PlusCircle,
  Trash2,
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    start_time: "",
    svg_map_url: "https://cdn.tixora.local/maps/default.svg",
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
            start_time: formattedDate,
            svg_map_url:
              data.mapUrl || "https://cdn.tixora.local/maps/default.svg",
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

  const handleSave = async () => {
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
      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        start_time: startDate.toISOString(),
        svg_map_url: formData.svg_map_url,
        poster_url: formData.poster_url,
        status: formData.status,
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
        success("Tạo sự kiện mới thành công!");
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
      <div className="max-w-[850px] mx-auto">
        <div className="space-y-6">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider border-b border-slate-100 pb-3 mb-5 flex items-center gap-2 text-slate-900">
              <Info className="w-4 h-4 text-teal-600" />
              Thông tin cơ bản sự kiện
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
                  Mô tả ngắn
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                  placeholder="Nhập mô tả ngắn gọn về sự kiện..."
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                    Địa điểm tổ chức *
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                    type="text"
                    placeholder="Ví dụ: Sân vận động Quân khu 7"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                    Thời gian bắt đầu *
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
                <div>
                  <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái sự kiện
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-sans cursor-pointer font-medium"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="DRAFT">DRAFT (Bản nháp)</option>
                    <option value="PUBLISHED">PUBLISHED (Phát hành)</option>
                    <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Ảnh bìa sự kiện (Poster)
                </label>
                {formData.poster_url && (
                  <div
                    onClick={() => setLightboxUrl(formData.poster_url)}
                    className="mb-3 relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-zoom-in group shadow-xs"
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
                <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 hover:border-teal-500 bg-slate-50/50 transition-colors cursor-pointer group relative">
                  <input
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    disabled={isUploadingImage}
                  />
                  <div className="text-center font-sans">
                    <ImagePlus className="w-8 h-8 mx-auto text-slate-400 group-hover:text-teal-600 transition-colors mb-2" />
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-teal-600 underline">
                        {isUploadingImage
                          ? "Đang tải ảnh lên..."
                          : "Chọn tập tin ảnh"}
                      </span>{" "}
                      {!isUploadingImage && "hoặc kéo thả vào đây"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, WEBP tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-slate-700 mb-1">
                  Sơ đồ phân khu ghế ngồi (SVG Map)
                </label>
                {formData.svg_map_url &&
                  formData.svg_map_url !==
                    "https://cdn.tixora.local/maps/default.svg" && (
                    <div
                      onClick={() => setLightboxUrl(formData.svg_map_url)}
                      className="mb-3 relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-4 cursor-zoom-in group shadow-xs"
                      title="Click để phóng to sơ đồ ghế ngồi"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.svg_map_url}
                        alt="Sơ đồ ghế ngồi"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 hover:border-teal-500 bg-slate-50/50 transition-colors cursor-pointer group relative">
                  <input
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    type="file"
                    accept=".svg,image/svg+xml,image/*"
                    onChange={handleSvgMapChange}
                    disabled={isUploadingSvg}
                  />
                  <div className="text-center font-sans">
                    <ImagePlus className="w-8 h-8 mx-auto text-slate-400 group-hover:text-teal-600 transition-colors mb-2" />
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-teal-600 underline">
                        {isUploadingSvg
                          ? "Đang tải sơ đồ lên..."
                          : "Chọn tập tin sơ đồ"}
                      </span>{" "}
                      {!isUploadingSvg && "hoặc kéo thả vào đây"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hỗ trợ SVG, PNG, JPG, WEBP dung lượng tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Ticketing */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-slate-900">
                <Ticket className="w-4 h-4 text-teal-600" />
                Cấu hình các hạng vé
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
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-4 flex justify-end gap-2 z-30 select-none shadow-md">
        <button
          type="button"
          onClick={handleCancelClick}
          className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-sans text-xs font-medium cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 rounded-lg bg-teal-600 text-white font-sans text-xs font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isSaving
            ? "Đang lưu dữ liệu..."
            : isEditing
              ? "Lưu thay đổi"
              : "Hoàn tất tạo sự kiện"}
        </button>
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
