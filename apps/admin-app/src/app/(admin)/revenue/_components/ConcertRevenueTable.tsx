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
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 px-1">
        <div>
          <span className="sub">
            Doanh thu theo sự kiện [{formatDateRangeLabel()}]
          </span>
        </div>
        <div className="search-box w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            value={tableSearch}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
          />
        </div>
      </div>

      <div className="htcaa-table-wrap">
        <div className="overflow-x-auto min-h-[320px]">
          {isConcertsLoading ? (
            <div className="py-16 text-center text-slate-500 font-sans text-xs flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0052ff] border-t-transparent" />
              <span>Đang tải số liệu doanh thu sự kiện...</span>
            </div>
          ) : filteredConcerts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-sans text-xs">
              Không tìm thấy sự kiện nào khớp bộ lọc.
            </div>
          ) : (
            <table className="htcaa-table">
              <thead>
                <tr>
                  <th>Sự kiện</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th>Thời gian</th>
                  <th style={{ textAlign: "right" }}>Doanh số (GMV)</th>
                  <th style={{ textAlign: "right" }}>Phí sàn (5%)</th>
                  <th style={{ textAlign: "right" }}>Thực nhận BTC</th>
                  <th style={{ textAlign: "center" }}>Vé bán</th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConcerts.map((item) => {
                  const platformFee = Math.round(item.revenue * 0.05);
                  const netPayout = item.revenue - platformFee;
                  return (
                    <tr
                      key={item.concert_id}
                      className="row-click group"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-slate-100 border border-slate-200 relative">
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
                      <td style={{ textAlign: "center" }}>
                        <StatusBadge
                          status={item.status}
                          variant="concert"
                          size="xs"
                        />
                      </td>
                      <td className="text-slate-600 font-mono tabular-nums text-xs">
                        {formatConcertDate(item.start_time)}
                      </td>
                      <td style={{ textAlign: "right" }} className="font-bold text-slate-900 font-mono tabular-nums text-xs">
                        {formatVND(item.revenue)}
                      </td>
                      <td style={{ textAlign: "right" }} className="font-medium text-rose-700 font-mono tabular-nums text-xs">
                        - {formatVND(platformFee)}
                      </td>
                      <td style={{ textAlign: "right" }} className="font-bold text-[#0052ff] font-mono tabular-nums text-xs">
                        {formatVND(netPayout)}
                      </td>
                      <td style={{ textAlign: "center" }} className="font-medium text-slate-900 font-mono tabular-nums text-xs">
                        {item.tickets_sold.toLocaleString("vi-VN")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => onViewDetail(item.concert_id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isConcertsLoading && (
          <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredConcerts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              itemLabel="sự kiện"
            />
          </div>
        )}
      </div>
    </div>
  );
}
