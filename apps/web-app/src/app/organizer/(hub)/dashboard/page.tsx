"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getConcerts,
  ConcertCardItem,
  getConcertPosterUrl,
} from "@/services/concert.service";
import {
  Building2,
  Calendar,
  PlusCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  ArrowRight,
  MapPin,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    getConcerts({
      organizer_id: user.id,
      limit: 50,
    })
      .then((res) => {
        if (active) {
          setConcerts(res.items || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load organizer events", err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const totalConcerts = concerts.length;
  const publishedConcerts = concerts.filter(
    (c) => c.status === "PUBLISHED",
  ).length;
  const pendingConcerts = concerts.filter(
    (c) => c.status === "PENDING_REVIEW",
  ).length;

  const totalTickets = concerts.reduce((acc, c) => {
    const tierSum = (c.ticketTiers || []).reduce(
      (tAcc, t) => tAcc + (t.total_quantity || 0),
      0,
    );
    return acc + tierSum;
  }, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            Không gian làm việc Ban Tổ Chức
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Xin chào, {user?.fullName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-body">
            Theo dõi tình trạng phê duyệt, doanh số và vận hành các show diễn
            của bạn trên Tixora.
          </p>
        </div>

        <Link
          href="/organizer/create-event"
          className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/25 inline-flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Tạo Sự Kiện Mới
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Tổng sự kiện
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalConcerts}
          </div>
          <div className="text-[11px] text-slate-500">
            Tất cả các concert đã tạo
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Đang mở bán
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {publishedConcerts}
          </div>
          <div className="text-[11px] text-emerald-500/80">
            Khán giả đang mua vé
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Chờ sàn duyệt
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {pendingConcerts}
          </div>
          <div className="text-[11px] text-amber-500/80">
            Admin Tixora đang xét duyệt
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Vé phát hành
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400">
            {new Intl.NumberFormat("vi-VN").format(totalTickets)}
          </div>
          <div className="text-[11px] text-slate-500">
            Tổng tải lượng chỗ ngồi
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="bg-slate-900/70 rounded-3xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              Sự Kiện Của Bạn
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách các show diễn do chính tài khoản của bạn quản lý
            </p>
          </div>

          <Link
            href="/organizer/events"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
            Đang tải dữ liệu sự kiện...
          </div>
        ) : concerts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-400">Bạn chưa tạo sự kiện nào.</p>
            <Link
              href="/organizer/create-event"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              Bắt đầu tạo sự kiện đầu tiên
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concerts.slice(0, 6).map((concert) => (
              <div
                key={concert.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getConcertPosterUrl(concert.posterUrl)}
                      alt={concert.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      {concert.status === "PUBLISHED" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs">
                          Đang mở bán
                        </span>
                      )}
                      {concert.status === "PENDING_REVIEW" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-white backdrop-blur-xs animate-pulse">
                          Chờ duyệt
                        </span>
                      )}
                      {concert.status === "DRAFT" && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-white backdrop-blur-xs">
                          Bản nháp
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-white text-sm line-clamp-1">
                      {concert.title}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">
                        {concert.venue ||
                          concert.city ||
                          "Chưa cập nhật địa điểm"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {concert.date} - {concert.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-850 mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary">
                    {concert.price}
                  </span>
                  {concert.status === "PUBLISHED" ? (
                    <Link
                      href={`/concerts/${concert.id}`}
                      target="_blank"
                      className="text-slate-400 hover:text-white inline-flex items-center gap-1"
                    >
                      Trang đặt vé <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Chưa mở bán
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
