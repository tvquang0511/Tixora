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
  Search,
  MapPin,
  Clock,
  ExternalLink,
  RotateCw,
  Building2,
  Ticket,
} from "lucide-react";

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<ConcertCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    getConcerts({
      organizer_id: user.id,
      limit: 100,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: search.trim() || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    getConcerts({
      organizer_id: user.id,
      limit: 100,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: search.trim() || undefined,
    })
      .then((res) => {
        setConcerts(res.items || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load organizer events", err);
        setIsLoading(false);
      });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sự Kiện Của Tôi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý danh sách các show diễn, kiểm tra trạng thái phê duyệt của
            sàn
          </p>
        </div>

        <Link
          href="/organizer/create-event"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 inline-flex items-center self-start sm:self-auto transition-transform active:scale-95"
        >
          Tạo sự kiện mới
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl overflow-x-auto">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "PUBLISHED", label: "Đang mở bán" },
            { key: "PENDING_REVIEW", label: "Chờ sàn duyệt" },
            { key: "DRAFT", label: "Bản nháp" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-slate-800 text-teal-400 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 md:max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Events Table / Card List */}
      <div className="bg-slate-900/70 rounded-3xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
            Đang tải dữ liệu sự kiện...
          </div>
        ) : concerts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-800 mx-auto" />
            <p className="text-sm text-slate-400">
              Không tìm thấy sự kiện nào trong danh mục này.
            </p>
            <Link
              href="/organizer/create-event"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-transform active:scale-95"
            >
              Tạo sự kiện mới
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {concerts.map((concert) => {
              const totalQuantity = (concert.ticketTiers || []).reduce(
                (sum, t) => sum + (t.total_quantity || 0),
                0,
              );

              return (
                <div
                  key={concert.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getConcertPosterUrl(concert.posterUrl)}
                        alt={concert.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base">
                          {concert.title}
                        </h3>
                        {concert.status === "PUBLISHED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Đang mở bán
                          </span>
                        )}
                        {concert.status === "PENDING_REVIEW" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            Chờ sàn duyệt
                          </span>
                        )}
                        {concert.status === "DRAFT" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Bản nháp
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-400" />
                          {concert.venue || concert.city || "Chưa cập nhật"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {concert.date} - {concert.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-teal-400" />
                          {concert.ticketTiers?.length || 0} hạng vé (
                          {totalQuantity} ghế)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {concert.status === "PUBLISHED" && (
                      <Link
                        href={`/concerts/${concert.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        Trang bán vé
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
