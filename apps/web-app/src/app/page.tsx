"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { SiteShell } from "@/components/common";
import { useToast } from "@/context/ToastContext";
import { HeroCarousel } from "@/components/screens";
import {
  getConcerts,
  DEFAULT_POSTER_URL,
  type ConcertCardItem,
} from "@/services/concert.service";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Ticket,
  ChevronRight,
  TrendingUp,
  Music2,
} from "lucide-react";

// ─── Danh Sách Nghệ Sĩ Được Yêu Thích (Lineup Nổi Bật) ─────────────────────
const POPULAR_ARTISTS = [
  {
    name: "Đen Vâu",
    role: "Rapper / Nhạc sĩ",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    query: "Đen Vâu",
  },
  {
    name: "Vũ.",
    role: "Hoàng tử Indie",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    query: "Vũ",
  },
  {
    name: "Chillies",
    role: "Pop / Rock Band",
    avatar:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
    query: "Chillies",
  },
  {
    name: "HIEUTHUHAI",
    role: "Rapper / Singer",
    avatar:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80",
    query: "HIEUTHUHAI",
  },
  {
    name: "Alan Walker",
    role: "World Top DJ",
    avatar:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80",
    query: "Alan Walker",
  },
];

// ─── 1. Sự Kiện Nổi Bật (3 Sự Kiện Bán Được Nhiều Vé Nhất) ───────────────────
function FeaturedShowsSection({ concerts }: { concerts: ConcertCardItem[] }) {
  const topConcerts = concerts.slice(0, 3);
  if (topConcerts.length === 0) return null;

  const rankBadges = [
    {
      label: "#1 TOP BÁN CHẠY",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      glowColor: "shadow-amber-500/10 border-amber-500/30",
    },
    {
      label: "#2 XU HƯỚNG",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      glowColor: "shadow-cyan-500/10 border-cyan-500/30",
    },
    {
      label: "#3 ĐƯỢC YÊU THÍCH",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      glowColor: "shadow-purple-500/10 border-purple-500/30",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Sự Kiện Nổi Bật
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant/70">
            Top những sự kiện âm nhạc có lượng vé bán ra chạy nhất hiện nay
          </p>
        </div>
        <Link
          href="/concerts"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-container transition-colors group"
        >
          Xem tất cả sự kiện
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* 3 Large Showcase Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {topConcerts.map((concert, idx) => {
          const badge = rankBadges[idx] || rankBadges[2];
          return (
            <Link
              key={concert.id}
              href={`/concerts/${concert.id}`}
              className={`group relative flex flex-col rounded-3xl border bg-slate-900/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-lg cursor-pointer ${badge.glowColor}`}
            >
              {/* Poster Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    concert.posterUrl && concert.posterUrl.startsWith("http")
                      ? concert.posterUrl
                      : DEFAULT_POSTER_URL
                  }
                  alt={concert.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Rank Badge */}
                <span
                  className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-md ${badge.badgeColor}`}
                >
                  <TrendingUp size={12} />
                  {badge.label}
                </span>

                {/* Category Pill */}
                {concert.genre && (
                  <span className="absolute top-3 right-3 z-10 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-primary backdrop-blur-md shadow-sm">
                    {concert.genre}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="line-clamp-2 font-display text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                    {concert.title}
                  </h3>

                  <div className="space-y-1 text-xs text-on-surface-variant/75">
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={13}
                        className="text-primary/70 shrink-0"
                      />
                      <span>{concert.date}</span>
                    </div>
                    {concert.venue && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin
                          size={13}
                          className="text-primary/70 shrink-0"
                        />
                        <span className="truncate">{concert.venue}</span>
                      </div>
                    )}
                    {concert.performers && concert.performers.length > 0 && (
                      <div className="flex items-center gap-1.5 truncate text-on-surface-variant/60">
                        <Music2
                          size={13}
                          className="text-primary/70 shrink-0"
                        />
                        <span className="truncate">
                          {concert.performers.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-on-surface-variant/60 block">
                      Giá từ
                    </span>
                    <span className="text-sm font-black text-primary">
                      {concert.price}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/25 px-3 py-1.5 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    Mua vé
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── 2. Sự Kiện Sắp Diễn Ra (8 Sự Kiện Sắp Tới Nhất) ─────────────────────────
function UpcomingEventsSection({ concerts }: { concerts: ConcertCardItem[] }) {
  // Sắp xếp các concert theo thời gian diễn ra gần nhất đến xa hơn
  const upcomingList = [...concerts]
    .sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeA - timeB;
    })
    .slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-slate-900/60">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Sự Kiện Sắp Diễn Ra
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant/70">
            Khám phá các đêm nhạc và sự kiện sắp khởi tranh gần nhất
          </p>
        </div>

        <Link
          href="/concerts"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline self-start sm:self-auto"
        >
          Xem tất cả ({concerts.length}) sự kiện
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Events Grid (8 Items) */}
      {upcomingList.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant/60">
          <Ticket className="mx-auto h-12 w-12 text-slate-700 mb-3" />
          <p className="text-base font-semibold">
            Hiện tại chưa có sự kiện nào sắp diễn ra.
          </p>
          <p className="text-xs text-on-surface-variant/50 mt-1">
            Vui lòng quay lại sau hoặc liên hệ ban tổ chức để biết thêm chi
            tiết.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {upcomingList.map((concert) => (
            <Link
              key={concert.id}
              href={`/concerts/${concert.id}`}
              className="group flex flex-col rounded-2xl border border-slate-850 bg-slate-900/40 p-3 hover:bg-slate-900/90 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 focus:outline-none cursor-pointer"
            >
              {/* Poster */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    concert.posterUrl && concert.posterUrl.startsWith("http")
                      ? concert.posterUrl
                      : DEFAULT_POSTER_URL
                  }
                  alt={concert.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {concert.genre && (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-950/80 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-primary backdrop-blur-md">
                    {concert.genre}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col justify-between pt-3.5 pb-1 px-1">
                <div>
                  <h3 className="line-clamp-2 text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                    {concert.title}
                  </h3>

                  <div className="mt-2.5 space-y-1.5 text-xs text-on-surface-variant/70">
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={12}
                        className="text-primary/70 shrink-0"
                      />
                      <span>{concert.date}</span>
                    </div>
                    {concert.venue && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin
                          size={12}
                          className="text-primary/70 shrink-0"
                        />
                        <span className="truncate">{concert.venue}</span>
                      </div>
                    )}
                    {concert.performers && concert.performers.length > 0 && (
                      <div className="flex items-center gap-1.5 truncate text-[11px] text-on-surface-variant/60">
                        <Music2
                          size={11}
                          className="text-primary/70 shrink-0"
                        />
                        <span className="truncate">
                          {concert.performers.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-on-surface-variant/50 block">
                      Giá từ
                    </span>
                    <span className="text-xs font-black text-primary">
                      {concert.price}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                    Chi tiết
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── 3. Lineup Nghệ Sĩ Được Yêu Thích ─────────────────────────────────────────
function ArtistSpotlightSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 border-t border-slate-900/60">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface">
            Nghệ Sĩ Được Yêu Thích
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant/70">
            Dàn nghệ sĩ và ban nhạc đình đám tại các sự kiện Tixora
          </p>
        </div>
        <Link
          href="/concerts"
          className="text-xs font-bold text-primary hover:underline transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {POPULAR_ARTISTS.map((artist) => (
          <Link
            key={artist.name}
            href={`/concerts?q=${encodeURIComponent(artist.query)}`}
            className="group flex flex-col items-center rounded-2xl border border-slate-850 bg-slate-900/30 p-4 text-center transition-all duration-300 hover:bg-slate-900/80 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
          >
            <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-primary/30 p-0.5 group-hover:border-primary transition-colors shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artist.avatar}
                alt={artist.name}
                className="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h4 className="line-clamp-1 text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
              {artist.name}
            </h4>
            <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
              {artist.role}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Main Interactive Content Container ─────────────────────────────────────
function MainHomeContent() {
  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { error: showErrorToast } = useToast();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await getConcerts({ limit: 20, status: "PUBLISHED" });
        if (active) {
          setConcerts(res.items);
        }
      } catch {
        if (active) {
          showErrorToast("Không thể tải danh sách concert nổi bật.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [showErrorToast]);

  return (
    <>
      {loading ? (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-xs text-on-surface-variant/60">
            Đang tải những sự kiện âm nhạc hấp dẫn nhất...
          </p>
        </div>
      ) : (
        <>
          {/* 1. Sự Kiện Nổi Bật (3 Sự Kiện Bán Chạy Nhất) */}
          <FeaturedShowsSection concerts={concerts} />

          {/* 2. Sự Kiện Sắp Diễn Ra (8 Sự Kiện Sắp Tới Nhất) */}
          <UpcomingEventsSection concerts={concerts} />

          {/* 3. Nghệ Sĩ Được Yêu Thích */}
          <ArtistSpotlightSection />
        </>
      )}
    </>
  );
}

export default function Home() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="auth-page flex min-h-screen items-center justify-center px-4 bg-slate-950">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-on-surface-variant">
            Đang tải Tixora...
          </p>
        </div>
      </main>
    );
  }

  return (
    <SiteShell active="/">
      {/* 1. Hero Carousel giữ nguyên */}
      <HeroCarousel />

      {/* 2. Dữ liệu sự kiện thực tế từ Database */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 text-center text-xs text-on-surface-variant/50">
            Đang tải sự kiện nổi bật...
          </div>
        }
      >
        <MainHomeContent />
      </Suspense>
    </SiteShell>
  );
}
