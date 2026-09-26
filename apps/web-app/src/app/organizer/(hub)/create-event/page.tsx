"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVenues, VenueItem, ZonePreset } from "@/services/venue.service";
import { createConcert, CONCERT_CATEGORIES } from "@/services/concert.service";
import {
  Building2,
  Plus,
  Trash2,
  RotateCw,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Ticket,
} from "lucide-react";

interface TicketTierForm {
  name: string;
  price: number;
  total_quantity: number;
  max_per_user: number;
  gate_number?: number;
}

export default function OrganizerCreateEventPage() {
  const router = useRouter();

  // Venues state
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CONCERT");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [svgMapUrl, setSvgMapUrl] = useState("");

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

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

  // When venue is selected, auto-fill location, svg, and zone presets
  const handleSelectVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    const found = venues.find((v) => v.id === venueId);

    if (found) {
      setLocation(`${found.name}, ${found.address}, ${found.city}`);
      if (found.svg_template_url) {
        setSvgMapUrl(found.svg_template_url);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !startTime) {
      setError(
        "Vui lòng điền đầy đủ Tên sự kiện, Thời gian bắt đầu và Địa điểm.",
      );
      return;
    }

    if (ticketTiers.length === 0) {
      setError("Vui lòng cấu hình ít nhất 1 hạng vé.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createConcert({
        name: name.trim(),
        description: description.trim() || "Chưa có mô tả chi tiết.",
        location: location.trim(),
        ai_bio: "",
        start_time: new Date(startTime).toISOString(),
        svg_map_url: svgMapUrl.trim() || "/maps/default-venue.svg",
        poster_url: posterUrl.trim() || "/Mockimg.webp",
        status: "PENDING_REVIEW",
        ticketTiers: ticketTiers.map((tier) => ({
          name: tier.name.trim(),
          price: Number(tier.price) || 0,
          total_quantity: Number(tier.total_quantity) || 1,
          max_per_user: Number(tier.max_per_user) || 4,
          gate_number: tier.gate_number ? Number(tier.gate_number) : null,
        })),
      });

      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tạo sự kiện thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Plus className="w-6 h-6 text-teal-400" />
            Tạo Sự Kiện Mới
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập thông tin chương trình, chọn sơ đồ địa điểm và cấu hình
            các hạng vé phân khu
          </p>
        </div>

        <Link
          href="/organizer/events"
          className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 self-start sm:self-auto"
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Thông tin sự kiện */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
          <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> 1. Thông Tin Chung Sự Kiện
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Thể loại sự kiện
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {CONCERT_CATEGORIES.filter((c) => c.code !== "ALL").map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              />
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
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Poster hình ảnh sự kiện (URL)
              </label>
              <input
                type="url"
                placeholder="https://example.com/poster.jpg"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Địa điểm & Sơ đồ Venue Presets */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> 2. Địa Điểm Tổ Chức & Sơ Đồ Phân
              Khu
            </h2>
            <span className="text-xs text-slate-400">
              Chọn mẫu sân vận động có sẵn để tự động tải sơ đồ SVG
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
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Chọn địa điểm từ hệ thống --</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} ({venue.city}) - Sức chứa{" "}
                    {venue.capacity || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa điểm tổ chức cụ thể <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Sân vận động Mỹ Đình, Lê Đức Thọ, Hà Nội"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Đường dẫn sơ đồ phân khu (SVG Map Template)
              </label>
              <input
                type="text"
                placeholder="/maps/my-dinh-stadium.svg"
                value={svgMapUrl}
                onChange={(e) => setSvgMapUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Cấu hình Hạng Vé (Ticket Tiers) */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-4 h-4" /> 3. Danh Sách Các Hạng Vé Phân Khu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Định giá vé, số lượng phát hành và cổng soát vé tương ứng
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTier}
              className="px-3 py-1.5 rounded-lg bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm hạng vé
            </button>
          </div>

          <div className="space-y-3">
            {ticketTiers.map((tier, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Giá vé (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={tier.price}
                    onChange={(e) =>
                      handleUpdateTier(index, "price", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Cửa / Gate
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
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  {ticketTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
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

        {/* Submit Action */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">
            Sự kiện sau khi tạo sẽ ở trạng thái{" "}
            <span className="font-semibold text-amber-400">
              Chờ duyệt (PENDING_REVIEW)
            </span>{" "}
            để Ban Quản Trị Tixora thẩm định.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 cursor-pointer inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Đang gửi sự kiện...
              </>
            ) : (
              <>
                Gửi Duyệt Sự Kiện
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Gửi Sự Kiện Thành Công!
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Chương trình <strong>{name}</strong> đã được nộp lên hệ thống
                Tixora ở trạng thái <strong>Chờ duyệt (PENDING_REVIEW)</strong>.
                Ban Quản Trị sẽ kiểm tra tính hợp lệ và phê duyệt mở bán trong
                thời gian sớm nhất.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => router.push("/organizer/events")}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2"
              >
                Quản lý sự kiện của tôi
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
