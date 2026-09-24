"use client";

import { Building2, MapPin, Search } from "lucide-react";
import { getConcertPosterUrl } from "@/services/concert.service";
import { type RevenueByConcertItem } from "@/services/revenue.service";
import { StatusBadge } from "../../_components/StatusBadge";
import { Pagination } from "../../_components/Pagination";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatConcertDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBA";
  return (
    d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
};

interface ConcertRevenueTableProps {
  paginatedConcerts: RevenueByConcertItem[];
  filteredConcerts: RevenueByConcertItem[];
  isConcertsLoading: boolean;
  tableSearch: string;
  fromDate: string;
  toDate: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onSearchChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onViewDetail: (id: string) => void;
}

export function ConcertRevenueTable({
  paginatedConcerts,
  filteredConcerts,
  isConcertsLoading,
  tableSearch,
  fromDate,
  toDate,
  currentPage,
  totalPages,
  itemsPerPage,
  onSearchChange,
  onPageChange,
  onViewDetail,
}: ConcertRevenueTableProps) {
  const formatDateRangeLabel = () => {
    const formatDate = (date: string) =>
      new Date(date).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    if (fromDate && toDate)
      return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    if (fromDate) return `Từ ${formatDate(fromDate)}`;
    if (toDate) return `Đến ${formatDate(toDate)}`;
    return "Tất cả thời gian";
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 rounded-lg border border-teal-100 text-teal-700">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
            Doanh thu theo sự kiện
          </h3>
          <span className="text-xs font-sans text-slate-500">
            [{formatDateRangeLabel()}]
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            value={tableSearch}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
            className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white font-sans text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        {isConcertsLoading ? (
          <div className="py-16 text-center text-slate-500 font-sans text-xs flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            <span>Đang tải số liệu doanh thu sự kiện...</span>
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-sans text-xs border border-slate-100 rounded-lg bg-slate-50">
            Không tìm thấy sự kiện nào khớp bộ lọc.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/70 font-sans text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3">Sự kiện</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3 text-right">Doanh thu</th>
                <th className="p-3 text-center">Đơn hoàn tất</th>
                <th className="p-3 text-center">Vé bán ra</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedConcerts.map((item) => (
                <tr
                  key={item.concert_id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getConcertPosterUrl(item.poster_url)}
                          alt={item.concert_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 leading-tight">
                          {item.concert_name}
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-sans">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="line-clamp-1">
                              {item.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={item.status} variant="concert" />
                  </td>
                  <td className="p-3 text-slate-600 font-sans text-[11px]">
                    {formatConcertDate(item.start_time)}
                  </td>
                  <td className="p-3 text-right font-medium text-slate-900 font-mono text-xs">
                    {formatVND(item.revenue)}
                  </td>
                  <td className="p-3 text-center font-medium text-slate-900 font-mono">
                    {item.paid_orders.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 text-center font-medium text-slate-900 font-mono">
                    {item.tickets_sold.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onViewDetail(item.concert_id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-sans text-xs font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isConcertsLoading && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredConcerts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="sự kiện"
        />
      )}
    </section>
  );
}
