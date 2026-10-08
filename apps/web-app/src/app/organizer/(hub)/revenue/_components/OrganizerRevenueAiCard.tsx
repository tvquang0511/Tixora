"use client";

import { useState } from "react";
import {
  organizerRevenueService,
  OrganizerRevenueAiInsightResponse,
} from "@/services/organizer-revenue.service";

export function OrganizerRevenueAiCard() {
  const [insight, setInsight] =
    useState<OrganizerRevenueAiInsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const fetchAiInsights = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await organizerRevenueService.getAiInsights(forceRefresh);
      setInsight(data);
      setIsExpanded(true);
    } catch (err: unknown) {
      console.error("Failed to load AI revenue insights", err);
      setError("Chưa thể trích xuất phân tích AI lúc này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trạng thái ban đầu: Chưa bấm phân tích
  if (!insight && !loading && !error) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                AI REVENUE INSIGHTS
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Theo yêu cầu
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Phân tích doanh thu & Chiến lược kích cầu
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đánh giá cụ thể theo dữ liệu bán vé thực tế: ngày đạt đỉnh, show
              dẫn đầu, cảnh báo lấp đầy và đề xuất số liệu.
            </p>
          </div>

          <button
            onClick={() => void fetchAiInsights(false)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Phân tích bằng AI
          </button>
        </div>
      </div>
    );
  }

  // Trạng thái đang tải
  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-56 bg-slate-800 rounded" />
          <div className="h-8 w-28 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-800/60 rounded-xl" />
          <div className="h-24 bg-slate-800/60 rounded-xl" />
          <div className="h-24 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // Trạng thái lỗi
  if (error && !insight) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-red-900/40 flex items-center justify-between">
        <span className="text-xs text-red-400">{error}</span>
        <button
          onClick={() => void fetchAiInsights(true)}
          className="text-xs text-slate-200 hover:text-white font-medium underline transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Trạng thái thu gọn
  if (!isExpanded && insight) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">Báo cáo AI Doanh thu</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-slate-400">
            Cập nhật lúc{" "}
            {new Date(insight.analyzed_at).toLocaleTimeString("vi-VN")}
          </span>
          {insight.is_cached && (
            <span className="ml-2 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              Cache 1h
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs text-teal-400 hover:text-teal-300 font-semibold px-3 py-1.5 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Xem chi tiết
        </button>
      </div>
    );
  }

  // Trạng thái hiển thị chi tiết (đã bỏ toàn bộ icon)
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              AI REVENUE INSIGHTS
            </span>
            {insight?.is_cached && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Cache 1h
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white mt-0.5">
            Phân tích số liệu & Chiến lược kích cầu bán vé
          </h3>
          <p className="text-xs text-slate-400">
            Dữ liệu trích xuất trực tiếp từ các đơn đặt vé và công suất khán
            phòng của Ban tổ chức
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => void fetchAiInsights(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {refreshing ? "Đang phân tích..." : "Làm mới"}
          </button>

          <button
            onClick={() => setIsExpanded(false)}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* 3 Cột chỉ số chính */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Khung giờ & Thời điểm vàng */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            DOANH SỐ & THỜI ĐIỂM VÀNG
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight?.peak_purchasing_hours}
          </p>
        </div>

        {/* Hiệu suất sự kiện & Hạng vé */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1.5">
            HIỆU SUẤT TỪNG SỰ KIỆN
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight?.tier_performance_analysis}
          </p>
        </div>

        {/* Tỷ lệ lấp đầy & Cảnh báo */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
            TỶ LỆ LẤP ĐẦY & CẢNH BÁO
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insight?.occupancy_summary}
          </p>
        </div>
      </div>

      {/* Đề xuất chiến thuật kích cầu */}
      {insight?.tactical_recommendations &&
        insight.tactical_recommendations.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider mb-2">
              ĐỀ XUẤT HÀNH ĐỘNG KÍCH CẦU THỰC CHIẾN
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insight.tactical_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-200 leading-relaxed"
                >
                  <span className="font-bold text-teal-400 mr-1.5">
                    {idx + 1}.
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
