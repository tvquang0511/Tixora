"use client";

import { Calendar, Search, User, Phone, Mail, X } from "lucide-react";
import { type RevenueByOrganizerItem } from "@/services/revenue.service";
import { Pagination } from "@/app/(admin)/_components/Pagination";

interface OrganizerRevenueTableProps {
  organizers: RevenueByOrganizerItem[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onFilterConcerts: (orgId: string) => void;
  selectedOrganizerId: string;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function OrganizerRevenueTable({
  organizers,
  isLoading,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onFilterConcerts,
  selectedOrganizerId,
}: OrganizerRevenueTableProps) {
  return (
    <div className="space-y-2">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 px-1">
        <div>
          <span className="sub">
            Hiệu suất tài chính theo Ban tổ chức ({totalItems})
          </span>
        </div>

        <div className="search-box w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên BTC, email, SĐT..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="htcaa-table-wrap">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="htcaa-table">
            <thead>
              <tr>
                <th className="w-72">Ban tổ chức & Đại diện</th>
                <th>Liên hệ</th>
                <th className="text-center">Số sự kiện</th>
                <th className="text-right">Tổng GMV</th>
                <th className="text-right">Phí sàn (5%)</th>
                <th className="text-center">Thị phần</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-400 text-xs"
                  >
                    Đang tải danh sách ban tổ chức...
                  </td>
                </tr>
              ) : organizers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-400 text-xs"
                  >
                    Không tìm thấy ban tổ chức nào phù hợp
                  </td>
                </tr>
              ) : (
                organizers.map((org) => {
                  const isSelected = selectedOrganizerId === org.organizer_id;

                  return (
                    <tr
                      key={org.organizer_id}
                      onClick={() =>
                        onFilterConcerts(isSelected ? "ALL" : org.organizer_id)
                      }
                      className={`row-click group cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 border-l-2 border-l-[#0e54a3]"
                          : "hover:bg-slate-50"
                      }`}
                      title={
                        isSelected
                          ? "Bấm để bỏ chọn và xem tất cả sự kiện"
                          : "Bấm để lọc sự kiện của ban tổ chức này"
                      }
                    >
                      {/* Organization & Contact */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0e54a3] shrink-0 font-bold text-xs">
                            {org.organization_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                              <span>{org.organization_name}</span>
                              {isSelected && (
                                <span className="htcaa-badge-count-pill text-[10px] bg-blue-100 text-[#0e54a3] border-blue-300">
                                  Đang lọc show
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{org.contact_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div className="text-xs text-slate-700 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[160px]">
                            {org.email}
                          </span>
                        </div>
                        {org.phone_number && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{org.phone_number}</span>
                          </div>
                        )}
                      </td>

                      {/* Total Concerts */}
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {org.total_concerts}
                        </span>
                      </td>

                      {/* GMV */}
                      <td className="text-right tabular-nums font-bold text-slate-900 text-xs">
                        {formatVND(org.gmv)}
                      </td>

                      {/* Platform Fee */}
                      <td className="text-right tabular-nums font-semibold text-[#0e54a3] text-xs">
                        {formatVND(org.platform_fee)}
                      </td>

                      {/* Market share */}
                      <td className="text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-xs tabular-nums text-slate-700">
                          <span>{org.market_share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              itemLabel="ban tổ chức"
            />
          </div>
        )}
      </div>
    </div>
  );
}
