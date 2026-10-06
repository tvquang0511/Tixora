"use client";

import {
  Calendar,
  Search,
  ArrowUpRight,
  User,
  Phone,
  Mail,
} from "lucide-react";
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
    <div className="card overflow-hidden">
      {/* Header & Search */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Hiệu suất tài chính theo Ban tổ chức
          </h2>
          <p className="text-[11px] text-slate-500">
            Đo lường GMV, phí sàn Tixora và thị phần của từng đơn vị tổ chức
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên BTC, email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-box w-full pl-8 pr-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="htcaa-table-wrap">
        <table className="htcaa-table">
          <thead>
            <tr>
              <th className="w-72">Ban tổ chức & Đại diện</th>
              <th>Liên hệ</th>
              <th className="text-center">Số sự kiện</th>
              <th className="text-right">Tổng GMV</th>
              <th className="text-right">Phí sàn (5%)</th>
              <th className="text-center">Thị phần</th>
              <th className="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-slate-400 text-xs"
                >
                  Đang tải danh sách ban tổ chức...
                </td>
              </tr>
            ) : organizers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
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
                    className={isSelected ? "bg-blue-50/40" : ""}
                  >
                    {/* Organization & Contact */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0e54a3] shrink-0 font-bold text-xs">
                          {org.organization_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {org.organization_name}
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
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[160px]">
                          {org.email}
                        </span>
                      </div>
                      {org.phone_number && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
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

                    {/* Actions */}
                    <td className="text-right">
                      <button
                        onClick={() => onFilterConcerts(org.organizer_id)}
                        className="btn btn-secondary btn-sm inline-flex items-center gap-1 text-[11px] py-1 px-2"
                        title="Xem danh sách các concert của Ban tổ chức này"
                      >
                        <span>Xem các show</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
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
  );
}
