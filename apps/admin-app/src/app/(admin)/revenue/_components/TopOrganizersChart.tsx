"use client";

import { ArrowUpRight, Award } from "lucide-react";
import { type RevenueByOrganizerItem } from "@/services/revenue.service";

interface TopOrganizersChartProps {
  organizers: RevenueByOrganizerItem[];
  isLoading: boolean;
  onSelectOrganizer: (orgId: string) => void;
  selectedOrganizerId: string;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function TopOrganizersChart({
  organizers,
  isLoading,
  onSelectOrganizer,
  selectedOrganizerId,
}: TopOrganizersChartProps) {
  const topOrganizers = organizers.slice(0, 5);
  const maxGmv = topOrganizers[0]?.gmv || 1;

  return (
    <div className="card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0e54a3]" />
            <h3 className="text-sm font-bold text-slate-900">
              Top Ban tổ chức theo GMV
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Thị phần sàn
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-2 bg-slate-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : topOrganizers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Chưa có dữ liệu ban tổ chức trong kỳ này
          </div>
        ) : (
          <div className="space-y-3">
            {topOrganizers.map((org, index) => {
              const isSelected = selectedOrganizerId === org.organizer_id;
              const barWidth = Math.max(
                Math.round((org.gmv / maxGmv) * 100),
                4,
              );

              return (
                <div
                  key={org.organizer_id}
                  onClick={() => onSelectOrganizer(org.organizer_id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/60 border-[#0e54a3]"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          index === 0
                            ? "bg-amber-100 text-amber-800"
                            : index === 1
                              ? "bg-slate-200 text-slate-800"
                              : index === 2
                                ? "bg-amber-50 text-amber-900 border border-amber-300"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {org.organization_name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[#0e54a3] tabular-nums">
                        {formatVND(org.gmv)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 tabular-nums">
                        ({org.market_share}%)
                      </span>
                    </div>
                  </div>

                  {/* Proportional bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0
                          ? "bg-[#0e54a3]"
                          : index === 1
                            ? "bg-[#0284c7]"
                            : "bg-[#7dd3fc]"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>
                      {org.total_concerts} sự kiện • {org.tickets_sold} vé bán
                    </span>
                    <span className="text-[#0e54a3] font-medium flex items-center gap-0.5 hover:underline">
                      Xem các show
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Hiển thị top 5 đối tác lớn nhất</span>
        {selectedOrganizerId !== "ALL" && (
          <button
            onClick={() => onSelectOrganizer("ALL")}
            className="text-[11px] text-[#0e54a3] font-bold hover:underline"
          >
            Bỏ lọc BTC
          </button>
        )}
      </div>
    </div>
  );
}
